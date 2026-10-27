import assert from "node:assert";
import path from "node:path";
import { describe, it } from "node:test";
import url from "node:url";

import {
  close,
  compile,
  getCodeFromCssBundle,
  getCompiler,
  getErrors,
  getImplementationsAndAPI,
} from "./helpers/index.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

describe("data: URI resource", () => {
  for (const { name, api, implementation } of getImplementationsAndAPI()) {
    it(`should resolve from the loader's context and read the syntax from the media type ('${name}', '${api}' API)`, async () => {
      // Inline <style lang> bodies from an HTML page reach the loader as data: URIs.
      const compiler = getCompiler("", {
        entry: [
          "data:text/x-scss;base64,QHVzZSAiLi9zY3NzL3dvcmQiOwouZGF0YS11cmktc2NzcyB7IGNvbG9yOiBibHVlOyB9Cg==",
          "data:text/x-sass;base64,LmRhdGEtdXJpLXNhc3MKICBjb2xvcjogZ3JlZW4K",
        ],
        css: true,
        rules: [
          {
            mimetype: /^text\/x-s[ac]ss$/,
            type: "css/auto",
            use: [
              {
                loader: path.join(__dirname, "../src/index.js"),
                options: { implementation, api },
              },
            ],
          },
        ],
      });
      const stats = await compile(compiler);
      const css = getCodeFromCssBundle(stats, compiler);

      assert.deepStrictEqual(getErrors(stats), []);
      // `@use "./scss/word"` resolves from the context the data: URI is given.
      assert.match(css, /\.word\s*\{\s*color: red;/);
      assert.match(css, /\.data-uri-scss\s*\{\s*color: blue;/);
      // `text/x-sass` is read as the indented syntax.
      assert.match(css, /\.data-uri-sass\s*\{\s*color: green;/);

      await close(compiler);
    });
  }
});
