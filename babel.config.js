const MIN_BABEL_VERSION = 7;

/**
 * Replace a `./X.js` / `../X.js` source value with the `.cjs` equivalent.
 * @param {{ node: { source: { value: string } | null } }} path Babel path
 */
function rewriteSource(path) {
  const { source } = path.node;

  if (!source) return;

  const { value } = source;

  if (
    (value.startsWith("./") || value.startsWith("../")) &&
    value.endsWith(".js")
  ) {
    source.value = `${value.slice(0, -3)}.cjs`;
  }
}

/**
 * Rewrite the source of every relative `./foo.js` import / re-export to
 * `./foo.cjs`. Runs only in the CJS build, before preset-env converts the
 * ESM specifiers into `require()` calls — so the CJS bundle ends up with
 * matching `.cjs` extensions on both filenames and require paths and we
 * can ship a flat `dist/` (no per-directory `package.json` marker).
 */
const rewriteRelativeJsToCjs = {
  name: "rewrite-relative-js-to-cjs",
  visitor: {
    ImportDeclaration: rewriteSource,
    ExportNamedDeclaration: rewriteSource,
    ExportAllDeclaration: rewriteSource,
  },
};

export default (api) => {
  api.assertVersion(MIN_BABEL_VERSION);

  const env = api.env();
  const isCjs = env === "cjs";

  return {
    presets: [
      [
        "@babel/preset-env",
        {
          targets: { node: "22.11.0" },
          modules: false,
        },
      ],
    ],
    // CJS build: rewrite `./foo.js` import sources to `./foo.cjs` first
    // (so the emitted `require()` calls match the `.cjs` extensions we
    // ship), then run `@babel/plugin-transform-modules-commonjs` with
    // `ignoreDynamicImport: true` so dynamic `import()` survives intact
    // in the output rather than being rewritten to a Promise+require
    // wrapper. Plugin order matters: rewrite first, modules-to-CJS
    // second.
    plugins: isCjs
      ? [
          rewriteRelativeJsToCjs,
          [
            "@babel/plugin-transform-modules-commonjs",
            {
              ignoreDynamicImport: true,
            },
          ],
        ]
      : [],
  };
};
