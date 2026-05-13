import { defineConfig } from "eslint/config";
import configs from "eslint-config-webpack/configs.js";

export default defineConfig([
  {
    extends: [configs["node-recommended-commonjs"]],
  },
  {
    files: ["test/**/*"],
    extends: [configs["node-recommended-module"]],
    rules: {
      "n/no-unsupported-features/node-builtins": "off",
    },
  },
]);
