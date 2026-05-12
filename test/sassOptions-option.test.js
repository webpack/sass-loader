import path from "node:path";

import {
  close,
  compile,
  customFunctions,
  customImporter,
  getCodeFromBundle,
  getCodeFromSass,
  getCompiler,
  getErrors,
  getImplementationsAndAPI,
  getTestId,
  getWarnings,
} from "./helpers";

jest.setTimeout(30000);

const implementations = getImplementationsAndAPI();
const syntaxStyles = ["scss", "sass"];

describe("sassOptions option", () => {
  for (const item of implementations) {
    const { name: implementationName, api, implementation } = item;
    const isModernAPI = api === "modern" || api === "modern-compiler";

    for (const syntax of syntaxStyles) {
      it(`should work when the option like "Object" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
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

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should work when the option is empty "Object" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
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

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should work when the option like "Function" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        expect.assertions(6);

        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          sassOptions: (loaderContext) => {
            expect(loaderContext).toBeDefined();

            return api === "modern" || api === "modern-compiler"
              ? {}
              : { indentWidth: 10 };
          },
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options);

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should work when the option like "Function" and never return ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        expect.assertions(6);

        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          sassOptions: (loaderContext) => {
            expect(loaderContext).toBeDefined();
          },
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options);

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      if (isModernAPI) {
        it(`should ignore the "url" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
          const testId = getTestId("language", syntax);
          const options = {
            implementation,
            api,
            sassOptions: isModernAPI
              ? {}
              : {
                  url: "test",
                },
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);
          const codeFromBundle = getCodeFromBundle(stats, compiler);
          const codeFromSass = await getCodeFromSass(testId, options);

          expect(codeFromBundle.css).toBe(codeFromSass.css);
          expect(codeFromBundle.css).toMatchSnapshot("css");
          expect(getWarnings(stats)).toMatchSnapshot("warnings");
          expect(getErrors(stats)).toMatchSnapshot("errors");

          await close(compiler);
        });

        it(`should work with custom scheme import ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
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

          expect(getWarnings(stats)).toMatchSnapshot("warnings");
          expect(getErrors(stats)).toMatchSnapshot("errors");

          await close(compiler);
        });
      } else {
        it(`should ignore the "file" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
          const testId = getTestId("language", syntax);
          const options = {
            implementation,
            api,
            sassOptions: {
              file: "test",
            },
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);
          const codeFromBundle = getCodeFromBundle(stats, compiler);
          const codeFromSass = await getCodeFromSass(testId, options);

          expect(codeFromBundle.css).toBe(codeFromSass.css);
          expect(codeFromBundle.css).toMatchSnapshot("css");
          expect(getWarnings(stats)).toMatchSnapshot("warnings");
          expect(getErrors(stats)).toMatchSnapshot("errors");

          await close(compiler);
        });
      }

      it(`should ignore the "data" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
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

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should work with the "functions" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        const testId = getTestId(
          api === "modern" || api === "modern-compiler"
            ? "custom-functions-modern"
            : "custom-functions",
          syntax,
        );
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

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      if (!isModernAPI) {
        it(`should work with the "importer" as a single function option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
          const testId = getTestId("custom-importer", syntax);
          const options = {
            implementation,
            api,
            sassOptions: {
              importer: customImporter,
            },
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);
          const codeFromBundle = getCodeFromBundle(stats, compiler);
          const codeFromSass = await getCodeFromSass(testId, options);

          expect(codeFromBundle.css).toBe(codeFromSass.css);
          expect(codeFromBundle.css).toMatchSnapshot("css");
          expect(getWarnings(stats)).toMatchSnapshot("warnings");
          expect(getErrors(stats)).toMatchSnapshot("errors");

          await close(compiler);
        });

        it(`should work with the "importer" as a array of functions option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
          const testId = getTestId("custom-importer", syntax);
          const options = {
            implementation,
            api,
            sassOptions: {
              importer: [customImporter],
            },
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);
          const codeFromBundle = getCodeFromBundle(stats, compiler);
          const codeFromSass = await getCodeFromSass(testId, options);

          expect(codeFromBundle.css).toBe(codeFromSass.css);
          expect(codeFromBundle.css).toMatchSnapshot("css");
          expect(getWarnings(stats)).toMatchSnapshot("warnings");
          expect(getErrors(stats)).toMatchSnapshot("errors");

          await close(compiler);
        });

        it(`should work with the "importer" as a single function option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
          expect.assertions(4);

          const testId = getTestId("custom-importer", syntax);
          const options = {
            implementation,
            api,
            sassOptions: {
              importer(url, prev, done) {
                expect(this.webpackLoaderContext).toBeDefined();

                return done({ contents: ".a { color: red; }" });
              },
            },
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);
          const codeFromBundle = getCodeFromBundle(stats, compiler);

          expect(codeFromBundle.css).toMatchSnapshot("css");
          expect(getWarnings(stats)).toMatchSnapshot("warnings");
          expect(getErrors(stats)).toMatchSnapshot("errors");

          await close(compiler);
        });
      }

      it(`should work with the "includePaths"/"loadPaths" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        const testId = getTestId("import-include-paths", syntax);
        const options = {
          implementation,
          api,
          sassOptions:
            api === "modern" || api === "modern-compiler"
              ? {
                  loadPaths: [path.resolve(__dirname, syntax, "includePath")],
                }
              : {
                  includePaths: [
                    path.resolve(__dirname, syntax, "includePath"),
                  ],
                },
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options);

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      if (api !== "modern" && api !== "modern-compiler") {
        it(`should work with the "indentType" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
          const testId = getTestId("language", syntax);
          const options = {
            implementation,
            api,
            sassOptions: { indentType: "tab" },
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);
          const codeFromBundle = getCodeFromBundle(stats, compiler);
          const codeFromSass = await getCodeFromSass(testId, options);

          expect(codeFromBundle.css).toBe(codeFromSass.css);
          expect(codeFromBundle.css).toMatchSnapshot("css");
          expect(getWarnings(stats)).toMatchSnapshot("warnings");
          expect(getErrors(stats)).toMatchSnapshot("errors");

          await close(compiler);
        });
      }

      it(`should work with the "indentWidth" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          // Doesn't supported by modern API
          sassOptions: isModernAPI ? {} : { indentWidth: 4 },
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options);

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should work with the "indentedSyntax"/"syntax" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          sassOptions:
            api === "modern" || api === "modern-compiler"
              ? {
                  syntax: syntax === "sass" ? "indented" : "scss",
                }
              : {
                  indentedSyntax: syntax === "sass",
                },
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options);

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should work with the "linefeed" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          // Doesn't supported by modern API
          sassOptions:
            api === "modern" || api === "modern-compiler"
              ? {}
              : { linefeed: "lf" },
        };
        const compiler = getCompiler(testId, { loader: { options } });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options);

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should respect the "outputStyle"/"style" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          sassOptions:
            api === "modern" || api === "modern-compiler"
              ? { style: "expanded" }
              : { outputStyle: "expanded" },
        };
        const compiler = getCompiler(testId, {
          mode: "production",
          loader: { options },
        });
        const stats = await compile(compiler);
        const codeFromBundle = getCodeFromBundle(stats, compiler);
        const codeFromSass = await getCodeFromSass(testId, options);

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should use "compressed" output style in the "production" mode ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
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
          sassOptions:
            api === "modern" || api === "modern-compiler"
              ? { style: "compressed" }
              : { outputStyle: "compressed" },
        });

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      if (isModernAPI) {
        it(`should work with the "fatalDeprecations" option ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
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

          expect(getWarnings(stats)).toMatchSnapshot("warnings");
          expect(getErrors(stats)).toMatchSnapshot("errors");

          await close(compiler);
        });
      }
    }
  }
});
