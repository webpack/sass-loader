export default loader;
export type LoaderContext = import("webpack").LoaderContext<LoaderOptions>;
export type Schema = import("schema-utils/declarations/validate").Schema;
export type LoaderOptions = import("./utils.js").LoaderOptions;
export type SassError = import("./utils.js").SassError;
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
declare function loader(
  this: import("webpack").LoaderContext<import("./utils.js").LoaderOptions>,
  content: string,
): Promise<void>;
