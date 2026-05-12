"use strict";

const path = require("node:path");
const url = require("node:url");

const schema = require("./options.json");
const {
  errorFactory,
  getCompileFn,
  getModernWebpackImporter,
  getSassImplementation,
  getSassOptions,
  getWebpackImporter,
  normalizeSourceMap,
} = require("./utils");

// eslint-disable-next-line jsdoc/reject-any-type
/** @typedef {any} EXPECTED_ANY */

/**
 * The sass-loader makes dart-sass and sass-embedded available to webpack modules.
 * @this {LoaderContext<{ string: EXPECTED_ANY }>}
 * @param {string} content content
 */
async function loader(content) {
  const options = this.getOptions(schema);
  const callback = this.async();

  let implementation;

  try {
    implementation = getSassImplementation(this, options.implementation);
  } catch (error) {
    callback(error);

    return;
  }

  const useSourceMap =
    typeof options.sourceMap === "boolean" ? options.sourceMap : this.sourceMap;
  // Use `modern` for `dart-sass` and `sass-embedded` by default
  const apiType = typeof options.api === "undefined" ? "modern" : options.api;
  const sassOptions = await getSassOptions(
    this,
    options,
    content,
    implementation,
    useSourceMap,
    apiType,
  );

  const shouldUseWebpackImporter =
    typeof options.webpackImporter === "boolean"
      ? options.webpackImporter
      : true;

  if (shouldUseWebpackImporter) {
    const isModernAPI = apiType === "modern" || apiType === "modern-compiler";

    if (!isModernAPI) {
      const { includePaths } = sassOptions;

      sassOptions.importer.push(
        getWebpackImporter(this, implementation, includePaths),
      );
    } else {
      sassOptions.importers.push(
        // No need to pass `loadPaths`, because modern API handle them itself
        getModernWebpackImporter(this, implementation, []),
      );
    }
  }

  let compile;

  try {
    compile = getCompileFn(this, implementation, apiType);
  } catch (error) {
    callback(error);
    return;
  }

  let result;

  try {
    result = await compile(sassOptions);
  } catch (error) {
    // There are situations when the `file`/`span.url` property do not exist
    // Modern API
    if (error.span && typeof error.span.url !== "undefined") {
      this.addDependency(url.fileURLToPath(error.span.url));
    }
    // Legacy API
    else if (typeof error.file !== "undefined") {
      // `sass` returns POSIX paths
      this.addDependency(path.normalize(error.file));
    }

    callback(errorFactory(error));

    return;
  }

  let map =
    // Modern API, then legacy API
    result.sourceMap || (result.map ? JSON.parse(result.map) : null);

  // Modify source paths only for webpack, otherwise we do nothing
  if (map && useSourceMap) {
    map = normalizeSourceMap(map, this.rootContext);
  }

  // Modern API
  if (typeof result.loadedUrls !== "undefined") {
    for (const includedFile of result.loadedUrls.filter(
      (loadedUrl) => loadedUrl.protocol === "file:",
    )) {
      const normalizedIncludedFile = url.fileURLToPath(includedFile);

      // Custom `importer` can return only `contents` so includedFile will be relative
      if (path.isAbsolute(normalizedIncludedFile)) {
        this.addDependency(normalizedIncludedFile);
      }
    }
  }
  // Legacy API
  else if (
    typeof result.stats !== "undefined" &&
    typeof result.stats.includedFiles !== "undefined"
  ) {
    for (const includedFile of result.stats.includedFiles) {
      const normalizedIncludedFile = path.normalize(includedFile);

      // Custom `importer` can return only `contents` so includedFile will be relative
      if (path.isAbsolute(normalizedIncludedFile)) {
        this.addDependency(normalizedIncludedFile);
      }
    }
  }

  callback(null, result.css.toString(), map);
}

module.exports = loader;
module.exports.default = loader;
