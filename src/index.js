import path from "node:path";
import url from "node:url";

import schema from "./options.json" with { type: "json" };
import {
  errorFactory,
  getCompileFn,
  getModernWebpackImporter,
  getSassImplementation,
  getSassOptions,
  normalizeSourceMap,
  removeBOM,
} from "./utils.js";

/** @typedef {import("webpack").LoaderContext<LoaderOptions>} LoaderContext */
/** @typedef {import("schema-utils/declarations/validate").Schema} Schema */
/** @typedef {import("./utils.js").LoaderOptions} LoaderOptions */
/** @typedef {import("./utils.js").SassError} SassError */

/**
 * The sass-loader makes dart-sass and sass-embedded available to webpack modules.
 * @this {LoaderContext}
 * @param {string} content content
 * @returns {Promise<void>} loader result
 */
async function loader(content) {
  const options = this.getOptions(/** @type {Schema} */ (schema));
  const callback = this.async();

  let implementation;

  try {
    implementation = await getSassImplementation(options.implementation);
  } catch (error) {
    callback(/** @type {Error} */ (error));

    return;
  }

  const useSourceMap =
    typeof options.sourceMap === "boolean"
      ? options.sourceMap
      : this.sourceMap === true;
  const sassOptions = await getSassOptions(
    this,
    options,
    content,
    useSourceMap,
  );

  const shouldUseWebpackImporter =
    typeof options.webpackImporter === "boolean"
      ? options.webpackImporter
      : true;

  if (shouldUseWebpackImporter) {
    sassOptions.importers.push(getModernWebpackImporter(this));
  }

  let compile;

  try {
    compile = getCompileFn(this, implementation, options.api);
  } catch (error) {
    callback(/** @type {Error} */ (error));
    return;
  }

  let result;

  try {
    result = await compile(sassOptions);
  } catch (error) {
    const sassError = /** @type {SassError} */ (error);

    // There are situations when the `span.url` property does not exist
    if (sassError.span && typeof sassError.span.url !== "undefined") {
      this.addDependency(url.fileURLToPath(sassError.span.url));
    }

    callback(errorFactory(sassError));

    return;
  }

  let map = result.sourceMap || undefined;

  // Modify source paths only for webpack, otherwise we do nothing
  if (map && useSourceMap) {
    map = normalizeSourceMap(map, this.rootContext);
  }

  const { css, map: cssMap } = removeBOM(result.css.toString(), map);

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

  callback(null, css, cssMap || undefined);
}

export default loader;
