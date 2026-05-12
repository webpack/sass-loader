import url from "node:url";

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
} from "./helpers";

jest.setTimeout(60000);

const implementations = getImplementationsAndAPI();
const syntaxStyles = ["scss", "sass"];

describe("loader", () => {
  for (const item of implementations) {
    const { name: implementationName, api, implementation } = item;

    for (const syntax of syntaxStyles) {
      it(`should emit warning by default ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
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

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");
        expect(logs).toMatchSnapshot("logs");

        await close(compiler);
      });

      it(`should not emit warning when 'false' used ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        const testId = getTestId("logging", syntax);
        const options = {
          implementation,
          api,
          warnRuleAsWarning: false,
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

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");
        expect(logs).toMatchSnapshot("logs");

        await close(compiler);
      });

      it(`should emit warning when 'true' used ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        const testId = getTestId("logging", syntax);
        const options = {
          implementation,
          api,
          warnRuleAsWarning: true,
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

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot("css");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");
        expect(logs).toMatchSnapshot("logs");

        await close(compiler);
      });

      if (syntax === "sass") {
        it(`should emit good formatted warning ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
          const testId = getTestId("broken", syntax);
          const options = {
            implementation,
            api,
          };
          const compiler = getCompiler(testId, { loader: { options } });
          const stats = await compile(compiler);
          const codeFromBundle = getCodeFromBundle(stats, compiler);
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

          expect(codeFromBundle.css).toMatchSnapshot("css");
          expect(getWarnings(stats, true)).toMatchSnapshot("warnings");
          expect(getErrors(stats)).toMatchSnapshot("errors");
          expect(logs).toMatchSnapshot("logs");

          await close(compiler);
        });
      }
    }
  }
});
