import assert from "node:assert";
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { transformFileAsync } from "@babel/core";

import src from "../src/index.js";

const require = createRequire(import.meta.url);

const srcDir = fileURLToPath(new URL("../src", import.meta.url));

/**
 * Transpile every `.js` file under `src/` to CommonJS in `outDir`, copy
 * non-JS assets, then drop the `dist/cjs/package.json` type marker and
 * the same `module.exports = exports.default` post-build append the
 * `build:cjs` npm script writes. The test then `require()`s the result.
 * @param {string} outDir target directory
 */
async function buildCjsBundle(outDir) {
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const source = path.join(srcDir, entry.name);
    const target = path.join(outDir, entry.name);

    if (entry.name.endsWith(".js")) {
      const result = await transformFileAsync(source, { envName: "cjs" });

      writeFileSync(target, result.code);
    } else {
      copyFileSync(source, target);
    }
  }

  writeFileSync(
    path.join(outDir, "package.json"),
    `${JSON.stringify({ type: "commonjs" })}\n`,
  );

  const indexPath = path.join(outDir, "index.js");

  writeFileSync(
    indexPath,
    `${readFileSync(indexPath, "utf8")}module.exports = exports.default;\nmodule.exports.default = exports.default;\n`,
  );
}

describe("cjs", () => {
  let cjsDir;
  let cjsIndexPath;
  let cjsIndexSource;
  let cjsPackage;
  let cjsLoader;

  before(async () => {
    cjsDir = mkdtempSync(path.join(tmpdir(), "sass-loader-cjs-"));

    await buildCjsBundle(cjsDir);

    cjsIndexPath = path.join(cjsDir, "index.js");
    cjsIndexSource = readFileSync(cjsIndexPath, "utf8");
    cjsPackage = JSON.parse(
      readFileSync(path.join(cjsDir, "package.json"), "utf8"),
    );
    cjsLoader = require(cjsIndexPath);
  });

  after(() => {
    if (cjsDir) rmSync(cjsDir, { recursive: true, force: true });
  });

  it("should expose the loader as the default export of the ESM entry", () => {
    assert.strictEqual(typeof src, "function");
  });

  // Run Babel against `src/` directly (no dependency on the published
  // `dist/`) and assert the resulting CommonJS bundle has the shape the
  // `build:cjs` pipeline promises: it's marked CommonJS, opens with
  // Babel's strict-mode prologue and `exports.default = loader`, and ends
  // with the `module.exports = exports.default;` unwrap so `require()`
  // returns the loader function directly.
  it("should produce a require()-able CommonJS bundle via @babel/core", () => {
    assert.strictEqual(cjsPackage.type, "commonjs");

    assert.match(cjsIndexSource, /^"use strict";/);
    assert.match(cjsIndexSource, /exports\.default = loader/);
    assert.match(cjsIndexSource, /module\.exports = exports\.default;/);

    assert.strictEqual(typeof cjsLoader, "function");
    assert.strictEqual(cjsLoader.default, cjsLoader);
  });

  // Pre-refactor consumers loaded the loader two ways:
  //   const loader = require("sass-loader");      // function
  //   import loader from "sass-loader";           // function
  // Both surfaces must continue to return a callable function, with a
  // `.default` property pointing back at the same function so transitional
  // `require("sass-loader").default` calls keep working.
  it("should expose the loader through `require` as a callable function (pre-refactor shape)", () => {
    assert.strictEqual(typeof cjsLoader, "function");
    assert.strictEqual(typeof src, "function");
    assert.strictEqual(cjsLoader.default, cjsLoader);
    assert.strictEqual(cjsLoader.name, src.name);
    assert.strictEqual(cjsLoader.length, src.length);
  });
});
