import path from "node:path";
import url from "node:url";

// eslint-disable-next-line jsdoc/reject-any-type
/** @typedef {any} EXPECTED_ANY */

/**
 * @typedef {object} SourceLocation
 * @property {number} line line number
 * @property {number} column column number
 * @property {number} offset character offset
 */

/**
 * @typedef {object} SourceSpan
 * @property {SourceLocation} start start location
 * @property {SourceLocation} end end location
 * @property {URL=} url canonical URL of the file
 * @property {string} text covered text
 * @property {string=} context surrounding context
 */

/** @typedef {{ deprecation?: boolean, span?: SourceSpan, stack?: string }} LoggerWarnOptions */

/**
 * @typedef {object} Logger
 * @property {((message: string, options: LoggerWarnOptions) => void)=} warn warn handler
 * @property {((message: string, options: { span: SourceSpan }) => void)=} debug debug handler
 */

/**
 * @typedef {object} CompileResult
 * @property {Buffer | string} css css output
 * @property {RawSourceMap=} sourceMap source map
 * @property {URL[]} loadedUrls loaded URLs
 */

/**
 * @typedef {object} Importer
 * @property {(originalUrl: string, context: { containingUrl: URL | null, fromImport: boolean }) => Promise<URL | null>} canonicalize canonicalize
 * @property {(canonicalUrl: URL) => Promise<{ contents: string, syntax: "scss" | "indented" | "css", sourceMapUrl?: URL } | null>} load load
 */

/** @typedef {"expanded" | "compressed"} OutputStyle */

/**
 * @typedef {object} KnownSassOptions
 * @property {"scss" | "indented" | "css"=} syntax syntax
 * @property {URL=} url url
 * @property {"expanded" | "compressed"=} style style
 * @property {string[]=} loadPaths load paths
 * @property {boolean=} sourceMap source map
 * @property {boolean=} sourceMapIncludeSources source map include sources
 * @property {Importer[]=} importers importers
 * @property {Logger=} logger logger
 */

/** @typedef {KnownSassOptions & Record<string, EXPECTED_ANY>} SassOptions */

/**
 * @typedef {object} AsyncCompiler
 * @property {(source: string, options?: SassOptions) => Promise<CompileResult>} compileStringAsync compile a string
 * @property {() => Promise<void>} dispose dispose the compiler
 */

/** @typedef {{ info: string; compileStringAsync(source: string, options?: SassOptions): Promise<CompileResult>; initAsyncCompiler?(): Promise<AsyncCompiler> }} SassImplementation */

/** @typedef {"auto" | "modern" | "modern-compiler"} ApiType */

/** @typedef {import("webpack").LoaderContext<LoaderOptions>} LoaderContext */

/**
 * @typedef {object} LoaderOptions
 * @property {SassImplementation=} implementation SaSS implementation
 * @property {SassOptions | ((loaderContext: LoaderContext) => SassOptions)=} sassOptions SaSS options
 * @property {boolean=} sourceMap true if source map is enabled, otherwise false
 * @property {string | ((content: string, loaderContext: LoaderContext) => string)=} additionalData prepends Sass/SCSS code before the actual entry file
 * @property {boolean=} webpackImporter true if webpack importer is enabled, otherwise false
 * @property {ApiType=} api API type
 * @property {boolean=} warnRuleAsWarning true if treats the `@warn` rule as a webpack warning, otherwise false
 */

/** @typedef {(context: string, request: string, fromImport?: boolean) => Promise<string>} Resolver */
/** @typedef {{ resolve: (context: string, request: string) => Promise<string>, context: string, possibleRequests: string[] }[]} ResolutionMap */
/** @typedef {{ version: number, sources: string[], names: string[], sourceRoot?: string, sourcesContent?: string[], mappings: string, file: string, debugId?: string, ignoreList?: number[] }} RawSourceMap */
/** @typedef {Error & { formatted?: string, span?: { url?: URL, start: { line: number, column: number }, context?: string } }} SassError */

/**
 * Convert a string `implementation` option into something the ECMAScript
 * `import()` expression actually accepts. Bare package specifiers and
 * `file:` URLs are passed through unchanged; absolute filesystem paths
 * (including Windows paths like `C:\\...`) are converted to `file:` URLs
 * — dynamic `import()` rejects those otherwise.
 * @param {string} specifier import specifier
 * @returns {string} a valid dynamic import specifier
 */
