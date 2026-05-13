import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/**
 * @param {"dart-sass" | "sass" | "sass-embedded"} implementationName implementation name
 * @returns {Promise<SassImplementation>} a sass implementation
 */
async function getImplementationByName(implementationName) {
  if (implementationName === "dart-sass") {
    return require("sass");
  } else if (implementationName === "sass-embedded") {
    // Match the loader's `await import("sass-embedded")` so tests and loader
    // hold the same module instance (CJS and ESM builds are cached
    // separately).
    return (await import("sass-embedded")).default;
  } else if (implementationName === "sass_string") {
    return require.resolve("sass");
  }

  throw new Error(`Can't find ${implementationName}`);
}

export default getImplementationByName;
