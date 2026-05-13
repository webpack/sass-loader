import assert from "node:assert";
import { describe, it } from "node:test";

import cjs from "../src/cjs.js";
import src from "../src/index.js";

describe("cjs", () => {
  it("should exported", () => {
    assert.strictEqual(cjs, src);
  });
});
