import { defineConfig } from "eslint/config";
import configs from "eslint-config-webpack/configs.js";

export default defineConfig([
  {
    extends: [configs["node-recommended-module"]],
    rules: {
      "n/no-unsupported-features/node-builtins": "off",
    },
  },
  {
    files: ["**/*.cjs"],
    extends: [configs["node-recommended-commonjs"]],
    rules: {
      "n/no-unsupported-features/node-builtins": "off",
    },
  },
]);
