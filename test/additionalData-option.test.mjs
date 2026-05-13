import assert from "node:assert";
import { describe, it } from "node:test";

import {
  close,
  compile,
  getCodeFromBundle,
  getCodeFromSass,
  getCompiler,
  getErrors,
  getImplementationsAndAPI,
  getTestId,
  getWarnings,
} from "./helpers/index.js";

const implementations = getImplementationsAndAPI();
const syntaxStyles = ["scss", "sass"];

describe("additionalData option", () => {
  for (const item of implementations) {
    const { name: implementationName, api, implementation } = item;

    for (const syntax of syntaxStyles) {
      it(`should work as a string ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("prepending-data", syntax);
        const options = {
          implementation,
          api,
          additionalData: `$prepended-data: hotpink${
            syntax === "sass" ? "\n" : ";"
          }`,
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options);

        assert.strictEqual(codeFromBundle.css, codeFromSass.css);
        t.assert.snapshot(codeFromBundle.css);
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should work as a function ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("prepending-data", syntax);
        const options = {
          implementation,
          api,
          additionalData: (content, loaderContext) => {
            assert.notStrictEqual(loaderContext, undefined);
            assert.notStrictEqual(content, undefined);

            return `$prepended-data: hotpink${
              syntax === "sass" ? "\n" : ";\n"
            }${content}`;
          },
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options);

        assert.strictEqual(codeFromBundle.css, codeFromSass.css);
        t.assert.snapshot(codeFromBundle.css);
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should work as an async function ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("prepending-data", syntax);
        const options = {
          implementation,
          api,
          additionalData: async (content, loaderContext) => {
            assert.notStrictEqual(loaderContext, undefined);
            assert.notStrictEqual(content, undefined);

            return `$prepended-data: hotpink${
              syntax === "sass" ? "\n" : ";\n"
            }${content}`;
          },
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options);

        assert.strictEqual(codeFromBundle.css, codeFromSass.css);
        t.assert.snapshot(codeFromBundle.css);
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should use same EOL on all os ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("prepending-data", syntax);
        const additionalData =
          syntax === "sass"
            ? `$prepended-data: hotpink
a
  color: $prepended-data`
            : `$prepended-data: hotpink;
a {
  color: red;
}`;
        const options = { implementation, api, additionalData };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);

        t.assert.snapshot(codeFromBundle.css);
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });
    }
  }
});
