export type EXPECTED_ANY = import("./index.js").EXPECTED_ANY;
export type SourceLocation = {
  /**
   * line number
   */
  line: number;
  /**
   * column number
   */
  column: number;
  /**
   * character offset
   */
  offset: number;
};
export type SourceSpan = {
  /**
   * start location
   */
  start: SourceLocation;
  /**
   * end location
   */
  end: SourceLocation;
  /**
   * canonical URL of the file
   */
  url?: URL | undefined;
  /**
   * covered text
   */
  text: string;
  /**
   * surrounding context
   */
  context?: string | undefined;
};
export type LoggerWarnOptions = {
  deprecation?: boolean;
  span?: SourceSpan;
  stack?: string;
};
export type Logger = {
  /**
   * warn handler
   */
  warn?: ((message: string, options: LoggerWarnOptions) => void) | undefined;
  /**
   * debug handler
   */
  debug?:
    | ((
        message: string,
        options: {
          span: SourceSpan;
        },
      ) => void)
    | undefined;
};
export type CompileResult = {
  /**
   * css output
   */
  css: Buffer | string;
  /**
   * source map
   */
  sourceMap?: RawSourceMap | undefined;
  /**
   * loaded URLs
   */
  loadedUrls: URL[];
};
export type ModernImporter = {
  /**
   * canonicalize
   */
  canonicalize: (
    originalUrl: string,
    context: {
      containingUrl: URL | null;
      fromImport: boolean;
    },
  ) => Promise<URL | null>;
  /**
   * load
   */
  load: (canonicalUrl: URL) => Promise<{
    contents: string;
    syntax: "scss" | "indented" | "css";
    sourceMapUrl?: URL;
  } | null>;
};
export type AsyncCompiler = {
  /**
   * compile a string
   */
  compileStringAsync: (
    source: string,
    options?: Record<string, unknown>,
  ) => Promise<CompileResult>;
  /**
   * dispose the compiler
   */
  dispose: () => Promise<void>;
};
export type SassImplementation = {
  info: string;
  compileStringAsync(
    source: string,
    options?: Record<string, unknown>,
  ): Promise<CompileResult>;
  initAsyncCompiler?(): Promise<AsyncCompiler>;
};
export type ApiType = "auto" | "modern" | "modern-compiler";
/**
 * The sass options accepted by the implementation `T`. When `T` is a concrete
 * sass module (e.g. `typeof import("sass")` or `typeof import("sass-embedded")`)
 * this resolves to that module's `StringOptions<"async">`, so we never have to
 * enumerate fields manually here.
 */
export type SassOptions<T extends SassImplementation = SassImplementation> =
  T["compileStringAsync"] extends (source: string, options?: infer O) => unknown
    ? O
    : never;
export type LoaderOptions = Record<string, EXPECTED_ANY>;
export type LoaderContext = import("webpack").LoaderContext<LoaderOptions>;
export type ResolveFactory = LoaderContext["getResolve"];
export type Resolver = (
  context: string,
  request: string,
  fromImport?: boolean,
) => Promise<string>;
export type ResolutionMap = {
  resolve: (context: string, request: string) => Promise<string>;
  context: string;
  possibleRequests: string[];
}[];
export type SassCompileFunction = (
  sassOptions: SassOptions,
) => Promise<CompileResult>;
export type RawSourceMap = {
  version: number;
  sources: string[];
  names?: string[];
  file?: string;
  sourceRoot?: string;
  sourcesContent?: (string | null)[];
  mappings?: string;
};
export type SassError = Error & {
  formatted?: string;
  span?: {
    url?: URL;
    start: {
      line: number;
      column: number;
    };
    context?: string;
  };
};
/**
 * @param {Error | SassError} error the original sass error
 * @returns {Error} a new error
 */
export function errorFactory(error: Error | SassError): Error;
/**
 * Verifies that the implementation and version of Sass is supported by this loader.
 * @template {SassImplementation} T
 * @param {LoaderContext} loaderContext loader context
 * @param {T} implementation sass implementation
 * @param {ApiType | undefined} apiType api type
 * @returns {SassCompileFunction} compile function
 */
export function getCompileFn<T extends SassImplementation>(
  loaderContext: LoaderContext,
  implementation: T,
  apiType?: ApiType | undefined,
): SassCompileFunction;
/**
 * @template {SassImplementation} T
 * @param {LoaderContext} loaderContext loader context
 * @param {T} implementation sass implementation
 * @param {string[]} loadPaths load paths
 * @returns {ModernImporter} the modern webpack importer
 */
export function getModernWebpackImporter<T extends SassImplementation>(
  loaderContext: LoaderContext,
  implementation: T,
  loadPaths: string[],
): ModernImporter;
/**
 * This function is not Webpack-specific and can be used by tools wishing to mimic `sass-loader`'s behaviour, so its signature should not be changed.
 * @param {LoaderContext} loaderContext loader context
 * @param {SassImplementation | string | undefined} implementation sass implementation
 * @returns {Promise<SassImplementation>} resolved sass implementation
 */
export function getSassImplementation(
  loaderContext: LoaderContext,
  implementation: SassImplementation | string | undefined,
): Promise<SassImplementation>;
/**
 * Derives the sass options from the loader context and normalizes its values with sane defaults.
 * @template {SassImplementation} T
 * @param {LoaderContext} loaderContext loader context
 * @param {LoaderOptions} loaderOptions loader options
 * @param {string} content content
 * @param {T} implementation sass implementation
 * @param {boolean} useSourceMap true when need to generate source maps, otherwise false
 * @returns {Promise<SassOptions>} sass options
 */
export function getSassOptions<T extends SassImplementation>(
  loaderContext: LoaderContext,
  loaderOptions: LoaderOptions,
  content: string,
  implementation: T,
  useSourceMap: boolean,
): Promise<SassOptions>;
/**
 * Create the resolve function used in the custom Sass importer.
 * Can be used by external tools to mimic how `sass-loader` works, for example
 * in a Jest transform. Such usages will want to wrap `resolve.create` from
 * [`enhanced-resolve`]{@link https://github.com/webpack/enhanced-resolve} to
 * pass as the `resolverFactory` argument.
 * @template {SassImplementation} T
 * @param {ResolveFactory} resolverFactory a factory function for creating a Webpack resolver.
 * @param {T} implementation the imported Sass implementation (`sass` or `sass-embedded`).
 * @param {string[]=} includePaths the list of include paths passed to Sass.
 * @returns {Resolver} webpack resolver
 */
export function getWebpackResolver<T extends SassImplementation>(
  resolverFactory: ResolveFactory,
  implementation: T,
  includePaths?: string[] | undefined,
): Resolver;
/**
 * @param {RawSourceMap} map source map
 * @param {string} rootContext root context
 * @returns {RawSourceMap} normalized source map
 */
export function normalizeSourceMap(
  map: RawSourceMap,
  rootContext: string,
): RawSourceMap;
