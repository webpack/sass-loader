import assert from "node:assert";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  close,
  compile,
  customFunctions,
  getCodeFromBundle,
  getCodeFromSass,
  getCompiler,
  getErrors,
  getImplementationsAndAPI,
  getTestId,
  getWarnings,
} from "./helpers/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const implementations = getImplementationsAndAPI();
const syntaxStyles = ["scss", "sass"];

describe("sassOptions option", () => {
  for (const item of implementations) {
    const { name: implementationName, api, implementation } = item;

    for (const syntax of syntaxStyles) {
      it(`should work when the option like "Object" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          sassOptions: {
            indentWidth: 10,
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

      it(`should work when the option is empty "Object" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          sassOptions: {},
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

      it(`should work when the option like "Function" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          sassOptions: (loaderContext) => {
            assert.notStrictEqual(loaderContext, undefined);

            return {};
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

      it(`should work when the option like "Function" and never return ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          sassOptions: (loaderContext) => {
            assert.notStrictEqual(loaderContext, undefined);
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

      it(`should ignore the "url" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          sassOptions: {},
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

      it(`should work with custom scheme import ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("modern", syntax);
        const options = {
          implementation,
          api,
          sassOptions: {
            // https://sass-lang.com/documentation/js-api/interfaces/Importer
            importers: [
              {
                canonicalize(url) {
                  if (!url.startsWith("bgcolor:")) {
                    return null;
                  }

                  return new URL(url);
                },
                load(canonicalUrl) {
                  return {
                    contents: `body {background-color: ${canonicalUrl.pathname}}`,
                    syntax: "scss",
                  };
                },
              },
            ],
          },
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);

        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should ignore the "data" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          sassOptions: {
            data: "test",
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

      it(`should work with the "functions" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("custom-functions-modern", syntax);
        const options = {
          implementation,
          api,
          sassOptions: {
            functions: customFunctions(api, implementation),
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

      it(`should work with the "loadPaths" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-include-paths", syntax);
        const options = {
          implementation,
          api,
          sassOptions: {
            loadPaths: [path.resolve(__dirname, syntax, "includePath")],
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

      it(`should work with the "indentWidth" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          // Doesn't supported by modern API
          sassOptions: {},
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

      it(`should work with the "syntax" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          sassOptions: {
            syntax: syntax === "sass" ? "indented" : "scss",
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

      it(`should work with the "linefeed" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          // Doesn't supported by modern API
          sassOptions: {},
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

      it(`should respect the "style" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          sassOptions: { style: "expanded" },
        };
        const compiler = getCompiler(testId, {
          mode: "production",
          loader: { options },
        });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options);

        assert.strictEqual(codeFromBundle.css, codeFromSass.css);
        t.assert.snapshot(codeFromBundle.css);
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should use "compressed" output style in the "production" mode ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = { implementation, api };
        const compiler = getCompiler(testId, {
          mode: "production",
          loader: { options },
        });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, {
          ...options,
          sassOptions: { style: "compressed" },
        });

        // `dart-sass` prepends a BOM to the `compressed` output when it contains
        // non ASCII characters, the loader removes it
        assert.strictEqual(
          codeFromBundle.css,
          codeFromSass.css.replace(/^\uFEFF/, ""),
        );
        t.assert.snapshot(codeFromBundle.css);
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should work with the "fatalDeprecations" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("slash-div", syntax);
        const options = {
          implementation,
          api,
          sassOptions: {
            fatalDeprecations: ["slash-div"],
          },
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);

        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });
    }
  }
});
