import assert from "node:assert";
import path from "node:path";
import { describe, it } from "node:test";
import url from "node:url";

import { deleteSync } from "del";

import {
  close,
  compile,
  getCodeFromBundle,
  getCodeFromCssBundle,
  getCodeFromSass,
  getCompiler,
  getErrors,
  getImplementationsAndAPI,
  getTestId,
  getWarnings,
} from "./helpers/index.js";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const implementations = getImplementationsAndAPI();
const syntaxStyles = ["scss", "sass"];

describe("loader", () => {
  for (const item of implementations) {
    const { name: implementationName, api, implementation } = item;

    for (const syntax of syntaxStyles) {
      it(`should work ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work with the built-in CSS support of webpack ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, {
          css: true,
          loader: { options },
        });

        const stats = await compile(compiler);
        const codeFromCssBundle = getCodeFromCssBundle(stats, compiler);

        t.assert.snapshot(codeFromCssBundle);
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should work ('${implementationName}', '${api}' API, '${syntax}' syntax) and don't modify sass options`, async (t) => {
        const testId = getTestId("language", syntax);
        const sassOptions = {
          loadPaths: ["node_modules/foundation-sites/scss"],
        };
        const options = {
          implementation,
          api,
          sassOptions,
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options);

        assert.deepStrictEqual(sassOptions, {
          loadPaths: ["node_modules/foundation-sites/scss"],
        });

        assert.strictEqual(codeFromBundle.css, codeFromSass.css);
        t.assert.snapshot(codeFromBundle.css);
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should work ('${implementationName}', '${api}' API, '${syntax}' syntax) with the "memory" cache`, async (t) => {
        const cache = path.resolve(
          __dirname,
          `./outputs/.cache/sass-loader/${implementationName}/${syntax}`,
        );

        await deleteSync(cache);

        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, {
          loader: { options },
          cache: {
            type: "memory",
          },
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

      it(`should work ('${implementationName}', '${api}' API, '${syntax}' syntax) with the "filesystem" cache`, async (t) => {
        const cache = path.resolve(
          __dirname,
          `./outputs/.cache/sass-loader/${implementationName}/${syntax}`,
        );

        await deleteSync(cache);

        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, {
          loader: { options },
          cache: {
            type: "filesystem",
            cacheDirectory: cache,
          },
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

      it(`should work with an empty file ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("empty", syntax);
        const options = {
          implementation,
          api,
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

      it(`should output an understandable error ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("error", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);

        assert.strictEqual(
          stats.compilation.fileDependencies.has(
            path.resolve(`./test/${syntax}/error.${syntax}`),
          ),
          true,
        );
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should output an understandable error when the problem in "@import" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("error-import", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);

        assert.strictEqual(
          stats.compilation.fileDependencies.has(
            path.resolve(`./test/${syntax}/error-import.${syntax}`),
          ),
          true,
        );
        assert.strictEqual(
          stats.compilation.fileDependencies.has(
            path.resolve(`./test/${syntax}/error.${syntax}`),
          ),
          true,
        );
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should output an understandable error when a file could not be found ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("error-file-not-found", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);

        assert.strictEqual(
          stats.compilation.fileDependencies.has(
            path.resolve(`./test/${syntax}/error-file-not-found.${syntax}`),
          ),
          true,
        );
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should throw an error with a explicit file and a file does not exist ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("error-file-not-found-2", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);

        assert.strictEqual(
          stats.compilation.fileDependencies.has(
            path.resolve(`./test/${syntax}/error-file-not-found-2.${syntax}`),
          ),
          true,
        );
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should work with difference "@import" at-rules ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("imports", syntax);
        const options = {
          implementation,
          api,
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

      // Test for issue: https://github.com/webpack/sass-loader/issues/32
      it(`should work with multiple "@import" at-rules ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("multiple-imports", syntax);
        const options = {
          implementation,
          api,
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

      // Test for issue: https://github.com/webpack/sass-loader/issues/73
      it(`should work with "@import" at-rules from other language style ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-other-style", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work when "@import" at-rules from scoped npm packages ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-from-npm-org-pkg", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work with relative "@import" at-rules inside an npm package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-pkg-internal-relative", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work when "@import" at-rules with extensions ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-with-extension", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work when "@import" at-rules starting with "_" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-with-underscore", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work when "@import" at-rules without extensions and do not start with "_" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId(
          "import-without-extension-and-underscore",
          syntax,
        );
        const options = {
          implementation,
          api,
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

      it(`should work with multiple "@import" at-rules without quotes ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        if (syntax === "scss") {
          return;
        }

        const testId = getTestId("import-without-quotes", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work and use the "sass" field ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-sass-field", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work and use the "style" field ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-style-field", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work and use the "main" field ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-main-field", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work and use the "main" field when the "main" value is not in the "mainFields" resolve option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-main-field", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, {
          loader: { options, resolve: { mainFields: [] } },
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

      it(`should work and use the "main" field when the "main" value already in the "mainFields" resolve option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-main-field", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, {
          loader: { options, resolve: { mainFields: ["main", "..."] } },
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

      it(`should work and use the "custom-sass" field ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-custom-sass-field", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, {
          loader: {
            options,
            resolve: { mainFields: ["custom-sass", "..."] },
          },
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

      it(`should work and use the "index" file in package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-index", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work and use the "index" file in package when the "index" value is not in the "mainFiles" resolve option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-index", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, {
          loader: { options, resolve: { mainFiles: [] } },
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

      it(`should work and use the "index" file in package when the "index" value already in the "mainFiles" resolve option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-index", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, {
          loader: { options, resolve: { mainFiles: ["index", "..."] } },
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

      it(`should prefer "mainFiles" over "mainFields" when the field contains "js" file ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId(
          "import-prefer-main-files-over-main-fields",
          syntax,
        );
        const options = {
          implementation,
          api,
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

      it(`should prefer "mainFiles" with extension over without ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId(
          "import-prefer-main-files-with-extension",
          syntax,
        );
        const options = {
          implementation,
          api,
          sassOptions: { loadPaths: ["node_modules/foundation-sites/scss"] },
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

      it(`should work and use the "_index" file in package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-_index", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work with an alias ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-alias", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, {
          resolve: {
            alias: {
              "path-to-alias": path.resolve(
                __dirname,
                syntax,
                "another",
                `alias.${syntax}`,
              ),
              "@sass": path.resolve(
                __dirname,
                "sass",
                "directory-6",
                "file",
                "_index.sass",
              ),
              "@scss": path.resolve(
                __dirname,
                "scss",
                "directory-6",
                "file",
                "_index.scss",
              ),
              "@path-to-scss-dir": path.resolve(__dirname, "scss"),
              "@path-to-sass-dir": path.resolve(__dirname, "sass"),
              "@/path-to-scss-dir": path.resolve(__dirname, "scss"),
              "@/path-to-sass-dir": path.resolve(__dirname, "sass"),
            },
          },
          loader: { options },
        });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options, { syntax });

        assert.strictEqual(codeFromBundle.css, codeFromSass.css);
        t.assert.snapshot(codeFromBundle.css);
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      // See discussion https://github.com/webpack/sass-loader/pull/573/files?#r199109203
      it(`should work and ignore all css "@import" at-rules ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-css", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work with the "bootstrap-sass" package, directly import ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("bootstrap-sass", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work with the "bootstrap-sass" package, import as a package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("bootstrap-sass-package", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work with "bootstrap" package v4, import as a package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("bootstrap-v4", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work with "bootstrap" package v4 without tilde, import as a package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("bootstrap-package-v4", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options);

        assert.strictEqual(codeFromBundle.css, codeFromSass.css);
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should work with "bootstrap" package v5, import as a package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("bootstrap-v5", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work with "bootstrap" package v5 without tilde, import as a package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("bootstrap-package-v5", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options);

        assert.strictEqual(codeFromBundle.css, codeFromSass.css);
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should work with the "foundation-sites" package, import as a package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("foundation-sites", syntax);
        const options = {
          implementation,
          api,
          sassOptions: { loadPaths: ["node_modules/foundation-sites/scss"] },
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

      it(`should work with the "foundation-sites" package, adjusting CSS output ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId(
          "foundation-sites-adjusting-css-output",
          syntax,
        );
        const options = {
          implementation,
          api,
          sassOptions: { loadPaths: ["node_modules/foundation-sites/scss"] },
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

      it(`should work and output the "compressed" outputStyle when "mode" is production ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
        };
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

      it(`should watch firstly in the "includePaths" values ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("prefer-include-paths", syntax);
        const options = {
          sassOptions: {
            loadPaths: [
              path.resolve(
                `./test/node_modules/package-with-style-field-and-css/${syntax}`,
              ),
            ],
          },
          implementation,
          api,
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

      it(`should load only sass/scss files for the "mainFiles" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId(
          "import-package-with-js-and-css-main-files",
          syntax,
        );
        const options = {
          implementation,
          api,
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

      it(`should load files with underscore in the name ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-underscore-file", syntax);
        const options = {
          implementation,
          api,
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

      it(`should respect resolving from the "SASS_PATH" environment variable ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        process.env.SASS_PATH =
          process.platform === "win32"
            ? `${path.resolve("test", syntax, "sass_path")};${path.resolve(
                "test",
                syntax,
                "sass_path_other",
              )}`
            : `${path.resolve("test", syntax, "sass_path")}:${path.resolve(
                "test",
                syntax,
                "sass_path_other",
              )}`;

        const testId = getTestId("sass_path-env", syntax);
        const options = {
          implementation,
          api,
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

        delete process.env.SASS_PATH;
      });

      it(`should work with a package with "sass" and "exports" fields ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-package-with-exports", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work with a package with "sass" and "exports" fields and a custom condition (theme1) ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId(
          "import-package-with-exports-and-custom-condition",
          syntax,
        );
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, {
          loader: { options },
          resolve: {
            conditionNames: ["theme1", "..."],
          },
        });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options, {
          packageExportsCustomConditionTestVariant: 1,
        });

        assert.strictEqual(codeFromBundle.css, codeFromSass.css);
        t.assert.snapshot(codeFromBundle.css);
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should work with a package with "sass" and "exports" fields and a custom condition (theme2) ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId(
          "import-package-with-exports-and-custom-condition",
          syntax,
        );
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, {
          loader: { options },
          resolve: {
            conditionNames: ["theme2", "..."],
          },
        });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options, {
          packageExportsCustomConditionTestVariant: 2,
        });

        assert.strictEqual(codeFromBundle.css, codeFromSass.css);
        t.assert.snapshot(codeFromBundle.css);
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should resolve server-relative URLs ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-absolute-path", syntax);
        const options = {
          implementation,
          api,
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

      it(`should resolve absolute paths ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-absolute-path", syntax);
        const options = {
          implementation,
          api,
          additionalData: (content) =>
            content
              .replaceAll(
                /\/scss\/language.scss/g,
                url.pathToFileURL(
                  path.resolve(__dirname, "scss/language.scss"),
                ),
              )
              .replaceAll(
                /\/sass\/language.sass/g,
                url.pathToFileURL(
                  path.resolve(__dirname, "sass/language.sass"),
                ),
              ),
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

      it(`should throw an error on ambiguous import (only on "dart-sass") ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-ambiguous", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);

        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should prefer relative import ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("package-with-same-import", syntax);
        const options = {
          implementation,
          api,
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

      it(`should work with the 'resolve.byDependency.sass' option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("by-dependency", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, {
          loader: { options },
          resolve: {
            byDependency: {
              sass: {
                mainFiles: ["custom"],
              },
            },
          },
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

      it(`should throw an error on circular import ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("import-circular", syntax);
        const options = {
          implementation,
          api,
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);

        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should work prefer \`loadPaths\` over \`SASS_PATH\` ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        process.env.SASS_PATH =
          process.platform === "win32"
            ? `${path.resolve("test", syntax, "sass_path")};${path.resolve(
                __dirname,
                "outside",
                "my-pkg-env",
              )}`
            : `${path.resolve("test", syntax, "sass_path")}:${path.resolve(
                __dirname,
                "outside",
                "my-pkg-env",
              )}`;

        const testId = getTestId("env-and-paths", syntax);
        const options = {
          implementation,
          api,
          sassOptions: {
            loadPaths: [path.resolve(__dirname, "outside", "my-pkg-path")],
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

        delete process.env.SASS_PATH;
      });

      if (
        implementationName === "dart-sass" ||
        implementationName === "sass-embedded"
      ) {
        it(`should work ('${implementationName}', '${api}' API, '${syntax}' syntax) with "@charset "UTF-8";"`, async (t) => {
          const testId = getTestId("charset-utf-8", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work ('${implementationName}', '${api}' API, '${syntax}' syntax) add "@charset "UTF-8";" for non ascii characters`, async (t) => {
          const testId = getTestId("non-ascii-characters", syntax);
          const options = {
            implementation,
            api,
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

        it(`should remove the BOM from the compiled CSS ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("charset-utf-8", syntax);
          const options = {
            implementation,
            api,
            // `dart-sass` prepends a BOM to the `compressed` output when it
            // contains non ASCII characters
            sassOptions: { style: "compressed" },
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);
          const codeFromBundle = getCodeFromBundle(stats, compiler);

          assert.notStrictEqual(codeFromBundle.css.charCodeAt(0), 0xfe_ff);
          t.assert.snapshot(codeFromBundle.css);
          t.assert.snapshot(getWarnings(stats));
          t.assert.snapshot(getErrors(stats));

          await close(compiler);
        });

        it(`should work ('${implementationName}', '${api}' API, '${syntax}' syntax) to disable "@charset "UTF-8";" generation`, async (t) => {
          const testId = getTestId("charset-utf-8", syntax);
          const options = {
            implementation,
            api,
            sassOptions: { charset: false },
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

        it(`should output an understandable error with a problem in "@use" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("error-use", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);

          assert.strictEqual(
            stats.compilation.fileDependencies.has(
              path.resolve(`./test/${syntax}/error-use.${syntax}`),
            ),
            true,
          );
          assert.strictEqual(
            stats.compilation.fileDependencies.has(
              path.resolve(`./test/${syntax}/error.${syntax}`),
            ),
            true,
          );
          t.assert.snapshot(getWarnings(stats));
          t.assert.snapshot(getErrors(stats));

          await close(compiler);
        });

        it(`should output an understandable error when a file could not be found using "@use" rule ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("error-file-not-found-use", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);

          assert.strictEqual(
            stats.compilation.fileDependencies.has(
              path.resolve(
                `./test/${syntax}/error-file-not-found-use.${syntax}`,
              ),
            ),
            true,
          );
          t.assert.snapshot(getWarnings(stats));
          t.assert.snapshot(getErrors(stats));

          await close(compiler);
        });

        it(`should throw an error with a explicit file and a file does not exist using "@use" rule ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("error-file-not-found-use-2", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);

          assert.strictEqual(
            stats.compilation.fileDependencies.has(
              path.resolve(
                `./test/${syntax}/error-file-not-found-use-2.${syntax}`,
              ),
            ),
            true,
          );
          t.assert.snapshot(getWarnings(stats));
          t.assert.snapshot(getErrors(stats));

          await close(compiler);
        });

        it(`should work with different "@use" at-rules ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("uses", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work with "@use" at-rules from other language style ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-other-style", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" at-rules from scoped npm packages ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-from-npm-org-pkg", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work with relative "@use" at-rules inside an npm package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-pkg-internal-relative", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" at-rules with extensions ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-with-extension", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" at-rules starting with "_" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-with-underscore", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" at-rules without extensions and do not start with "_" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId(
            "use-without-extension-and-underscore",
            syntax,
          );
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" and use the "sass" field ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-sass-field", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" and use the "style" field ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-style-field", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" and use the "main" field ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-main-field", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" and use the "main" field when the "main" value is not in the "mainFields" resolve option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-main-field", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, {
            loader: { options, resolve: { mainFields: [] } },
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

        it(`should work when "@use" and use the "main" field when the "main" value already in the "mainFields" resolve option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-main-field", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, {
            loader: { options, resolve: { mainFields: ["main", "..."] } },
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

        it(`should work when "@use" and use the "custom-sass" field ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-custom-sass-field", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, {
            loader: {
              options,
              resolve: { mainFields: ["custom-sass", "..."] },
            },
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

        it(`should work when "@use" and use the "index" file in package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-index", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" and use the "index" file in package when the "index" value is not in the "mainFiles" resolve option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-index", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, {
            loader: { options, resolve: { mainFiles: [] } },
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

        it(`should work when "@use" and use the "index" file in package when the "index" value already in the "mainFiles" resolve option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-index", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, {
            loader: { options, resolve: { mainFiles: ["index", "..."] } },
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

        it(`should work when "@use" and use the "_index" file in package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-_index", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" with an alias ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-alias", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, {
            resolve: {
              alias: {
                "path-to-alias": path.resolve(
                  __dirname,
                  syntax,
                  "another",
                  `alias.${syntax}`,
                ),
                "@sass": path.resolve(
                  __dirname,
                  "sass",
                  "directory-6",
                  "file",
                  "_index.sass",
                ),
                "@scss": path.resolve(
                  __dirname,
                  "scss",
                  "directory-6",
                  "file",
                  "_index.scss",
                ),
                "@path-to-scss-dir": path.resolve(__dirname, "scss"),
                "@path-to-sass-dir": path.resolve(__dirname, "sass"),
                "@/path-to-scss-dir": path.resolve(__dirname, "scss"),
                "@/path-to-sass-dir": path.resolve(__dirname, "sass"),
              },
            },
            loader: { options },
          });
          const stats = await compile(compiler);
          const codeFromBundle = getCodeFromBundle(stats, compiler);
          const codeFromSass = await getCodeFromSass(testId, options, {
            syntax,
          });

          assert.strictEqual(codeFromBundle.css, codeFromSass.css);
          t.assert.snapshot(codeFromBundle.css);
          t.assert.snapshot(getWarnings(stats));
          t.assert.snapshot(getErrors(stats));

          await close(compiler);
        });

        it(`should work when "@use" with the "bootstrap-sass" package, directly import ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-bootstrap-sass", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" with the "bootstrap-sass" package, import as a package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-bootstrap-sass-package", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" with "bootstrap" package v4, import as a package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-bootstrap-v4", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" with "bootstrap" package v4 without tilde, import as a package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-bootstrap-package-v4", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" with "bootstrap" package v5, import as a package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-bootstrap-v5", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work when "@use" with "bootstrap" package v5 without tilde, import as a package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-bootstrap-package-v5", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);
          const codeFromBundle = getCodeFromBundle(stats, compiler);
          const codeFromSass = await getCodeFromSass(testId, options);

          assert.strictEqual(codeFromBundle.css, codeFromSass.css);
          t.assert.snapshot(codeFromBundle.css);
          // Deprecations are different on windows/macos and linux, and we don't need them to test here
          // t.assert.snapshot(getWarnings(stats, true));
          t.assert.snapshot(getErrors(stats));

          await close(compiler);
        });

        it(`should work with "bootstrap" and custom imports ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("bootstrap-custom-import", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);
          const codeFromBundle = getCodeFromBundle(stats, compiler);
          const codeFromSass = await getCodeFromSass(testId, options);

          assert.strictEqual(codeFromBundle.css, codeFromSass.css);
          t.assert.snapshot(getWarnings(stats));
          t.assert.snapshot(getErrors(stats));

          await close(compiler);
        });

        it(`should work with the "material-components-web" package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("import-material-components-web", syntax);
          const options = {
            implementation,
            api,
            sassOptions: { loadPaths: ["node_modules"] },
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

        it(`should work with the "material-components-web" package without the "includePaths" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("import-material-components-web", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work with the "material-components-web" package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-material-components-web", syntax);
          const options = {
            implementation,
            api,
            sassOptions: { loadPaths: ["node_modules"] },
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

        it(`should work with the "material-components-web" package without the "includePaths" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-material-components-web", syntax);
          const options = {
            implementation,
            api,
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

        it(`should import .import.${syntax} files ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("import-index-import", syntax);
          const options = {
            implementation,
            api,
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

        it(`should import .import.${syntax} files from a package ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("import-index-import-from-package", syntax);
          const options = {
            implementation,
            api,
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

        it(`should not use .import.${syntax} files ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-index-import", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);

          t.assert.snapshot(getWarnings(stats));
          t.assert.snapshot(getErrors(stats));

          await close(compiler);
        });

        it(`should prefer "${syntax})" over CSS ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-dir-with-css", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work and output deprecation message (${implementationName})`, async (t) => {
          const testId = getTestId("deprecation", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);
          const codeFromBundle = getCodeFromBundle(stats, compiler);
          const codeFromSass = await getCodeFromSass(testId, options);

          assert.strictEqual(codeFromBundle.css, codeFromSass.css);
          t.assert.snapshot(codeFromBundle.css);
          t.assert.snapshot(getWarnings(stats, true));
          t.assert.snapshot(getErrors(stats));

          await close(compiler);
        });

        it(`should throw an error on circular use ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("use-circular", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);

          t.assert.snapshot(getWarnings(stats));
          t.assert.snapshot(getErrors(stats));

          await close(compiler);
        });

        it(`should use webpack logger ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("logging", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);
          const codeFromBundle = getCodeFromBundle(stats, compiler);
          const codeFromSass = await getCodeFromSass(testId, options);
          const logs = [];

          for (const [name, value] of stats.compilation.logging) {
            if (/sass-loader/.test(name)) {
              logs.push(
                value.map((i) => ({
                  type: i.type,
                  args: i.args.map((arg) =>
                    arg
                      .replace(url.pathToFileURL(__dirname), "file:///<cwd>")
                      .replaceAll("\\", "/"),
                  ),
                })),
              );
            }
          }

          assert.strictEqual(codeFromBundle.css, codeFromSass.css);
          t.assert.snapshot(codeFromBundle.css);
          t.assert.snapshot(getWarnings(stats));
          t.assert.snapshot(getErrors(stats));

          await close(compiler);
          t.assert.snapshot(logs);
        });

        it(`should allow to use own logger ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("logging", syntax);
          const logs = [];
          const options = {
            implementation,
            api,
            sassOptions: {
              logger: {
                warn: (message) => {
                  logs.push({ type: "warn", message });
                },
                debug: (message) => {
                  logs.push({ type: "debug", message });
                },
              },
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
          t.assert.snapshot(logs);
        });

        it(`should work with the "webpack" export field ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
          const testId = getTestId("webpack-export-field", syntax);
          const options = {
            implementation,
            api,
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

        it(`should work with "pkg" prefix in "@use" ('${implementationName}', '${api}' API, '${syntax}' syntax) with "@charset "UTF-8";"`, async (t) => {
          const testId = getTestId("use-pkg", syntax);
          const options = {
            implementation,
            api,
          };
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
  }
});
