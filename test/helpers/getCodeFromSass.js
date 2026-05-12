import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { getModernWebpackImporter } from "../../src/utils";

/**
 * @param {string} testId test ID
 * @param {Options} options options
 * @param {Context} context context
 * @returns {{ css: string, map: RawSourceMap }} CSS and source map (if exist)
 */
async function getCodeFromSass(testId, options, context = {}) {
  const loaderOptions = { ...options };
  const sassOptions =
    typeof loaderOptions.sassOptions === "function"
      ? loaderOptions.sassOptions({ mock: true }) || {}
      : { ...options.sassOptions };

  if (sassOptions.data) {
    delete sassOptions.data;
  }

  const { implementation } = loaderOptions;

  delete loaderOptions.implementation;

  const isSass = /\.sass$/i.test(testId);

  const isIndentedSyntax = isSass;

  sassOptions.syntax = isIndentedSyntax ? "indented" : "scss";

  const URL = pathToFileURL(path.resolve(__dirname, "..", testId));

  sassOptions.url = URL;

  sassOptions.data = fs.readFileSync(URL).toString();

  if (typeof loaderOptions.additionalData === "string") {
    sassOptions.data = `$prepended-data: hotpink${
      isIndentedSyntax ? "\n" : ";"
    }\n${sassOptions.data}`;
  } else if (typeof loaderOptions.additionalData === "function") {
    sassOptions.data = await loaderOptions.additionalData(sassOptions.data, {});
  }

  const loaderContext = {
    addDependency() {},
    addContextDependency() {},
    addMissingDependency() {},
    fs,
    resourcePath: path.resolve(__dirname, "..", "scss", "language.scss"),
  };

  const getResolveContext = () => ({
    fileDependencies: {
      add: (dep) => loaderContext.addDependency(dep),
    },
    contextDependencies: {
      add: (dep) => loaderContext.addContextDependency(dep),
    },
    missingDependencies: {
      add: (dep) => loaderContext.addMissingDependency(dep),
    },
  });

  const ResolverFactory = require("webpack/lib/ResolverFactory");

  const resolverFactory = new ResolverFactory();
  const syntax = context.syntax || "scss";
  const resolver = resolverFactory.get("normal", {
    roots: [path.resolve(__dirname, "..")],
    alias: {
      "path-to-alias": path.resolve(
        __dirname,
        "..",
        syntax,
        "another",
        `alias.${syntax}`,
      ),
      "@sass": path.resolve(
        __dirname,
        "..",
        "sass",
        "directory-6",
        "file",
        "_index.sass",
      ),
      "@scss": path.resolve(
        __dirname,
        "..",
        "scss",
        "directory-6",
        "file",
        "_index.scss",
      ),
      "@path-to-scss-dir": path.resolve(__dirname, "..", "scss"),
      "@path-to-sass-dir": path.resolve(__dirname, "..", "sass"),
      "@/path-to-scss-dir": path.resolve(__dirname, "..", "scss"),
      "@/path-to-sass-dir": path.resolve(__dirname, "..", "sass"),
      "/language": path.resolve(__dirname, "..", syntax, `language.${syntax}`),
    },
    fileSystem: fs,
    mainFields: ["custom-sass", "..."],
    conditionNames: [
      context.packageExportsCustomConditionTestVariant === 1 ? "theme1" : "",
      context.packageExportsCustomConditionTestVariant === 2 ? "theme2" : "",
      "webpack",
      "...",
    ],
    byDependency: {
      sass: {
        mainFiles: ["custom"],
      },
    },
  });

  loaderContext.getResolve = (options) => {
    const child = options ? resolver.withOptions(options) : resolver;

    return (context, request, callback) => {
      if (callback) {
        child.resolve({}, context, request, getResolveContext(), callback);
      } else {
        return new Promise((resolve, reject) => {
          child.resolve(
            {},
            context,
            request,
            getResolveContext(),
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            },
          );
        });
      }
    };
  };

  const modernTestImporter = getModernWebpackImporter(
    loaderContext,
    implementation,
    [],
  );

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
    ? [
        ...[
          Array.isArray(sassOptions.importers)
            ? [...sassOptions.importers]
            : [sassOptions.importers],
        ].flat(),
        modernTestImporter,
      ]
    : [modernTestImporter];

  sassOptions.logger = { debug: () => {}, warn: () => {} };

  const { data, ...rest } = sassOptions;
  const { css, sourceMap: map } = await implementation.compileStringAsync(
    data,
    rest,
  );

  return { css: css.toString(), sourceMap: map };
}

export default getCodeFromSass;