function normalizeImportSpecifier(specifier) {
  if (specifier.startsWith("file:")) {
    return specifier;
  }

  if (path.isAbsolute(specifier)) {
    return url.pathToFileURL(specifier).href;
  }

  return specifier;
}

/**
 * This function is not Webpack-specific and can be used by tools wishing to mimic `sass-loader`'s behaviour, so its signature should not be changed.
 * @param {SassImplementation | string | undefined} implementation sass implementation
 * @returns {Promise<SassImplementation>} resolved sass implementation
 */
async function getSassImplementation(implementation) {
  /** @type {SassImplementation} */
  let resolvedImplementation;

  if (!implementation) {
    try {
      resolvedImplementation = /** @type {SassImplementation} */ (
        await import("sass-embedded")
      );
    } catch (err) {
      // Only fall back to `sass` when `sass-embedded` is not installed.
      // Any other failure (e.g. a broken install or a side-effect throw at
      // module-load time) should surface so the user can diagnose it
      // instead of being silently masked by the `sass` fallback.
      const { code } = /** @type {NodeJS.ErrnoException} */ (err);
      if (code !== "ERR_MODULE_NOT_FOUND" && code !== "MODULE_NOT_FOUND") {
        throw err;
      }

      resolvedImplementation = /** @type {SassImplementation} */ (
        await import("sass")
      );
    }
  } else if (typeof implementation === "string") {
    resolvedImplementation = /** @type {SassImplementation} */ (
      await import(normalizeImportSpecifier(implementation))
    );
  } else {
    resolvedImplementation = implementation;
  }

  const { info } = resolvedImplementation;

  if (!info) {
    throw new Error("Unknown Sass implementation.");
  }

  const infoParts = info.split("\t");

  if (infoParts.length < 2) {
    throw new Error(`Unknown Sass implementation "${info}".`);
  }

  const [implementationName] = infoParts;

  if (implementationName === "dart-sass") {
    return resolvedImplementation;
  } else if (implementationName === "sass-embedded") {
    return resolvedImplementation;
  }

  throw new Error(`Unknown Sass implementation "${implementationName}".`);
}

/**
 * @param {LoaderContext} loaderContext loader context
 * @returns {boolean} true when mode is production, otherwise false
 */
function isProductionLikeMode(loaderContext) {
  return loaderContext.mode === "production" || !loaderContext.mode;
}

/**
 * Derives the sass options from the loader context and normalizes its values with sane defaults.
 * @param {LoaderContext} loaderContext loader context
 * @param {LoaderOptions} loaderOptions loader options
 * @param {string} content content
 * @param {boolean} useSourceMap true when need to generate source maps, otherwise false
 * @returns {Promise<Required<KnownSassOptions> & { data: string }>} sass options
 */
