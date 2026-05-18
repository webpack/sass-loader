import { readFileSync } from "node:fs";
// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { findPackageJSON } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Resolve the absolute filesystem path of a package's ESM entry, walking
 * the `exports` field's `node` / `import` / `default` conditions. Used by
 * the "sass_string" / "sass_file_url" fixtures so the loader's
 * `await import(<path>)` returns a real ESM namespace (with `info`,
 * `compileStringAsync`, …) rather than a CJS-interop `{ default: ... }`
 * wrapper that would need `.default` unwrapping.
 * @param {string} specifier package name
 * @returns {string} absolute filesystem path
 */
function resolveEsmPath(specifier) {
  const pkgPath = findPackageJSON(
    specifier,
    new URL("../../src/utils.js", import.meta.url),
  );
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

  const walk = (node) => {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) {
      for (const item of node) {
        const r = walk(item);
        if (r) return r;
      }
    }
    if (node && typeof node === "object") {
      for (const key of ["node", "import", "default"]) {
        if (key in node) {
          const r = walk(node[key]);
          if (r) return r;
        }
      }
    }
    return null;
  };

  const entry =
    (pkg.exports && walk(pkg.exports["."] ?? pkg.exports)) ??
    pkg.module ??
    pkg.main ??
    "index.js";

  return path.join(path.dirname(pkgPath), entry);
}

/**
 * @param {"dart-sass" | "sass" | "sass-embedded" | "sass_string" | "sass_file_url"} implementationName implementation name
 * @returns {Promise<SassImplementation>} a sass implementation
 */
async function getImplementationByName(implementationName) {
  if (implementationName === "dart-sass") {
    return import("sass");
  } else if (implementationName === "sass-embedded") {
    // Match the loader's `await import("sass-embedded")` so tests and loader
    // hold the same module instance (CJS and ESM builds are cached
    // separately).
    return import("sass-embedded");
  } else if (implementationName === "sass_string") {
    // Absolute filesystem path; on Windows this is a backslash-separated
    // path like `C:\\...` which dynamic `import()` does not accept until
    // it's normalized to a `file:` URL. The ESM entry is used so the
    // loader's `await import(path)` exposes named exports (`info`,
    // `compileStringAsync`, …) directly instead of via `.default`.
    return resolveEsmPath("sass");
  } else if (implementationName === "sass_file_url") {
    return pathToFileURL(resolveEsmPath("sass")).href;
  }

  throw new Error(`Can't find ${implementationName}`);
}

export default getImplementationByName;
