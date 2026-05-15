import path from "node:path";
import url from "node:url";

/** @typedef {import("sass")} Sass */
/** @typedef {import("sass").StringOptionsWithImporter} SassSassOptions */
/** @typedef {import("sass-embedded")} SassEmbedded */
/** @typedef {import("sass-embedded").StringOptionsWithImporter} SassEmbeddedOptions */

/** @typedef {import("./index.js").EXPECTED_ANY} EXPECTED_ANY */
/** @typedef {Sass | SassEmbedded} SassImplementation */
/** @typedef {SassSassOptions | SassEmbeddedOptions} SassOptions */
/** @typedef {Record<string, EXPECTED_ANY>} LoaderOptions */

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
 * @param {LoaderContext} loaderContext loader context
 * @param {SassImplementation | string} implementation sass implementation
 * @returns {Promise<SassImplementation>} resolved sass implementation
 */
async function getSassImplementation(loaderContext, implementation) {
  let resolvedImplementation = implementation;

  if (!resolvedImplementation) {
    try {
      resolvedImplementation = await import("sass-embedded");
    } catch {
      resolvedImplementation = await import("sass");
    }
  }

  if (typeof resolvedImplementation === "string") {
    resolvedImplementation = await import(
      normalizeImportSpecifier(resolvedImplementation)
    );
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
 * @param {SassImplementation} implementation sass implementation
 * @param {boolean} useSourceMap true when need to generate source maps, otherwise false
 * @returns {SassOptions} sass options
 */
async function getSassOptions(
  loaderContext,
  loaderOptions,
  content,
  implementation,
  useSourceMap,
) {
  const options = loaderOptions.sassOptions
    ? typeof loaderOptions.sassOptions === "function"
      ? loaderOptions.sassOptions(loaderContext) || {}
      : loaderOptions.sassOptions
    : {};
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
    const formatSpan = (span) =>
      `Warning on line ${span.start.line}, column ${span.start.column} of ${
        span.url || "-"
      }:${span.start.line}:${span.start.column}:\n`;
    const formatDebugSpan = (span) =>
      `[debug:${span.start.line}:${span.start.column}] `;

    sassOptions.logger = {
      debug(message, loggerOptions) {
        let builtMessage = "";

        if (loggerOptions.span) {
          builtMessage = formatDebugSpan(loggerOptions.span);
        }

        builtMessage += message;

        logger.debug(builtMessage);
      },
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
          warning.stack = null;

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

  return sassOptions;
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

const IS_SPECIAL_MODULE_IMPORT = /^~[^/]+$/;
// `[drive_letter]:\` + `\\[server]\[sharename]\`
const IS_NATIVE_WIN32_PATH = /^[a-z]:[/\\]|^\\\\/i;

/**
 * Create the resolve function used in the custom Sass importer.
 * Can be used by external tools to mimic how `sass-loader` works, for example
 * in a Jest transform. Such usages will want to wrap `resolve.create` from
 * [`enhanced-resolve`]{@link https://github.com/webpack/enhanced-resolve} to
 * pass as the `resolverFactory` argument.
 * @param {ResolveFactory} resolverFactory a factory function for creating a Webpack resolver.
 * @param {Sass} implementation the imported Sass implementation (`sass` or `sass-embedded`).
 * @param {string[]=} includePaths the list of include paths passed to Sass.
 * @returns {Resolver} webpack resolver
 */
function getWebpackResolver(
  resolverFactory,
  implementation,
  includePaths = [],
) {
  // We only have one difference with the built-in sass resolution logic and out resolution logic:
  // First, we look at the files starting with `_`, then without `_` (i.e. `_name.sass`, `_name.scss`, `_name.css`, `name.sass`, `name.scss`, `name.css`),
  // although `sass` look together by extensions (i.e. `_name.sass`/`name.sass`/`_name.scss`/`name.scss`/`_name.css`/`name.css`).
  // It shouldn't be a problem because `sass` throw errors:
  // - on having `_name.sass` and `name.sass` (extension can be `sass`, `scss` or `css`) in the same directory
  // - on having `_name.sass` and `_name.scss` in the same directory
  //
  // Also `sass` prefer `sass`/`scss` over `css`.
  const sassModuleResolve = promiseResolve(
    resolverFactory({
      alias: [],
      aliasFields: [],
      conditionNames: [],
      descriptionFiles: [],
      extensions: [".sass", ".scss", ".css"],
      exportsFields: [],
      mainFields: [],
      mainFiles: ["_index", "index"],
      modules: [],
      restrictions: [/\.((sa|sc|c)ss)$/i],
      preferRelative: true,
    }),
  );
  const sassImportResolve = promiseResolve(
    resolverFactory({
      alias: [],
      aliasFields: [],
      conditionNames: [],
      descriptionFiles: [],
      extensions: [".sass", ".scss", ".css"],
      exportsFields: [],
      mainFields: [],
      mainFiles: ["_index.import", "_index", "index.import", "index"],
      modules: [],
      restrictions: [/\.((sa|sc|c)ss)$/i],
      preferRelative: true,
    }),
  );
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

    let resolutionMap = [];

    const needEmulateSassResolver =
      // `sass` doesn't support module import
      !IS_SPECIAL_MODULE_IMPORT.test(request) &&
      // don't handle `pkg:` scheme
      !IS_PKG_SCHEME.test(request) &&
      // We need improve absolute paths handling.
      // Absolute paths should be resolved:
      // - Server-relative URLs - `<context>/path/to/file.ext` (where `<context>` is root context)
      // - Absolute path - `/full/path/to/file.ext` or `C:\\full\path\to\file.ext`
      !isFileScheme &&
      !originalRequest.startsWith("/") &&
      !IS_NATIVE_WIN32_PATH.test(originalRequest);

    if (includePaths.length > 0 && needEmulateSassResolver) {
      // The order of import precedence is as follows:
      //
      // 1. Filesystem imports relative to the base file.
      // 2. Custom importer imports.
      // 3. Filesystem imports relative to the working directory.
      // 4. Filesystem imports relative to an `includePaths` path.
      // 5. Filesystem imports relative to a `SASS_PATH` path.
      //
      // `sass` run custom importers before `3`, `4` and `5` points, we need to emulate this behavior to avoid wrong resolution.
      const sassPossibleRequests = getPossibleRequests(
        request,
        false,
        fromImport,
      );

      resolutionMap = [
        ...resolutionMap,
        ...includePaths.map((context) => ({
          resolve: fromImport ? sassImportResolve : sassModuleResolve,
          context,
          possibleRequests: sassPossibleRequests,
        })),
      ];
    }

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
 * @param {SassImplementation} implementation sass implementation
 * @param {string[]} loadPaths load paths
 * @returns {Importer} the modern webpack importer
 */
function getModernWebpackImporter(loaderContext, implementation, loadPaths) {
  const resolve = getWebpackResolver(
    loaderContext.getResolve,
    implementation,
    loadPaths,
  );

  return {
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
    async load(canonicalUrl) {
      const ext = path.extname(canonicalUrl.pathname);

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
        const contents = await new Promise((resolve, reject) => {
          // Old version of `enhanced-resolve` supports only path as a string
          // TODO simplify in the next major release and pass URL
          const canonicalPath = url.fileURLToPath(canonicalUrl);

          loaderContext.fs.readFile(canonicalPath, (err, content) => {
            if (err) {
              reject(err);
              return;
            }

            resolve(content.toString("utf8"));
          });
        });

        return { contents, syntax, sourceMapUrl: canonicalUrl };
      } catch {
        return null;
      }
    },
  };
}

const sassModernCompilers = new WeakMap();

/**
 * Verifies that the implementation and version of Sass is supported by this loader.
 * @param {LoaderContext} loaderContext loader context
 * @param {SassImplementation} implementation sass implementation
 * @param {"auto" | "modern" | "modern-compiler" | undefined} apiType api type
 * @returns {SassCompileFunction} compile function
 */
function getCompileFn(loaderContext, implementation, apiType = "auto") {
  if (
    apiType === "modern-compiler" ||
    (apiType === "auto" &&
      typeof implementation.initAsyncCompiler === "function")
  ) {
    return async (sassOptions) => {
      const webpackCompiler = loaderContext._compiler;
      const { data, ...rest } = sassOptions;

      // Some people can run the loader in a multi-threading way;
      // there is no webpack compiler object in such case.
      if (webpackCompiler) {
        if (!sassModernCompilers.has(webpackCompiler)) {
          // Create a long-running compiler process that can be reused
          // for compiling individual files.
          const compiler = await implementation.initAsyncCompiler();

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

        return sassModernCompilers
          .get(webpackCompiler)
          .compileStringAsync(data, rest);
      }

      return implementation.compileStringAsync(data, rest);
    };
  }

  return (sassOptions) => {
    const { data, ...rest } = sassOptions;

    return implementation.compileStringAsync(data, rest);
  };
}

const ABSOLUTE_SCHEME = /^[A-Za-z0-9+\-.]+:/;

/**
 * @param {string} source source
 * @returns {"absolute" | "scheme-relative" | "path-absolute" | "path-absolute"} a type of URL
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
    delete newMap.file;
  }

  newMap.sourceRoot = "";

  // sass returns POSIX paths, that's why we need to transform them back to native paths.
  // This fixes an error on windows where the source-map module cannot resolve the source maps.
  // @see https://github.com/webpack/sass-loader/issues/366#issuecomment-279460722

  newMap.sources = newMap.sources.map((source) => {
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

/**
 * @param {Error | SassError} error the original sass error
 * @returns {Error} a new error
 */
function errorFactory(error) {
  const message = error.formatted
    ? error.formatted.replace(/^(.+)?Error: /, "")
    : (error.message || error.toString()).replace(/^(.+)?Error: /, "");

  const obj = new Error(message, { cause: error });

  obj.name = error.name;
  obj.stack = null;

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
};