async function getSassOptions(
  loaderContext,
  loaderOptions,
  content,
  useSourceMap,
) {
  /** @type {SassOptions} */
  const options = loaderOptions.sassOptions
    ? typeof loaderOptions.sassOptions === "function"
      ? loaderOptions.sassOptions(loaderContext) || {}
      : loaderOptions.sassOptions
    : {};
  /** @type {KnownSassOptions & { data: string }} */
  const sassOptions = {
    ...options,
    data: loaderOptions.additionalData
      ? typeof loaderOptions.additionalData === "function"
        ? await loaderOptions.additionalData(content, loaderContext)
        : `${loaderOptions.additionalData}\n${content}`
      : content,
  };

  if (!sassOptions.logger) {
    const needEmitWarning = loaderOptions.warnRuleAsWarning !== false;
    const logger = loaderContext.getLogger("sass-loader");
    /**
     * @param {SourceSpan} span span
     * @returns {string} formatted span
     */
    const formatSpan = (span) =>
      `Warning on line ${span.start.line}, column ${span.start.column} of ${
        span.url || "-"
      }:${span.start.line}:${span.start.column}:\n`;
    /**
     * @param {SourceSpan} span span
     * @returns {string} formatted debug span
     */
    const formatDebugSpan = (span) =>
      `[debug:${span.start.line}:${span.start.column}] `;

    sassOptions.logger = {
      /**
       * @param {string} message message
       * @param {{ span: SourceSpan }} loggerOptions logger options
       * @returns {void}
       */
      debug(message, loggerOptions) {
        let builtMessage = "";

        if (loggerOptions.span) {
          builtMessage = formatDebugSpan(loggerOptions.span);
        }

        builtMessage += message;

        logger.debug(builtMessage);
      },
      /**
       * @param {string} message message
       * @param {LoggerWarnOptions} loggerOptions logger options
       * @returns {void}
       */
      warn(message, loggerOptions) {
        let builtMessage = "";

        if (loggerOptions.deprecation) {
          builtMessage += "Deprecation ";
        }

        if (loggerOptions.span) {
          builtMessage += formatSpan(loggerOptions.span);
        }

        builtMessage += message;

        if (loggerOptions.span && loggerOptions.span.context) {
          builtMessage += `\n\n${loggerOptions.span.start.line} | ${loggerOptions.span.context}`;
        }

        if (loggerOptions.stack && loggerOptions.stack !== "null") {
          builtMessage += `\n\n${loggerOptions.stack}`;
        }

        if (needEmitWarning) {
          const warning = new Error(builtMessage);

          warning.name = "SassWarning";
          warning.stack = undefined;

          loaderContext.emitWarning(warning);
        } else {
          logger.warn(builtMessage);
        }
      },
    };
  }

  const { resourcePath } = loaderContext;

  sassOptions.url = url.pathToFileURL(resourcePath);

  // opt.outputStyle
  if (!sassOptions.style && isProductionLikeMode(loaderContext)) {
    sassOptions.style = "compressed";
  }

  if (useSourceMap) {
    sassOptions.sourceMap = true;
    sassOptions.sourceMapIncludeSources = true;
  }

  // If we are compiling sass and indentedSyntax isn't set, automatically set it.
  if (typeof sassOptions.syntax === "undefined") {
    const ext = path.extname(resourcePath);

    if (ext && ext.toLowerCase() === ".scss") {
      sassOptions.syntax = "scss";
    } else if (ext && ext.toLowerCase() === ".sass") {
      sassOptions.syntax = "indented";
    } else if (ext && ext.toLowerCase() === ".css") {
      sassOptions.syntax = "css";
    }
  }

  sassOptions.loadPaths = [
    // We use `loadPaths` in context for resolver, so it should be always absolute
    ...(sassOptions.loadPaths ? [...sassOptions.loadPaths] : []).map(
      (includePath) =>
        path.isAbsolute(includePath)
          ? includePath
          : path.join(process.cwd(), includePath),
    ),
    ...(process.env.SASS_PATH
      ? process.env.SASS_PATH.split(process.platform === "win32" ? ";" : ":")
      : []),
  ];

  sassOptions.importers = sassOptions.importers
    ? Array.isArray(sassOptions.importers)
      ? [...sassOptions.importers]
      : [sassOptions.importers]
    : [];

  return /** @type {Required<KnownSassOptions> & { data: string }} */ (
    sassOptions
  );
}

const MODULE_REQUEST_REGEX = /^[^?]*~/;

// Examples:
// - ~package
// - ~package/
// - ~@org
// - ~@org/
// - ~@org/package
// - ~@org/package/
const IS_MODULE_IMPORT =
  /^~([^/]+|[^/]+\/|@[^/]+[/][^/]+|@[^/]+\/?|@[^/]+[/][^/]+\/)$/;

const IS_PKG_SCHEME = /^pkg:/i;

/**
 * When `sass` tries to resolve an import, it uses a special algorithm.
 * Since the `sass-loader` uses webpack to resolve the modules, we need to simulate that algorithm.
 * This function returns an array of import paths to try.
 * The last entry in the array is always the original url to enable straight-forward webpack.config aliases.
 *
 * We don't need emulate `dart-sass` "It's not clear which file to import." errors (when "file.ext" and "_file.ext" files are present simultaneously in the same directory).
 * This reduces performance and `dart-sass` always do it on own side.
 * @param {string} url url
 * @param {boolean} forWebpackResolver true when for webpack resolver, otherwise false
 * @param {boolean} fromImport true when from `@import`, otherwise false
 * @returns {string[]} possible requests
 */
