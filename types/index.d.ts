export default loader;
export type EXPECTED_ANY = any;
export type LoaderOptions = import("./utils.js").LoaderOptions;
export type LoaderContext = import("webpack").LoaderContext<LoaderOptions>;
export type SassError = import("./utils.js").SassError;
export type ModernImporter = import("./utils.js").ModernImporter;
export type Schema = import("schema-utils/declarations/validate").Schema;
/** @typedef {any} EXPECTED_ANY */
/** @typedef {import("./utils.js").LoaderOptions} LoaderOptions */
/** @typedef {import("webpack").LoaderContext<LoaderOptions>} LoaderContext */
/** @typedef {import("./utils.js").SassError} SassError */
/** @typedef {import("./utils.js").ModernImporter} ModernImporter */
/** @typedef {import("schema-utils/declarations/validate").Schema} Schema */
/**
 * The sass-loader makes dart-sass and sass-embedded available to webpack modules.
 * @this {LoaderContext}
 * @param {string} content content
 * @returns {Promise<void>} loader result
 */
declare function loader(
  this: import("webpack").LoaderContext<Record<string, any>>,
  content: string,
): Promise<void>;
