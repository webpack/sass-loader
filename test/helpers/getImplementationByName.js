import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

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
    // it's normalized to a `file:` URL.
    return require.resolve("sass");
  } else if (implementationName === "sass_file_url") {
    return pathToFileURL(require.resolve("sass")).href;
  }

  throw new Error(`Can't find ${implementationName}`);
}

export default getImplementationByName;
