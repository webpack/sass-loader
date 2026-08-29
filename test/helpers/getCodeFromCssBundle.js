import readAsset from "./readAsset.js";

/**
 * Reads the CSS emitted by the built-in CSS support of webpack.
 * @param {Stats} stats stats
 * @param {Compiler} compiler compiler
 * @param {string=} asset asset name
 * @returns {string} CSS from bundle
 */
function getCodeFromCssBundle(stats, compiler, asset = "main.bundle.css") {
  if (
    !stats ||
    !stats.compilation ||
    !stats.compilation.assets ||
    !stats.compilation.assets[asset]
  ) {
    throw new Error("Can't find compiled CSS");
  }

  return readAsset(asset, compiler, stats);
}

export default getCodeFromCssBundle;
