import { defineConfig } from "eslint/config";
import configs from "eslint-config-webpack/configs.js";

export default defineConfig([
  {
    extends: [configs["node-recommended-module"]],
    languageOptions: {
      // ES2025 needed for `import x from "./y.json" with { type: "json" }`
      ecmaVersion: "latest",
    },
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
