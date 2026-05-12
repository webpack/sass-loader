import { defineConfig } from "eslint/config";
import configs from "eslint-config-webpack/configs.js";

export default defineConfig([
  {
    extends: [configs["recommended-dirty"]],
  },
  {
    // Tests intentionally rely on experimental `node:test` features (snapshot
    // and mock APIs) that only ship in Node.js 22+, pull in dev-only
    // dependencies (`sass`, `sass-embedded`, `enhanced-resolve`, ...) and
    // import from `src/` for direct testing of the source modules.
    files: [
      "test/**/*.js",
      "test/**/*.cjs",
      "test/**/*.mjs",
      "test/**/*.ts",
      "test/**/*.mts",
      "test/**/*.cts",
    ],
    rules: {
      "import/no-extraneous-dependencies": "off",
      "n/no-extraneous-import": "off",
      "n/no-extraneous-require": "off",
      "n/no-unpublished-import": "off",
      "n/no-unpublished-require": "off",
      "n/no-unsupported-features/node-builtins": "off",
      "unicorn/no-array-sort": "off",
      "jsdoc/require-jsdoc": "off",
      "id-length": "off",
      "unicorn/catch-error-name": "off",
    },
  },
]);
