import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

import {
  compile,
  getCompiler,
  getImplementationByName,
  getTestId,
} from "./helpers/index.js";

const require = createRequire(import.meta.url);

describe("validate options", () => {
  const tests = {
    implementation: {
      success: [
        require("sass-embedded"),
        require("sass"),
        "sass-embedded",
        "sass",
      ],
      failure: [true, () => {}],
    },
    sassOptions: {
      success: [{}, { indentWidth: 6 }, () => ({ indentWidth: 6 })],
      failure: [true, "string"],
    },
    additionalData: {
      success: ["$color: red;", (content) => `$color: red;\n${content}`],
      failure: [true],
    },
    sourceMap: {
      success: [true, false],
      failure: ["string"],
    },
    webpackImporter: {
      success: [true, false],
      failure: ["string"],
    },
    warnRuleAsWarning: {
      success: [true, false],
      failure: ["string"],
    },
    api: {
      success: ["legacy", "modern", "modern-compiler"],
      failure: ["string", true],
    },
    unknown: {
      success: [],
      failure: [1, true, false, "test", /test/, [], {}, { foo: "bar" }],
    },
  };

  function stringifyValue(value) {
    if (
      Array.isArray(value) ||
      (value && typeof value === "object" && value.constructor === Object)
    ) {
      return JSON.stringify(value);
    }

    return value;
  }

  async function createTestCase(key, value, type) {
    it(`should ${
      type === "success" ? "successfully validate" : "throw an error on"
    } the "${key}" option with "${stringifyValue(value)}" value`, async (t) => {
      const testId = getTestId("language", "scss");
      const compiler = getCompiler(testId, {
        loader: {
          options: {
            implementation: getImplementationByName("dart-sass"),
            [key]: value,
          },
        },
      });
      let stats;

      try {
        stats = await compile(compiler);
      } finally {
        if (type === "success") {
          assert.equal(stats.hasErrors(), false);
        } else if (type === "failure") {
          const {
            compilation: { errors },
          } = stats;

          assert.equal(errors.length, 1);
          t.assert.snapshot(
            ((fn) => {
              try {
                fn();
                return null;
              } catch (e) {
                return e.message;
              }
            })(() => {
              throw new Error(errors[0].error.message);
            }),
          );
        }
      }
    });
  }

  for (const [key, values] of Object.entries(tests)) {
    for (const type of Object.keys(values)) {
      for (const value of values[type]) {
        createTestCase(key, value, type);
      }
    }
  }
});
