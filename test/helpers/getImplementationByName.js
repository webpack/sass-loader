/* eslint "import/no-unresolved": ["error", { ignore: ['node-sass'] }] */
/**
 * @param {"node-sass" | "dart-sass" | "sass" | "sass-embedded"} implementationName implementation name
 * @returns {SassImplementation} a sass implementation
 */
function getImplementationByName(implementationName) {
  if (implementationName === "node-sass") {
    return require("node-sass");
  } else if (implementationName === "dart-sass") {
    return require("sass");
  } else if (implementationName === "sass-embedded") {
    return require("sass-embedded");
  } else if (implementationName === "sass_string") {
    return require.resolve("sass");
  }

  throw new Error(`Can't find ${implementationName}`);
}

export default getImplementationByName;
