import vm from "node:vm";

import readAsset from "./readAsset.js";

/**
 * @param {Stats} stats stats
 * @param {Compiler} compiler compiler
 * @param {name} asset asset name
 * @returns {Record<string, string>} code from bundle
 */
function getCodeFromBundle(stats, compiler, asset) {
  let code = null;

  if (
    stats &&
    stats.compilation &&
    stats.compilation.assets &&
    stats.compilation.assets[asset || "main.bundle.js"]
  ) {
    code = readAsset(asset || "main.bundle.js", compiler, stats);
  }

  if (!code) {
    throw new Error("Can't find compiled code");
  }

  const result = vm.runInNewContext(
    `${code};\nmodule.exports = sassLoaderExport;`,
    {
      module: {},
    },
  );

  return result.default;
}

export default getCodeFromBundle;