function getPossibleRequests(
  url,
  forWebpackResolver = false,
  fromImport = false,
) {
  let request = url;

  // In case there is module request, send this to webpack resolver
  if (forWebpackResolver) {
    if (MODULE_REQUEST_REGEX.test(url)) {
      request = request.replace(MODULE_REQUEST_REGEX, "");
    }

    if (IS_PKG_SCHEME.test(url)) {
      request = `${request.slice(4)}`;

      return [...new Set([request, url])];
    }

    if (IS_MODULE_IMPORT.test(url) || IS_PKG_SCHEME.test(url)) {
      request = request[request.length - 1] === "/" ? request : `${request}/`;

      return [...new Set([request, url])];
    }
  }

  // Keep in mind: ext can also be something like '.datepicker' when the true extension is omitted and the filename contains a dot.
  // @see https://github.com/webpack/sass/issues/167
  const extension = path.extname(request).toLowerCase();

  // Because @import is also defined in CSS, Sass needs a way of compiling plain CSS @imports without trying to import the files at compile time.
  // To accomplish this, and to ensure SCSS is as much of a superset of CSS as possible, Sass will compile any @imports with the following characteristics to plain CSS imports:
  //  - imports where the URL ends with .css.
  //  - imports where the URL begins http:// or https://.
  //  - imports where the URL is written as a url().
  //  - imports that have media queries.
  //
  // sass outputs as is `@import "style.css"`, but `@use "style.css"` should include CSS content
  if (extension === ".css") {
    return fromImport ? [] : [url];
  }

  const dirname = path.dirname(request).replaceAll("\\", "/");
  const normalizedDirname = dirname === "." ? "" : `${dirname}/`;
  const basename = path.basename(request);
  const basenameWithoutExtension = path.basename(request, extension);

  return [
    ...new Set([
      ...[
        fromImport
          ? [
              `${normalizedDirname}_${basenameWithoutExtension}.import${extension}`,
              `${normalizedDirname}${basenameWithoutExtension}.import${extension}`,
            ]
          : [],
      ].flat(),
      `${normalizedDirname}_${basename}`,
      `${normalizedDirname}${basename}`,
      ...(forWebpackResolver ? [url] : []),
    ]),
  ];
}

/**
 * @param {(context: string, request: string, callback: (error: Error | null, result: string) => void) => void} callbackResolve callback resolve
 * @returns {(context: string, request: string) => Promise<string>} promise resolve
 */
