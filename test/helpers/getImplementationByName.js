import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/**
 * @param {"dart-sass" | "sass" | "sass-embedded"} implementationName implementation name
 * @returns {SassImplementation} a sass implementation
 */
function getImplementationByName(implementationName) {
  if (implementationName === "dart-sass") {
    return require("sass");
  } else if (implementationName === "sass-embedded") {
    return require("sass-embedded");
  } else if (implementationName === "sass_string") {
    return require.resolve("sass");
  }

  throw new Error(`Can't find ${implementationName}`);
}

export default getImplementationByName;
