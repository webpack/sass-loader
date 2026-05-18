import assert from "node:assert";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import enhanced from "enhanced-resolve";

import * as sass from "sass";

import { getWebpackResolver } from "../src/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Because `getWebpackResolver` is a public function that can be imported by
 * external packages, we want to test it separately to ensure its API does not
 * change unexpectedly.
 */
describe("getWebpackResolver", () => {
  const resolve = (request, ...options) =>
    getWebpackResolver(enhanced.create, sass, ...options)(__filename, request);

  it("should resolve .scss from node_modules", async () => {
    assert.match(await resolve("scss/style"), /style\.scss$/);
  });

  it("should resolve from passed `includePaths`", async () => {
    assert.match(
      await resolve("empty", [path.resolve(__dirname, "./scss")]),
      /empty\.scss$/,
    );
  });

  it("should reject when file cannot be resolved", async () => {
    await assert.rejects(resolve("foo/bar/baz"), new Error("Next"));
  });

  if (process.platform !== "win32") {
    // a `file:` URI with two `/`s indicates the next segment is a hostname,
    // which Node restricts to `localhost` on Unix platforms. Because it is
    // nevertheless commonly used, the resolver converts it to a relative path.
    // Node does allow specifying remote hosts in the Windows environment, so
    // this test is restricted to Unix platforms.
    it("should convert an invalid file URL with an erroneous hostname to a relative path", async () => {
      const invalidFileURL = "file://scss/empty";

      assert.throws(
        () => fileURLToPath(invalidFileURL),
        /File URL host must be/,
      );
      assert.match(await resolve(invalidFileURL), /empty\.scss$/);
    });
  }
});
