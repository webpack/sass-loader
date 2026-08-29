import path from "node:path";
import { fileURLToPath } from "node:url";

import { deleteSync } from "del";
import { Volume, createFsFromVolume } from "memfs";
import webpack from "webpack";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {Configuration} config config
 * @returns {Configuration} config with module rules
 */
const module = (config) => ({
  rules: config.rules || [
    {
      test: (config.loader && config.loader.test) || /\.s[ac]ss$/i,
      resolve: config.loader.resolve,
      // Use the built-in CSS support of webpack instead of the test loader
      ...(config.css ? { type: "css/auto" } : {}),
      use: [
        // The built-in CSS support of webpack handles the generated CSS itself,
        // so the test loader is not needed in this case
        ...(config.css
          ? []
          : [
              {
                loader: path.join(__dirname, "./testLoader.cjs"),
              },
            ]),
        {
          loader: path.join(__dirname, "../../src/index.js"),
          options: (config.loader && config.loader.options) || {},
        },
      ],
    },
  ],
});

/**
 * @param {Configuration} config config
 * @returns {Configuration} config with module rules
 */
const plugins = (config) => [config.plugins || []].flat();

/**
 * @param {Configuration} config config
 * @returns {Configuration} config with module rules
 */
const output = (config) => ({
  path: path.resolve(__dirname, `../outputs/${config.output || ""}`),
  filename: "[name].bundle.js",
  ...(config.css
    ? { cssFilename: "[name].bundle.css" }
    : { library: "sassLoaderExport" }),
});

/**
 * @param {string} fixture fixture
 * @param {Configuration} config config
 * @param {Options} options options
 * @returns {Configuration} build configuration
 */
export default function getCompiler(fixture, config = {}, options = {}) {
  // webpack Config
  config = {
    cache: config.cache || false,
    mode: config.mode || "development",
    devtool: config.devtool || false,
    // context: path.resolve(__dirname, '..', 'fixtures'),
    context: path.resolve(__dirname, ".."),
    entry: config.entry || `./${fixture}`,
    output: output(config),
    module: module(config),
    plugins: plugins(config),
    optimization: {
      runtimeChunk: false,
      minimizer: [],
    },

    resolve: config.resolve || undefined,
    experiments: config.experiments || (config.css ? { css: true } : undefined),
  };

  // Compiler Options
  options = { output: false, ...options };

  if (options.output) {
    deleteSync(config.output.path);
  }

  const compiler = webpack(config);

  if (!options.output) {
    compiler.outputFileSystem = createFsFromVolume(new Volume());
  }

  return compiler;
}
