import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
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
} from "./helpers/index.js";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const implementations = getImplementationsAndAPI();
const syntaxStyles = ["scss", "sass"];

describe("sourceMap option", () => {
  for (const item of implementations) {
    for (const syntax of syntaxStyles) {
      const { name: implementationName, api, implementation } = item;

      const getSourceMap = (sourceMap) => sourceMap;

      it(`should generate source maps when value is not specified and the "devtool" option has "source-map" value ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
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
          assert.strictEqual(path.isAbsolute(source), true);
          assert.strictEqual(source, path.normalize(source));
          assert.strictEqual(
            fs.existsSync(path.resolve(sourceMap.sourceRoot, source)),
            true,
          );

          return path
            .relative(path.resolve(__dirname, ".."), source)
            .replaceAll("\\", "/");
        });

        t.assert.snapshot(css);
        t.assert.snapshot(getSourceMap(sourceMap));
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should generate source maps when value has "true" value and the "devtool" option has "source-map" value ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
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
          assert.strictEqual(path.isAbsolute(source), true);
          assert.strictEqual(source, path.normalize(source));
          assert.strictEqual(
            fs.existsSync(path.resolve(sourceMap.sourceRoot, source)),
            true,
          );

          return path
            .relative(path.resolve(__dirname, ".."), source)
            .replaceAll("\\", "/");
        });

        t.assert.snapshot(css);
        t.assert.snapshot(getSourceMap(sourceMap));
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should generate source maps when value has "true" value and the "devtool" option has "false" value ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
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
          assert.strictEqual(path.isAbsolute(source), true);
          assert.strictEqual(source, path.normalize(source));
          assert.strictEqual(
            fs.existsSync(path.resolve(sourceMap.sourceRoot, source)),
            true,
          );

          return path
            .relative(path.resolve(__dirname, ".."), source)
            .replaceAll("\\", "/");
        });

        t.assert.snapshot(css);
        t.assert.snapshot(getSourceMap(sourceMap));
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should generate source maps when value has "false" value, but the "sassOptions.sourceMap" has the "true" value ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
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

          assert.match(source, /^file:/);
          assert.strictEqual(path.isAbsolute(normalizedSource), true);

          assert.strictEqual(
            fs.existsSync(
              path.resolve(__dirname, path.normalize(normalizedSource)),
            ),
            true,
          );

          return path
            .relative(path.resolve(__dirname, ".."), normalizedSource)
            .replaceAll("\\", "/");
        });

        t.assert.snapshot(css);
        t.assert.snapshot(getSourceMap(sourceMap));
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should not generate source maps when value is not specified and the "devtool" option has "false" value ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = { implementation, api };
        const compiler = getCompiler(testId, {
          devtool: false,
          loader: { options },
        });
        const stats = await compile(compiler);
        const { css, sourceMap } = getCodeFromBundle(stats, compiler);

        t.assert.snapshot(css);
        t.assert.snapshot(getSourceMap(sourceMap));
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should not generate source maps when value has "false" value and the "devtool" option has "source-map" value ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = { implementation, api, sourceMap: false };
        const compiler = getCompiler(testId, {
          devtool: "source-map",
          loader: { options },
        });
        const stats = await compile(compiler);
        const { css, sourceMap } = getCodeFromBundle(stats, compiler);

        t.assert.snapshot(css);
        t.assert.snapshot(getSourceMap(sourceMap));
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should not generate source maps when value has "false" value and the "devtool" option has "false" value ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
        const testId = getTestId("language", syntax);
        const options = { implementation, api, sourceMap: false };
        const compiler = getCompiler(testId, {
          devtool: false,
          loader: { options },
        });
        const stats = await compile(compiler);
        const { css, sourceMap } = getCodeFromBundle(stats, compiler);

        t.assert.snapshot(css);
        t.assert.snapshot(getSourceMap(sourceMap));
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should generate sourcemap with "asset/resource" ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
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
                  loader: path.join(__dirname, "../dist/cjs/index.js"),
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

        t.assert.snapshot(css);
        t.assert.snapshot(getSourceMap(JSON.parse(sourceMap)));
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });

      it(`should generate source maps with absolute URLs ('${implementationName}', '${api}' API, '${syntax}' syntax)`, async (t) => {
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
          assert.strictEqual(path.isAbsolute(source), true);
          assert.strictEqual(source, path.normalize(source));
          assert.strictEqual(
            fs.existsSync(path.resolve(sourceMap.sourceRoot, source)),
            true,
          );

          return path
            .relative(path.resolve(__dirname, ".."), source)
            .replaceAll("\\", "/");
        });

        t.assert.snapshot(css);
        t.assert.snapshot(getSourceMap(sourceMap));
        t.assert.snapshot(getWarnings(stats));
        t.assert.snapshot(getErrors(stats));

        await close(compiler);
      });
    }
  }
});