function promiseResolve(callbackResolve) {
  return (context, request) =>
    new Promise((resolve, reject) => {
      callbackResolve(context, request, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
}

/**
 * @param {ResolutionMap} resolutionMap resolution map
 * @returns {Promise<string>} resolved value
 */
async function startResolving(resolutionMap) {
  if (resolutionMap.length === 0) {
    throw new Error("Next");
  }

  const [{ possibleRequests }] = resolutionMap;

  if (possibleRequests.length === 0) {
    throw new Error("Next");
  }

  const [{ resolve, context }] = resolutionMap;

  try {
    return await resolve(context, possibleRequests[0]);
  } catch {
    const [, ...tailResult] = possibleRequests;

    if (tailResult.length === 0) {
      const [, ...tailResolutionMap] = resolutionMap;

      return startResolving(tailResolutionMap);
    }

    resolutionMap[0].possibleRequests = tailResult;

    return startResolving(resolutionMap);
  }
}

// `[drive_letter]:\` + `\\[server]\[sharename]\`
const IS_NATIVE_WIN32_PATH = /^[a-z]:[/\\]|^\\\\/i;

/**
 * Create the resolve function used in the custom Sass importer.
 * Can be used by external tools to mimic how `sass-loader` works, for example
 * in a Jest transform. Such usages will want to wrap `resolve.create` from
 * [`enhanced-resolve`]{@link https://github.com/webpack/enhanced-resolve} to
 * pass as the `resolverFactory` argument.
 * @param {LoaderContext["getResolve"]} resolverFactory a factory function for creating a Webpack resolver.
 * @returns {Resolver} webpack resolver
 */
function getWebpackResolver(resolverFactory) {
  // We only have one difference with the built-in sass resolution logic and out resolution logic:
  // First, we look at the files starting with `_`, then without `_` (i.e. `_name.sass`, `_name.scss`, `_name.css`, `name.sass`, `name.scss`, `name.css`),
  // although `sass` look together by extensions (i.e. `_name.sass`/`name.sass`/`_name.scss`/`name.scss`/`_name.css`/`name.css`).
  // It shouldn't be a problem because `sass` throw errors:
  // - on having `_name.sass` and `name.sass` (extension can be `sass`, `scss` or `css`) in the same directory
  // - on having `_name.sass` and `_name.scss` in the same directory
  //
  // Also `sass` prefer `sass`/`scss` over `css`.
  const webpackModuleResolve = promiseResolve(
    resolverFactory({
      dependencyType: "sass",
      conditionNames: ["sass", "style", "..."],
      mainFields: ["sass", "style", "main", "..."],
      mainFiles: ["_index", "index", "..."],
      extensions: [".sass", ".scss", ".css"],
      restrictions: [/\.((sa|sc|c)ss)$/i],
      preferRelative: true,
    }),
  );
  const webpackImportResolve = promiseResolve(
    resolverFactory({
      dependencyType: "sass",
      conditionNames: ["sass", "style", "..."],
      mainFields: ["sass", "style", "main", "..."],
      mainFiles: ["_index.import", "_index", "index.import", "index", "..."],
      extensions: [".sass", ".scss", ".css"],
      restrictions: [/\.((sa|sc|c)ss)$/i],
      preferRelative: true,
    }),
  );

  return (context, request, fromImport) => {
    const originalRequest = request;
    const isFileScheme = originalRequest.slice(0, 5).toLowerCase() === "file:";

    if (isFileScheme) {
      try {
        request = url.fileURLToPath(originalRequest);
      } catch {
        request = request.slice(7);
      }
    }

    /** @type {ResolutionMap} */
    let resolutionMap = [];

    const webpackPossibleRequests = getPossibleRequests(
      request,
      true,
      fromImport,
    );

    resolutionMap = [
      ...resolutionMap,
      {
        resolve: fromImport ? webpackImportResolve : webpackModuleResolve,
        context: path.dirname(context),
        possibleRequests: webpackPossibleRequests,
      },
    ];

    return startResolving(resolutionMap);
  };
}

/**
 * @param {LoaderContext} loaderContext loader context
 * @returns {Importer} the modern webpack importer
 */
function getModernWebpackImporter(loaderContext) {
  const resolve = getWebpackResolver(loaderContext.getResolve);

  return {
    /**
     * @param {string} originalUrl original url
     * @param {{ fromImport: boolean, containingUrl: URL | null }} context context
     * @returns {Promise<URL | null>} canonicalized URL
     */
    async canonicalize(originalUrl, context) {
      const { fromImport } = context;
      const prev = context.containingUrl
        ? url.fileURLToPath(context.containingUrl.toString())
        : loaderContext.resourcePath;

      let result;

      try {
        result = await resolve(prev, originalUrl, fromImport);
      } catch {
        // If no stylesheets are found, the importer should return null.
        return null;
      }

      loaderContext.addDependency(path.normalize(result));

      return url.pathToFileURL(result);
    },
    /**
     * @param {URL} canonicalUrl canonical url
     * @returns {Promise<{ contents: string, syntax: "scss" | "indented" | "css", sourceMapUrl: URL } | null>} load result
     */
    async load(canonicalUrl) {
      const ext = path.extname(canonicalUrl.pathname);

      /** @type {"scss" | "indented" | "css"} */
      let syntax;

      if (ext && ext.toLowerCase() === ".scss") {
        syntax = "scss";
      } else if (ext && ext.toLowerCase() === ".sass") {
        syntax = "indented";
      } else if (ext && ext.toLowerCase() === ".css") {
        syntax = "css";
      } else {
        // Fallback to default value
        syntax = "scss";
      }

      try {
        const contents = /** @type {string} */ (
          await new Promise((resolve, reject) => {
            // Old version of `enhanced-resolve` supports only path as a string
            // TODO simplify in the next major release and pass URL
            const canonicalPath = url.fileURLToPath(canonicalUrl);

            loaderContext.fs.readFile(
              canonicalPath,
              /**
               * @param {NodeJS.ErrnoException | null} err error
               * @param {Buffer | undefined} content content
               * @returns {void}
               */
              (err, content) => {
                if (err || !content) {
                  reject(err);
                  return;
                }

                resolve(content.toString("utf8"));
              },
            );
          })
        );

        return { contents, syntax, sourceMapUrl: canonicalUrl };
      } catch {
        return null;
      }
    },
  };
}

/** @type {WeakMap<import("webpack").Compiler, AsyncCompiler>} */
const sassModernCompilers = new WeakMap();

/**
 * Verifies that the implementation and version of Sass is supported by this loader.
 * @template {SassImplementation} T
 * @param {LoaderContext} loaderContext loader context
 * @param {T} implementation sass implementation
 * @param {ApiType=} apiType api type
 * @returns {(sassOptions: SassOptions & { data: string }) => Promise<CompileResult>} compile function
 */
function getCompileFn(loaderContext, implementation, apiType = "auto") {
  const { initAsyncCompiler } = implementation;

  if (
    apiType === "modern-compiler" ||
    (apiType === "auto" && typeof initAsyncCompiler === "function")
  ) {
    return async (
      /** @type {SassOptions & { data: string }} */ sassOptions,
    ) => {
      const webpackCompiler =
        /** @type {LoaderContext & { _compiler?: import("webpack").Compiler }} */
        (loaderContext)._compiler;
      const { data, ...rest } = sassOptions;

      // Some people can run the loader in a multi-threading way;
      // there is no webpack compiler object in such case.
      if (webpackCompiler && initAsyncCompiler) {
        if (!sassModernCompilers.has(webpackCompiler)) {
          // Create a long-running compiler process that can be reused
          // for compiling individual files.
          const compiler = await initAsyncCompiler();

          // Check again because awaiting the initialization function
          // introduces a race condition.
          if (!sassModernCompilers.has(webpackCompiler)) {
            sassModernCompilers.set(webpackCompiler, compiler);
            webpackCompiler.hooks.shutdown.tap("sass-loader", () => {
              compiler.dispose();
            });
          } else {
            compiler.dispose();
          }
        }

        return /** @type {AsyncCompiler} */ (
          sassModernCompilers.get(webpackCompiler)
        ).compileStringAsync(/** @type {string} */ (data), rest);
      }

      return implementation.compileStringAsync(
        /** @type {string} */ (data),
        rest,
      );
    };
  }

  return (/** @type {SassOptions & { data: string }} */ sassOptions) => {
    const { data, ...rest } = sassOptions;

    return implementation.compileStringAsync(
      /** @type {string} */ (data),
      rest,
    );
  };
}

const ABSOLUTE_SCHEME = /^[A-Za-z0-9+\-.]+:/;

/**
 * @param {string} source source
 * @returns {"absolute" | "scheme-relative" | "path-absolute" | "path-relative"} a type of URL
 */
function getURLType(source) {
  if (source[0] === "/") {
    if (source[1] === "/") {
      return "scheme-relative";
    }

    return "path-absolute";
  }

  if (IS_NATIVE_WIN32_PATH.test(source)) {
    return "path-absolute";
  }

  return ABSOLUTE_SCHEME.test(source) ? "absolute" : "path-relative";
}

/**
 * @param {RawSourceMap} map source map
 * @param {string} rootContext root context
 * @returns {RawSourceMap} normalized source map
 */
function normalizeSourceMap(map, rootContext) {
  const newMap = map;

  // result.map.file is an optional property that provides the output filename.
  // Since we don't know the final filename in the webpack build chain yet, it makes no sense to have it.

  if (typeof newMap.file !== "undefined") {
    // @ts-expect-error need to fix on webpack side
    delete newMap.file;
  }

  newMap.sourceRoot = "";

  // sass returns POSIX paths, that's why we need to transform them back to native paths.
  // This fixes an error on windows where the source-map module cannot resolve the source maps.
  // @see https://github.com/webpack/sass-loader/issues/366#issuecomment-279460722

  newMap.sources = newMap.sources.map((/** @type {string} */ source) => {
    const sourceType = getURLType(source);

    // Do no touch `scheme-relative`, `path-absolute` and `absolute` types (except `file:`)
    if (sourceType === "absolute" && /^file:/i.test(source)) {
      return url.fileURLToPath(source);
    } else if (sourceType === "path-relative") {
      return path.resolve(rootContext, path.normalize(source));
    }

    return source;
  });

  return newMap;
}

const BASE64_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const VLQ_BASE_SHIFT = 5;
const VLQ_BASE = 1 << VLQ_BASE_SHIFT;
const VLQ_BASE_MASK = VLQ_BASE - 1;
const VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Decodes the first Base64 VLQ value of the given `mappings`.
 * @param {string} mappings mappings of a source map
 * @returns {{ value: number, length: number } | null} the decoded value and how many characters it takes, `null` when `mappings` doesn't start with a value
 */
function decodeVLQ(mappings) {
  let value = 0;
  let shift = 0;
  let length = 0;
  let digit;

  do {
    digit = BASE64_CHARACTERS.indexOf(mappings[length]);

    if (digit === -1) {
      return null;
    }

    value += (digit & VLQ_BASE_MASK) << shift;
    shift += VLQ_BASE_SHIFT;
    length += 1;
  } while ((digit & VLQ_CONTINUATION_BIT) !== 0);

  const isNegative = (value & 1) === 1;

  value >>= 1;

  return { value: isNegative ? -value : value, length };
}

/**
 * @param {number} value value
 * @returns {string} the Base64 VLQ encoded value
 */
function encodeVLQ(value) {
  let encoded = "";
  let vlq = value < 0 ? (-value << 1) | 1 : value << 1;

  do {
    let digit = vlq & VLQ_BASE_MASK;

    vlq >>>= VLQ_BASE_SHIFT;

    if (vlq > 0) {
      digit |= VLQ_CONTINUATION_BIT;
    }

    encoded += BASE64_CHARACTERS[digit];
  } while (vlq > 0);

  return encoded;
}

/**
 * Removes the byte order mark (BOM) from the compiled CSS.
 *
 * `dart-sass` prepends a BOM when the `charset` option is enabled (by default),
 * the `style` option is `compressed` (the default for the `production` mode) and
 * the compiled CSS contains non ASCII characters.
 * A BOM is only meaningful at the very beginning of a file, but the loader result
 * is just a string for webpack, and tools like `css-loader` move `@import` at-rules
 * above it, so the BOM ends up in the middle of the generated CSS and breaks the
 * first rule after it.
 *
 * Webpack removes a BOM a loader produced itself since
 * https://github.com/webpack/webpack/pull/21857 and keeps the source map in sync
 * with it since https://github.com/webpack/webpack/pull/21861, which makes this a
 * no-op there. It is still needed for the webpack versions the `peerDependencies`
 * range allows and for `rspack`, which passes a string result through untouched.
 * Remove it once both handle this in the minimum version we support.
 * @see https://github.com/webpack/sass-loader/issues/1335
 * @param {string} css compiled CSS
 * @param {RawSourceMap=} map source map
 * @returns {{ css: string, map: RawSourceMap | undefined }} the CSS without the BOM and the source map adjusted to it
 */
function removeBOM(css, map) {
  if (css.charCodeAt(0) !== 0xfe_ff) {
    return { css, map };
  }

  // Sass counts the BOM as the first column of the first line, so all mappings
  // of this line need to be shifted by one column.
  // Only the first segment has to be updated - the generated column of the
  // segments after it is relative to the previous one.
  if (map && typeof map.mappings === "string") {
    const decoded = decodeVLQ(map.mappings);

    if (decoded && decoded.value > 0) {
      map.mappings = `${encodeVLQ(decoded.value - 1)}${map.mappings.slice(decoded.length)}`;
    }
  }

  return { css: css.slice(1), map };
}

/**
 * @param {Error | SassError} error the original sass error
 * @returns {Error} a new error
 */
function errorFactory(error) {
  const sassError = /** @type {SassError} */ (error);
  const message = sassError.formatted
    ? sassError.formatted.replace(/^(.+)?Error: /, "")
    : (error.message || error.toString()).replace(/^(.+)?Error: /, "");

  const obj = new Error(message, { cause: error });

  obj.name = error.name;
  obj.stack = undefined;

  return obj;
}

export {
  errorFactory,
  getCompileFn,
  getModernWebpackImporter,
  getSassImplementation,
  getSassOptions,
  getWebpackResolver,
  normalizeSourceMap,
  removeBOM,
};
