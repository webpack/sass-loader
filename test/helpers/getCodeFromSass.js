import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { getModernWebpackImporter } from "../../src/utils.js";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  const isModernAPI =
    options.api === "modern" || options.api === "modern-compiler";

  delete loaderOptions.implementation;

  const isSass = /\.sass$/i.test(testId);

  const isIndentedSyntax = isSass;

  if (isModernAPI) {
    sassOptions.syntax = isIndentedSyntax ? "indented" : "scss";
  } else {
    sassOptions.indentedSyntax = isSass;
  }

  const URL = pathToFileURL(path.resolve(__dirname, "..", testId));

  if (isModernAPI) {
    sassOptions.url = URL;
  } else {
    sassOptions.file = path.resolve(__dirname, "..", testId);
  }

  sassOptions.data = fs.readFileSync(URL).toString();

  if (typeof loaderOptions.additionalData === "string") {
    sassOptions.data = `$prepended-data: hotpink${
      isIndentedSyntax ? "\n" : ";"
    }\n${sassOptions.data}`;
  } else if (typeof loaderOptions.additionalData === "function") {
    sassOptions.data = await loaderOptions.additionalData(sassOptions.data, {});
  }

  if (isModernAPI) {
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
        "/language": path.resolve(
          __dirname,
          "..",
          syntax,
          `language.${syntax}`,
        ),
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
  } else {
    const testFolder = path.resolve(__dirname, "../");
    const testNodeModules = path.resolve(testFolder, "node_modules") + path.sep;
    const pathToSassPackageWithExportsFields = path.resolve(
      testFolder,
      "node_modules/package-with-exports/style.scss",
    );
    const pathToSassPackageWithExportsFieldsAndCustomConditionReplacer = () => {
      if (context.packageExportsCustomConditionTestVariant === 1) {
        return path.resolve(
          testFolder,
          "node_modules/package-with-exports-and-custom-condition/style-1.scss",
        );
      }

      if (context.packageExportsCustomConditionTestVariant === 2) {
        return path.resolve(
          testFolder,
          "node_modules/package-with-exports-and-custom-condition/style-2.scss",
        );
      }

      // eslint-disable-next-line no-console
      console.warn(
        "Expected to receive .packageExportsCustomConditionTestVariant to properly resolve stylesheet in sass only compilation. ",
      );
      return "";
    };

    const pathToAlias = path.resolve(
      testFolder,
      path.extname(testId).slice(1),
      "another",
      `alias.${path.extname(testId).slice(1)}`,
    );
    const pathToSCSSSassField = path.resolve(
      testFolder,
      "node_modules/scss-sass-field/nested/style.scss",
    );
    const pathToSassSassField = path.resolve(
      testFolder,
      "node_modules/sass-sass-field/nested/style.sass",
    );
    const pathToSCSSStyleField = path.resolve(
      testFolder,
      "node_modules/scss-style-field/nested/style.scss",
    );
    const pathToSassStyleField = path.resolve(
      testFolder,
      "node_modules/sass-style-field/nested/style.sass",
    );
    const pathToSCSSMainField = path.resolve(
      testFolder,
      "node_modules/scss-main-field/nested/style.scss",
    );
    const pathToSassMainField = path.resolve(
      testFolder,
      "node_modules/sass-main-field/nested/style.sass",
    );
    const pathToSCSSAlias = path.resolve(
      testFolder,
      "scss/directory-6/file/_index.scss",
    );
    const pathToSassAlias = path.resolve(
      testFolder,
      "sass/directory-6/file/_index.sass",
    );
    const pathToSCSSIndexAlias = path.resolve(
      testFolder,
      "scss/dir-with-underscore-index/_index.scss",
    );
    const pathToSassIndexAlias = path.resolve(
      testFolder,
      "sass/dir-with-underscore-index/_index.sass",
    );
    const pathToScopedNpmPkg = path.resolve(
      testFolder,
      "node_modules/@org/pkg/index.scss",
    );
    const pathToScopedNpmFile = path.resolve(
      testFolder,
      "node_modules/@org/style.scss",
    );
    const pathToSCSSCustomSassField = path.resolve(
      testFolder,
      "node_modules/scss-custom-sass-field/nested/style.scss",
    );
    const pathToSassCustomSassField = path.resolve(
      testFolder,
      "node_modules/sass-custom-sass-field/nested/style.sass",
    );
    const pathToBootstrap3Entry = path.resolve(
      testFolder,
      "../node_modules/bootstrap-sass/assets/stylesheets/_bootstrap.scss",
    );
    const pathToBootstrap3Package = path.resolve(
      testFolder,
      "../node_modules/bootstrap-sass",
    );
    const pathToBootstrap4Entry = path.resolve(
      testFolder,
      "../node_modules/bootstrap-v4/scss/bootstrap.scss",
    );
    const pathToBootstrap5Entry = path.resolve(
      testFolder,
      "../node_modules/bootstrap-v5/scss/bootstrap.scss",
    );
    const pathToModule = path.resolve(
      testFolder,
      "node_modules/module/module.scss",
    );
    const pathToAnother = path.resolve(
      testFolder,
      "node_modules/another/module.scss",
    );
    const pathToPackageWithStyleFieldAndCss = isSass
      ? path.resolve(
          testFolder,
          "node_modules/package-with-style-field-and-css/sass/package-with-style-field-and-css.sass",
        )
      : path.resolve(
          testFolder,
          "node_modules/package-with-style-field-and-css/scss/package-with-style-field-and-css.scss",
        );
    const pathToPackageWithJsAndCssMainFiles = path.resolve(
      testFolder,
      "node_modules/package-with-js-and-css-main-files/index",
    );
    const pathToPackageWithJsMainField = path.resolve(
      testFolder,
      "node_modules/package-with-js-main-field/index.scss",
    );
    const pathToPackageWithIndex = path.resolve(
      testFolder,
      "node_modules/package-with-index/_index.scss",
    );
    const pathToLanguage = isSass
      ? path.resolve(testFolder, "sass/language.sass")
      : path.resolve(testFolder, "scss/language.scss");
    const pathToPackageWithSameImport = path.resolve(
      testFolder,
      "node_modules/package-with-same-import/style.scss",
    );
    const pathToMaterial = path.resolve(
      __dirname,
      "../../node_modules/@material",
    );
    const pathToCustomMainFiles = isSass
      ? path.resolve(testFolder, "sass/custom-main-files/custom.sass")
      : path.resolve(testFolder, "scss/custom-main-files/custom.scss");
    const pathToWebpackExportField = path.resolve(
      testFolder,
      "node_modules/webpack-export-field/dist/styles/webpack/file.scss",
    );
    const pathToCSSModule = path.resolve(
      testFolder,
      "node_modules/css/some-css-module.css",
    );

    // Pseudo importer for tests
    /**
     * @param {string} url URL
     * @returns {{ file: string }} resolved URL
     */
    function testImporter(url) {
      // Do not transform css imports
      if (/\.css$/i.test(url) === false) {
        url = url
          .replace(
            /^webpack-export-field\/styles\/file$/,
            pathToWebpackExportField,
          )
          .replace(/^path-to-alias/, pathToAlias)
          .replace(
            /^package-with-style-field-and-css/,
            pathToPackageWithStyleFieldAndCss,
          )
          .replace(/^~scss-sass-field/, pathToSCSSSassField)
          .replace(/^~sass-sass-field/, pathToSassSassField)
          .replace(/^~scss-style-field/, pathToSCSSStyleField)
          .replace(/^~sass-style-field/, pathToSassStyleField)
          .replace(/^~scss-main-field/, pathToSCSSMainField)
          .replace(/^~sass-main-field/, pathToSassMainField)
          .replace(/^~scss-custom-sass-field/, pathToSCSSCustomSassField)
          .replace(/^~sass-custom-sass-field/, pathToSassCustomSassField)
          .replace(/^~@scss$/, pathToSCSSAlias)
          .replace(/^~@sass$/, pathToSassAlias)
          .replace(
            /^~@path-to-scss-dir\/dir-with-underscore-index$/,
            pathToSCSSIndexAlias,
          )
          .replace(
            /^~@path-to-scss-dir\/dir-with-underscore-index\/$/,
            pathToSCSSIndexAlias,
          )
          .replace(
            /^~@path-to-sass-dir\/dir-with-underscore-index$/,
            pathToSassIndexAlias,
          )
          .replace(
            /^~@path-to-sass-dir\/dir-with-underscore-index\/$/,
            pathToSassIndexAlias,
          )
          .replace(
            /^~@\/path-to-scss-dir\/dir-with-underscore-index$/,
            pathToSCSSIndexAlias,
          )
          .replace(
            /^~@\/path-to-sass-dir\/dir-with-underscore-index$/,
            pathToSassIndexAlias,
          )
          .replace(/^~@org\/pkg/, pathToScopedNpmPkg)
          .replace(/^@org\/style/, pathToScopedNpmFile)
          .replace(/^~bootstrap-sass$/, pathToBootstrap3Entry)
          .replace(/^~bootstrap-sass/, pathToBootstrap3Package)
          .replace(/^~bootstrap-v4$/, pathToBootstrap4Entry)
          .replace(/^bootstrap-v4$/, pathToBootstrap4Entry)
          .replace(/^~bootstrap-v5$/, pathToBootstrap5Entry)
          .replace(/^bootstrap-v5$/, pathToBootstrap5Entry)
          .replace(/^~module/, pathToModule)
          .replace(/^~another/, pathToAnother)
          .replace(
            /^~package-with-js-and-css-main-files/,
            pathToPackageWithJsAndCssMainFiles,
          )
          .replace(/^~package-with-js-main-field/, pathToPackageWithJsMainField)
          .replace(/^~package-with-index/, pathToPackageWithIndex)
          .replace(
            /^package-with-exports-and-custom-condition$/,
            pathToSassPackageWithExportsFieldsAndCustomConditionReplacer,
          )
          .replace(/^package-with-exports$/, pathToSassPackageWithExportsFields)
          .replace(/^file:\/\/\/language/, pathToLanguage)
          .replace(/^\/sass\/language.sass/, pathToLanguage)
          .replace(/^\/scss\/language.scss/, pathToLanguage)
          .replace(/^file:\/\/\/.+\/scss\/language.scss/, pathToLanguage)
          .replace(/^file:\/\/\/.+\/sass\/language.sass/, pathToLanguage)
          .replace(
            /^package-with-same-import\/style/,
            pathToPackageWithSameImport,
          )
          .replace(/@material/, pathToMaterial)
          .replace(/custom-main-files/, pathToCustomMainFiles)
          .replace(/^~/, testNodeModules);
      }

      const fromImport =
        typeof this.fromImport === "undefined" ? true : this.fromImport;

      if (!fromImport && /css\/some-css-module\.css/.test(url)) {
        return {
          file: url.replace(/css\/some-css-module\.css/, pathToCSSModule),
        };
      }

      return {
        file: url,
      };
    }

    sassOptions.includePaths = [
      process.cwd(),
      ...// We use `includePaths` in context for resolver, so it should be always absolute
      (sassOptions.includePaths ? [...sassOptions.includePaths] : []).map(
        (includePath) =>
          path.isAbsolute(includePath)
            ? includePath
            : path.join(process.cwd(), includePath),
      ),
      ...(process.env.SASS_PATH
        ? process.env.SASS_PATH.split(process.platform === "win32" ? ";" : ":")
        : []),
    ];
    sassOptions.importer = sassOptions.importer
      ? [
          ...[
            Array.isArray(sassOptions.importer)
              ? [...sassOptions.importer]
              : [sassOptions.importer],
          ].flat(),
          testImporter,
        ]
      : [testImporter];
  }

  sassOptions.logger = { debug: () => {}, warn: () => {} };
  sassOptions.silenceDeprecations = ["legacy-js-api"];

  let css;
  let map;

  if (isModernAPI) {
    const { data, ...rest } = sassOptions;
    ({ css, sourceMap: map } = await implementation.compileStringAsync(
      data,
      rest,
    ));
  } else {
    ({ css, map } = await new Promise((resolve, reject) => {
      implementation.render(sassOptions, (error, result) => {
        if (error) {
          reject(error);

          return;
        }

        resolve(result);
      });
    }));
  }

  return { css: css.toString(), sourceMap: map };
}

export default getCodeFromSass;
