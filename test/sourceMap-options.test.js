import fs from "node:fs";
import path from "node:path";
import url from "node:url";

import {
  close,
  compile,
  getCodeFromBundle,
  getCompiler,
  getErrors,
  getImplementationsAndAPI,
  getTestId,
  getWarnings,
} from "./helpers";

const implementations = getImplementationsAndAPI();
const syntaxStyles = ["scss", "sass"];

describe("sourceMap option", () => {
  for (const item of implementations) {
    for (const syntax of syntaxStyles) {
      const { name: implementationName, api, implementation } = item;

      const getSourceMap = (sourceMap) => sourceMap;

      it(`should generate source maps when value is not specified and the "devtool" option has "source-map" value ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        expect.assertions(10);

        const testId = getTestId("language", syntax);
        const options = { implementation, api };
        const compiler = getCompiler(testId, {
          devtool: "source-map",
          loader: { options },
        });
        const stats = await compile(compiler);
        const { css, sourceMap } = getCodeFromBundle(stats, compiler);

        sourceMap.sourceRoot = "";
        sourceMap.sources = sourceMap.sources.map((source) => {
          expect(path.isAbsolute(source)).toBe(true);
          expect(source).toBe(path.normalize(source));
          expect(
            fs.existsSync(path.resolve(sourceMap.sourceRoot, source)),
          ).toBe(true);

          return path
            .relative(path.resolve(__dirname, ".."), source)
            .replaceAll("\\", "/");
        });

        expect(css).toMatchSnapshot("css");
        expect(getSourceMap(sourceMap)).toMatchSnapshot("source map");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should generate source maps when value has "true" value and the "devtool" option has "source-map" value ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        expect.assertions(10);

        const testId = getTestId("language", syntax);
        const options = { implementation, api, sourceMap: true };
        const compiler = getCompiler(testId, {
          devtool: "source-map",
          loader: { options },
        });
        const stats = await compile(compiler);
        const { css, sourceMap } = getCodeFromBundle(stats, compiler);

        sourceMap.sourceRoot = "";
        sourceMap.sources = sourceMap.sources.map((source) => {
          expect(path.isAbsolute(source)).toBe(true);
          expect(source).toBe(path.normalize(source));
          expect(
            fs.existsSync(path.resolve(sourceMap.sourceRoot, source)),
          ).toBe(true);

          return path
            .relative(path.resolve(__dirname, ".."), source)
            .replaceAll("\\", "/");
        });

        expect(css).toMatchSnapshot("css");
        expect(getSourceMap(sourceMap)).toMatchSnapshot("source map");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should generate source maps when value has "true" value and the "devtool" option has "false" value ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        expect.assertions(10);

        const testId = getTestId("language", syntax);
        const options = { implementation, api, sourceMap: true };
        const compiler = getCompiler(testId, {
          devtool: false,
          loader: { options },
        });
        const stats = await compile(compiler);
        const { css, sourceMap } = getCodeFromBundle(stats, compiler);

        sourceMap.sourceRoot = "";
        sourceMap.sources = sourceMap.sources.map((source) => {
          expect(path.isAbsolute(source)).toBe(true);
          expect(source).toBe(path.normalize(source));
          expect(
            fs.existsSync(path.resolve(sourceMap.sourceRoot, source)),
          ).toBe(true);

          return path
            .relative(path.resolve(__dirname, ".."), source)
            .replaceAll("\\", "/");
        });

        expect(css).toMatchSnapshot("css");
        expect(getSourceMap(sourceMap)).toMatchSnapshot("source map");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should generate source maps when value has "false" value, but the "sassOptions.sourceMap" has the "true" value ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        expect.assertions(10);

        const testId = getTestId("language", syntax);
        const options = {
          implementation,
          api,
          sourceMap: false,
          sassOptions: {
            sourceMap: true,
          },
        };
        const compiler = getCompiler(testId, {
          devtool: false,
          loader: { options },
        });
        const stats = await compile(compiler);
        const { css, sourceMap } = getCodeFromBundle(stats, compiler);

        sourceMap.sourceRoot = "";
        sourceMap.sources = sourceMap.sources.map((source) => {
          const normalizedSource = url.fileURLToPath(source);

          expect(source).toMatch(/^file:/);
          expect(path.isAbsolute(normalizedSource)).toBe(true);

          expect(
            fs.existsSync(
              path.resolve(__dirname, path.normalize(normalizedSource)),
            ),
          ).toBe(true);

          return path
            .relative(path.resolve(__dirname, ".."), normalizedSource)
            .replaceAll("\\", "/");
        });

        expect(css).toMatchSnapshot("css");
        expect(getSourceMap(sourceMap)).toMatchSnapshot("source map");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should not generate source maps when value is not specified and the "devtool" option has "false" value ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        const testId = getTestId("language", syntax);
        const options = { implementation, api };
        const compiler = getCompiler(testId, {
          devtool: false,
          loader: { options },
        });
        const stats = await compile(compiler);
        const { css, sourceMap } = getCodeFromBundle(stats, compiler);

        expect(css).toMatchSnapshot("css");
        expect(getSourceMap(sourceMap)).toMatchSnapshot("source map");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should not generate source maps when value has "false" value and the "devtool" option has "source-map" value ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        const testId = getTestId("language", syntax);
        const options = { implementation, api, sourceMap: false };
        const compiler = getCompiler(testId, {
          devtool: "source-map",
          loader: { options },
        });
        const stats = await compile(compiler);
        const { css, sourceMap } = getCodeFromBundle(stats, compiler);

        expect(css).toMatchSnapshot("css");
        expect(getSourceMap(sourceMap)).toMatchSnapshot("source map");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should not generate source maps when value has "false" value and the "devtool" option has "false" value ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        const testId = getTestId("language", syntax);
        const options = { implementation, api, sourceMap: false };
        const compiler = getCompiler(testId, {
          devtool: false,
          loader: { options },
        });
        const stats = await compile(compiler);
        const { css, sourceMap } = getCodeFromBundle(stats, compiler);

        expect(css).toMatchSnapshot("css");
        expect(getSourceMap(sourceMap)).toMatchSnapshot("source map");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should generate sourcemap with "asset/resource" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        const testId = getTestId("language", syntax);
        const compiler = getCompiler(testId, {
          devtool: "source-map",
          rules: [
            {
              test: /\.(scss|sass)$/i,
              type: "asset/resource",
              generator: {
                binary: false,
                filename: "static/[name].css",
              },
              use: [
                {
                  loader: path.join(__dirname, "../src/cjs.js"),
                  options: {
                    implementation,
                    api,
                    sourceMap: true,
                  },
                },
              ],
            },
          ],
        });
        const stats = await compile(compiler);

        const usedFs = compiler.outputFileSystem;
        const outputPath = stats.compilation.outputOptions.path;
        const targetFile = "static/language.css";
        const css = usedFs
          .readFileSync(path.join(outputPath, targetFile))
          .toString();

        const targetMapFile = "static/language.css.map";
        const sourceMap = usedFs
          .readFileSync(path.join(outputPath, targetMapFile))
          .toString();

        expect(css).toMatchSnapshot("css");
        expect(getSourceMap(JSON.parse(sourceMap))).toMatchSnapshot(
          "source map",
        );
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });

      it(`should generate source maps with absolute URLs ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async () => {
        const testId = getTestId("language-source-maps", syntax);
        const options = { implementation, api };
        const compiler = getCompiler(testId, {
          devtool: "source-map",
          loader: { options },
        });
        const stats = await compile(compiler);
        const { css, sourceMap } = getCodeFromBundle(stats, compiler);

        sourceMap.sourceRoot = "";
        sourceMap.sources = sourceMap.sources.map((source) => {
          expect(path.isAbsolute(source)).toBe(true);
          expect(source).toBe(path.normalize(source));
          expect(
            fs.existsSync(path.resolve(sourceMap.sourceRoot, source)),
          ).toBe(true);

          return path
            .relative(path.resolve(__dirname, ".."), source)
            .replaceAll("\\", "/");
        });

        expect(css).toMatchSnapshot("css");
        expect(getSourceMap(sourceMap)).toMatchSnapshot("source map");
        expect(getWarnings(stats)).toMatchSnapshot("warnings");
        expect(getErrors(stats)).toMatchSnapshot("errors");

        await close(compiler);
      });
    }
  }
});
