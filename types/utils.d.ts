export type EXPECTED_ANY = any;
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
export type Importer = {
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
export type OutputStyle = "expanded" | "compressed";
export type KnownSassOptions = {
  /**
   * syntax
   */
  syntax?: ("scss" | "indented" | "css") | undefined;
  /**
   * url
   */
  url?: URL | undefined;
  /**
   * style
   */
  style?: ("expanded" | "compressed") | undefined;
  /**
   * load paths
   */
  loadPaths?: string[] | undefined;
  /**
   * source map
   */
  sourceMap?: boolean | undefined;
  /**
   * source map include sources
   */
  sourceMapIncludeSources?: boolean | undefined;
  /**
   * importers
   */
  importers?: Importer[] | undefined;
  /**
   * logger
   */
  logger?: Logger | undefined;
};
export type SassOptions = KnownSassOptions & Record<string, EXPECTED_ANY>;
export type AsyncCompiler = {
  /**
   * compile a string
   */
  compileStringAsync: (
    source: string,
    options?: SassOptions,
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
    options?: SassOptions,
  ): Promise<CompileResult>;
  initAsyncCompiler?(): Promise<AsyncCompiler>;
};
export type ApiType = "auto" | "modern" | "modern-compiler";
export type LoaderContext = import("webpack").LoaderContext<LoaderOptions>;
export type LoaderOptions = {
  /**
   * SaSS implementation
   */
  implementation?: SassImplementation | undefined;
  /**
   * SaSS options
   */
  sassOptions?:
    | (SassOptions | ((loaderContext: LoaderContext) => SassOptions))
    | undefined;
  /**
   * true if source map is enabled, otherwise false
   */
  sourceMap?: boolean | undefined;
  /**
   * prepends Sass/SCSS code before the actual entry file
   */
  additionalData?:
    | (string | ((content: string, loaderContext: LoaderContext) => string))
    | undefined;
  /**
   * true if webpack importer is enabled, otherwise false
   */
  webpackImporter?: boolean | undefined;
  /**
   * API type
   */
  api?: ApiType | undefined;
  /**
   * true if treats the `@warn` rule as a webpack warning, otherwise false
   */
  warnRuleAsWarning?: boolean | undefined;
};
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
export type RawSourceMap = {
  version: number;
  sources: string[];
  names: string[];
  sourceRoot?: string;
  sourcesContent?: string[];
  mappings: string;
  file: string;
  debugId?: string;
  ignoreList?: number[];
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
 * @param {ApiType=} apiType api type
 * @returns {(sassOptions: SassOptions & { data: string }) => Promise<CompileResult>} compile function
 */
export function getCompileFn<T extends SassImplementation>(
  loaderContext: LoaderContext,
  implementation: T,
  apiType?: ApiType | undefined,
): (
  sassOptions: SassOptions & {
    data: string;
  },
) => Promise<CompileResult>;
/**
 * @param {LoaderContext} loaderContext loader context
 * @returns {Importer} the modern webpack importer
 */
export function getModernWebpackImporter(
  loaderContext: LoaderContext,
): Importer;
/**
 * This function is not Webpack-specific and can be used by tools wishing to mimic `sass-loader`'s behaviour, so its signature should not be changed.
 * @param {SassImplementation | string | undefined} implementation sass implementation
 * @returns {Promise<SassImplementation>} resolved sass implementation
 */
export function getSassImplementation(
  implementation: SassImplementation | string | undefined,
): Promise<SassImplementation>;
/**
 * Derives the sass options from the loader context and normalizes its values with sane defaults.
 * @param {LoaderContext} loaderContext loader context
 * @param {LoaderOptions} loaderOptions loader options
 * @param {string} content content
 * @param {boolean} useSourceMap true when need to generate source maps, otherwise false
 * @returns {Promise<Required<KnownSassOptions> & { data: string }>} sass options
 */
export function getSassOptions(
  loaderContext: LoaderContext,
  loaderOptions: LoaderOptions,
  content: string,
  useSourceMap: boolean,
): Promise<
  Required<KnownSassOptions> & {
    data: string;
  }
>;
/**
 * Create the resolve function used in the custom Sass importer.
 * Can be used by external tools to mimic how `sass-loader` works, for example
 * in a Jest transform. Such usages will want to wrap `resolve.create` from
 * [`enhanced-resolve`]{@link https://github.com/webpack/enhanced-resolve} to
 * pass as the `resolverFactory` argument.
 * @param {LoaderContext["getResolve"]} resolverFactory a factory function for creating a Webpack resolver.
 * @returns {Resolver} webpack resolver
 */
export function getWebpackResolver(
  resolverFactory: LoaderContext["getResolve"],
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
