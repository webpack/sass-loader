import assert from "node:assert";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

import src from "../src/index.js";

const require = createRequire(import.meta.url);

describe("cjs", () => {
  it("should expose the loader as the default export of the ESM entry", () => {
    assert.strictEqual(typeof src, "function");
  });

  // Sanity check: when `require()` resolves `sass-loader`, it should land on
  // the Babel-transpiled CommonJS bundle in `dist/cjs/`, not bypass the
  // build. Verifying both the on-disk shape (CJS module wrapper + our
  // post-build `module.exports = exports.default` unwrap) and the runtime
  // result locks the build pipeline against accidental regressions.
  it("should ship a CommonJS-transpiled bundle that `require()` returns", () => {
    const cjsPath = require.resolve("../dist/cjs/index.js");
    const cjsSource = readFileSync(cjsPath, "utf8");
    const cjsPackage = JSON.parse(
      readFileSync(
        new URL("../dist/cjs/package.json", import.meta.url),
        "utf8",
      ),
    );

    // The dist/cjs/ tree is marked CommonJS independent of the root
    // package's `"type": "module"`.
    assert.strictEqual(cjsPackage.type, "commonjs");

    // Babel's CJS output starts with `"use strict";` and exposes the
    // default via `exports.default`. Our post-build append then rewires
    // `module.exports` so `require("sass-loader")` returns the function.
    assert.match(cjsSource, /^"use strict";/);
    assert.match(cjsSource, /exports\.default = loader/);
    assert.match(cjsSource, /module\.exports = exports\.default;/);

    // And the runtime shape matches what the source above promises.
    const cjsLoader = require("../dist/cjs/index.js");

    assert.strictEqual(typeof cjsLoader, "function");
    assert.strictEqual(cjsLoader.default, cjsLoader);
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
