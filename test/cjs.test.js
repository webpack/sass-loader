import assert from "node:assert";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

import src from "../src/index.js";

const require = createRequire(import.meta.url);

describe("cjs", () => {
  it("should expose the loader as the default export of the ESM entry", () => {
    assert.strictEqual(typeof src, "function");
  });

  // Pre-refactor consumers loaded the loader two ways:
  //   const loader = require("sass-loader");      // function
  //   import loader from "sass-loader";           // function
  // Both surfaces must continue to return a callable function, with a
  // `.default` property pointing back at the same function so transitional
  // `require("sass-loader").default` calls keep working.
  it("should expose the loader through `require` as a callable function (pre-refactor shape)", async () => {
    const cjsLoader = require("../dist/cjs/index.js");

    const { default: esmLoader } = await import("../dist/esm/index.js");

    assert.strictEqual(typeof cjsLoader, "function");
    assert.strictEqual(typeof esmLoader, "function");
    assert.strictEqual(cjsLoader.default, cjsLoader);
    assert.strictEqual(cjsLoader.name, esmLoader.name);
    assert.strictEqual(cjsLoader.length, esmLoader.length);
  });
});
