"use strict";

const MIN_BABEL_VERSION = 7;

module.exports = (api) => {
  api.assertVersion(MIN_BABEL_VERSION);

  // `api.env()` caches the config by the active env name (set via
  // `--env-name <name>` or `BABEL_ENV` / `NODE_ENV`).
  const env = api.env();
  const isEsm = env === "esm";
  const isCjs = env === "cjs";

  return {
    presets: [
      [
        "@babel/preset-env",
        {
          targets: { node: "22.11.0" },
          // ESM build: keep ESM syntax. CJS build: convert to CJS.
          // Default (e.g. babel-jest): let preset-env decide.
          modules: isEsm ? false : isCjs ? "commonjs" : "auto",
        },
      ],
    ],
  };
};
