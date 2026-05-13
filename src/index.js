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
} from "./utils.js";

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
    implementation = await getSassImplementation(this, options.implementation);
  } catch (error) {
    callback(error);

    return;
  }

  const useSourceMap =
    typeof options.sourceMap === "boolean" ? options.sourceMap : this.sourceMap;
  const sassOptions = await getSassOptions(
    this,
    options,
    content,
    implementation,
    useSourceMap,
  );

  const shouldUseWebpackImporter =
    typeof options.webpackImporter === "boolean"
      ? options.webpackImporter
      : true;

  if (shouldUseWebpackImporter) {
    sassOptions.importers.push(
      // No need to pass `loadPaths`, because modern API handle them itself
      getModernWebpackImporter(this, implementation, []),
    );
  }

  let compile;

  try {
    compile = getCompileFn(this, implementation, options.api);
  } catch (error) {
    callback(error);
    return;
  }

  let result;

  try {
    result = await compile(sassOptions);
  } catch (error) {
    // There are situations when the `span.url` property does not exist
    if (error.span && typeof error.span.url !== "undefined") {
      this.addDependency(url.fileURLToPath(error.span.url));
    }

    callback(errorFactory(error));

    return;
  }

  let map = result.sourceMap || null;

  // Modify source paths only for webpack, otherwise we do nothing
  if (map && useSourceMap) {
    map = normalizeSourceMap(map, this.rootContext);
  }

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

  callback(null, result.css.toString(), map);
}

export default loader;
