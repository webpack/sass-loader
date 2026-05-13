import assert from "node:assert";
import { describe, it } from "node:test";

import src from "../src/index.js";

describe("cjs", () => {
  it("should expose the loader as the default export of the ESM entry", () => {
    assert.strictEqual(typeof src, "function");
  });
});
