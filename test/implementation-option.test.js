import assert from "node:assert";
import { createRequire } from "node:module";
import { describe, it, mock } from "node:test";

import {
  close,
  compile,
  getCodeFromBundle,
  getCompiler,
  getErrors,
  getImplementationByName,
  getImplementationsAndAPI,
  getTestId,
  getWarnings,
} from "./helpers/index.js";

const require = createRequire(import.meta.url);

const dartSass = require("sass");

// Use dynamic ESM import for `sass-embedded` so the test holds the same
// module instance the loader picks up via `await import(...)`. The CJS and
// ESM builds in the `exports` field are loaded as separate instances by
// Node, so a `require()`-based reference would mock a different copy.
const sassEmbedded = (await import("sass-embedded")).default;

/**
 * `node:test` `mock.method` cannot replace getter-style properties. Convert
 * them to plain data properties first so they can be mocked in place.
 * @param {EXPECTED_ANY} obj target object
 * @param {string} name property name
 * @typedef {import("../src/index.js").EXPECTED_ANY} EXPECTED_ANY
 */
function ensureDataProperty(obj, name) {
  const desc = Object.getOwnPropertyDescriptor(obj, name);
  if (desc && desc.get && !("value" in desc)) {
    Object.defineProperty(obj, name, {
      value: obj[name],
      writable: true,
      configurable: true,
      enumerable: desc.enumerable,
    });
  }
}

ensureDataProperty(dartSass, "compileStringAsync");
ensureDataProperty(dartSass, "initAsyncCompiler");
ensureDataProperty(sassEmbedded, "compileStringAsync");
ensureDataProperty(sassEmbedded, "initAsyncCompiler");

const implementations = [
  ...getImplementationsAndAPI(),
  {
    name: "sass_string",
    implementation: await getImplementationByName("sass_string"),
    api: "modern",
  },
];

/**
 * Helper to create spy functions for the modern Compiler API.
 * @param {EXPECTED_ANY} implementation an implementation
 * @returns {EXPECTED_ANY} spies bag
 */
const spyOnCompiler = (implementation) => {
  const actualFn = implementation.initAsyncCompiler.bind(implementation);

  const initSpy = mock.method(implementation, "initAsyncCompiler", async () => {
    const compiler = await actualFn();
    // eslint-disable-next-line no-use-before-define
    spies.compileStringSpy = mock.method(compiler, "compileStringAsync");
    return compiler;
  });

  const spies = {
    initSpy,
    mockClear() {
      if (this.compileStringSpy) {
        this.compileStringSpy.mock.resetCalls();
      }
    },
    mockRestore() {
      initSpy.mock.restore();
      delete this.compileStringSpy;
    },
  };

  return spies;
};

describe("implementation option", () => {
  const dartSassSpyModernAPI = mock.method(dartSass, "compileStringAsync");
  const dartSassCompilerSpies = spyOnCompiler(dartSass);
  const sassEmbeddedSpyModernAPI = mock.method(
    sassEmbedded,
    "compileStringAsync",
  );
  const sassEmbeddedCompilerSpies = spyOnCompiler(sassEmbedded);

  for (const item of implementations) {
    const { name: implementationName, api, implementation } = item;

    it(`'${implementationName}', '${api}' API`, async (t) => {
      const testId = getTestId("language", "scss");
      const options = { api, implementation };
      const compiler = getCompiler(testId, { loader: { options } });
      const stats = await compile(compiler);
      const { css, sourceMap } = getCodeFromBundle(stats, compiler);

      assert.notStrictEqual(css, undefined);
      assert.strictEqual(sourceMap, undefined);

      t.assert.snapshot(getWarnings(stats));
      t.assert.snapshot(getErrors(stats));

      if (
        implementationName === "dart-sass" ||
        implementationName === "dart-sass_string"
      ) {
        if (api === "modern") {
          assert.strictEqual(dartSassSpyModernAPI.mock.callCount(), 1);
          assert.strictEqual(sassEmbeddedSpyModernAPI.mock.callCount(), 0);
        } else if (api === "modern-compiler") {
          assert.strictEqual(dartSassSpyModernAPI.mock.callCount(), 0);
          assert.strictEqual(
            dartSassCompilerSpies.compileStringSpy.mock.callCount(),
            1,
          );
          assert.strictEqual(sassEmbeddedSpyModernAPI.mock.callCount(), 0);
        }
      } else if (implementationName === "sass-embedded") {
        if (api === "modern") {
          assert.strictEqual(dartSassSpyModernAPI.mock.callCount(), 0);
          assert.strictEqual(sassEmbeddedSpyModernAPI.mock.callCount(), 1);
        } else if (api === "modern-compiler") {
          assert.strictEqual(dartSassSpyModernAPI.mock.callCount(), 0);
          assert.strictEqual(sassEmbeddedSpyModernAPI.mock.callCount(), 0);
          assert.strictEqual(
            sassEmbeddedCompilerSpies.compileStringSpy.mock.callCount(),
            1,
          );
        }
      }

      dartSassSpyModernAPI.mock.resetCalls();
      dartSassCompilerSpies.mockClear();
      sassEmbeddedSpyModernAPI.mock.resetCalls();
      sassEmbeddedCompilerSpies.mockClear();

      await close(compiler);
    });
  }

  it("should throw error when unresolved package", async (t) => {
    const testId = getTestId("language", "scss");
    const options = {
      implementation: "unresolved",
    };
    const compiler = getCompiler(testId, { loader: { options } });
    const stats = await compile(compiler);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));

    await close(compiler);
  });

  it("not specify", async (t) => {
    const testId = getTestId("language", "scss");
    const options = {};
    const compiler = getCompiler(testId, { loader: { options } });
    const stats = await compile(compiler);
    const { css, sourceMap } = getCodeFromBundle(stats, compiler);

    assert.notStrictEqual(css, undefined);
    assert.strictEqual(sourceMap, undefined);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));

    // Default is `auto`, which prefers `modern-compiler` when the
    // implementation exposes `initAsyncCompiler` (sass-embedded does).
    assert.strictEqual(
      sassEmbeddedCompilerSpies.compileStringSpy.mock.callCount(),
      1,
    );
    assert.strictEqual(sassEmbeddedSpyModernAPI.mock.callCount(), 0);
    assert.strictEqual(dartSassSpyModernAPI.mock.callCount(), 0);
    assert.strictEqual(
      dartSassCompilerSpies.compileStringSpy?.mock.callCount() ?? 0,
      0,
    );

    sassEmbeddedCompilerSpies.mockClear();
    sassEmbeddedSpyModernAPI.mock.resetCalls();
    dartSassSpyModernAPI.mock.resetCalls();

    await close(compiler);
  });

  it("not specify with auto API", async (t) => {
    const testId = getTestId("language", "scss");
    const options = {
      api: "auto",
    };
    const compiler = getCompiler(testId, { loader: { options } });
    const stats = await compile(compiler);
    const { css, sourceMap } = getCodeFromBundle(stats, compiler);

    assert.notStrictEqual(css, undefined);
    assert.strictEqual(sourceMap, undefined);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));

    assert.strictEqual(
      sassEmbeddedCompilerSpies.compileStringSpy.mock.callCount(),
      1,
    );
    assert.strictEqual(sassEmbeddedSpyModernAPI.mock.callCount(), 0);
    assert.strictEqual(dartSassSpyModernAPI.mock.callCount(), 0);
    assert.strictEqual(
      dartSassCompilerSpies.compileStringSpy?.mock.callCount() ?? 0,
      0,
    );

    sassEmbeddedCompilerSpies.mockClear();
    sassEmbeddedSpyModernAPI.mock.resetCalls();
    dartSassSpyModernAPI.mock.resetCalls();

    await close(compiler);
  });

  it("auto API falls back to modern when initAsyncCompiler is absent", async (t) => {
    const testId = getTestId("language", "scss");
    const fakeImplementation = {
      ...dartSass,
      initAsyncCompiler: undefined,
    };
    const options = {
      api: "auto",
      implementation: fakeImplementation,
    };
    const compiler = getCompiler(testId, { loader: { options } });
    const stats = await compile(compiler);
    const { css, sourceMap } = getCodeFromBundle(stats, compiler);

    assert.notStrictEqual(css, undefined);
    assert.strictEqual(sourceMap, undefined);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));

    assert.strictEqual(dartSassSpyModernAPI.mock.callCount(), 1);
    assert.strictEqual(
      dartSassCompilerSpies.compileStringSpy?.mock.callCount() ?? 0,
      0,
    );
    assert.strictEqual(sassEmbeddedSpyModernAPI.mock.callCount(), 0);
    assert.strictEqual(
      sassEmbeddedCompilerSpies.compileStringSpy?.mock.callCount() ?? 0,
      0,
    );

    dartSassSpyModernAPI.mock.resetCalls();

    await close(compiler);
  });

  it("not specify with modern API", async (t) => {
    const testId = getTestId("language", "scss");
    const options = {
      api: "modern",
    };
    const compiler = getCompiler(testId, { loader: { options } });
    const stats = await compile(compiler);
    const { css, sourceMap } = getCodeFromBundle(stats, compiler);

    assert.notStrictEqual(css, undefined);
    assert.strictEqual(sourceMap, undefined);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));

    assert.strictEqual(sassEmbeddedSpyModernAPI.mock.callCount(), 1);
    assert.strictEqual(dartSassSpyModernAPI.mock.callCount(), 0);

    sassEmbeddedSpyModernAPI.mock.resetCalls();
    dartSassSpyModernAPI.mock.resetCalls();

    await close(compiler);
  });

  it("not specify with modern-compiler API", async (t) => {
    const testId = getTestId("language", "scss");
    const options = {
      api: "modern-compiler",
    };
    const compiler = getCompiler(testId, { loader: { options } });
    const stats = await compile(compiler);
    const { css, sourceMap } = getCodeFromBundle(stats, compiler);

    assert.notStrictEqual(css, undefined);
    assert.strictEqual(sourceMap, undefined);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));

    assert.strictEqual(
      sassEmbeddedCompilerSpies.compileStringSpy.mock.callCount(),
      1,
    );
    assert.strictEqual(sassEmbeddedSpyModernAPI.mock.callCount(), 0);
    assert.strictEqual(dartSassSpyModernAPI.mock.callCount(), 0);
    assert.strictEqual(
      dartSassCompilerSpies.compileStringSpy?.mock.callCount() ?? 0,
      0,
    );

    sassEmbeddedCompilerSpies.mockClear();
    sassEmbeddedSpyModernAPI.mock.resetCalls();
    dartSassSpyModernAPI.mock.resetCalls();

    await close(compiler);
  });

  for (const implementationName of ["sass-embedded", "dart-sass"]) {
    it(`should support switching the implementation within the same process when using the modern-compiler API (${implementationName})`, async (t) => {
      const testId = getTestId("language", "scss");
      const options = {
        api: "modern-compiler",
        implementation: await getImplementationByName(implementationName),
      };
      const compiler = getCompiler(testId, { loader: { options } });
      const stats = await compile(compiler);
      const { css, sourceMap } = getCodeFromBundle(stats, compiler);

      assert.notStrictEqual(css, undefined);
      assert.strictEqual(sourceMap, undefined);

      t.assert.snapshot(getWarnings(stats));
      t.assert.snapshot(getErrors(stats));

      assert.strictEqual(
        dartSassCompilerSpies.compileStringSpy?.mock.callCount() ?? 0,
        implementationName === "dart-sass" ? 1 : 0,
      );
      assert.strictEqual(
        sassEmbeddedCompilerSpies.compileStringSpy?.mock.callCount() ?? 0,
        implementationName === "sass-embedded" ? 1 : 0,
      );

      dartSassCompilerSpies.mockClear();
      sassEmbeddedCompilerSpies.mockClear();

      await close(compiler);
    });
  }

  it("should throw an error on an unknown sass implementation", async (t) => {
    const testId = getTestId("language", "scss");
    const options = {
      implementation: { ...dartSass, info: "strange-sass\t1.0.0" },
    };

    const compiler = getCompiler(testId, { loader: { options } });
    const stats = await compile(compiler);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));

    await close(compiler);
  });

  it('should throw an error when the "info" is unparseable', async (t) => {
    const testId = getTestId("language", "scss");
    const options = {
      implementation: { ...dartSass, info: "asdfj" },
    };

    const compiler = getCompiler(testId, { loader: { options } });
    const stats = await compile(compiler);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));

    await close(compiler);
  });

  it('should throw error when the "info" does not exist', async (t) => {
    const testId = getTestId("language", "scss");
    const options = {
      implementation: { ...dartSass, info: undefined },
    };

    const compiler = getCompiler(testId, { loader: { options } });
    const stats = await compile(compiler);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));

    await close(compiler);
  });

  it("should dispose redundant compilers for `modern-compiler`", async (t) => {
    sassEmbeddedCompilerSpies.mockRestore();

    let isInRace = false;

    let firstDisposeSpy;
    let secondDisposeSpy;

    const actualFn = sassEmbedded.initAsyncCompiler.bind(sassEmbedded);

    const initSpy = mock.method(sassEmbedded, "initAsyncCompiler", async () => {
      const compiler = await actualFn();

      if (!isInRace) {
        firstDisposeSpy = mock.method(compiler, "dispose");
        isInRace = true;

        return new Promise((resolve) => {
          const interval = setInterval(() => {
            if (!isInRace) {
              clearInterval(interval);
              resolve(compiler);
            }
          });
        });
      }

      isInRace = false;
      secondDisposeSpy = mock.method(compiler, "dispose");

      return compiler;
    });

    const testId1 = getTestId("language", "scss");
    const testId2 = getTestId("language", "sass");
    const options = { api: "modern-compiler" };

    const compiler = getCompiler(undefined, {
      entry: {
        one: `./${testId1}`,
        two: `./${testId2}`,
      },
      loader: { options },
    });
    const stats = await compile(compiler);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));
    assert.strictEqual(initSpy.mock.callCount(), 2);

    await close(compiler);

    initSpy.mock.restore();

    assert.strictEqual(firstDisposeSpy.mock.callCount(), 1);
    firstDisposeSpy.mock.restore();

    assert.strictEqual(secondDisposeSpy.mock.callCount(), 1);
    secondDisposeSpy.mock.restore();
  });

  // The two tests below relied on `jest.doMock` to make `require("sass")` /
  // `require("sass-embedded")` throw. `node:test`'s `mock.module` API uses ESM
  // resolution, which trips on the existing `test/node_modules/sass` fixture
  // directory (same package name, no entry point), so they're skipped until a
  // resolution-free mock is available.
  it(
    "should try to load using valid order",
    {
      skip: "blocked by test/node_modules/sass fixture (mock.module needs ESM resolution)",
    },
    async () => {
      // intentionally empty
    },
  );

  it(
    "should not swallow an error when trying to load a sass implementation",
    {
      skip: "blocked by test/node_modules/sass fixture (mock.module needs ESM resolution)",
    },
    async () => {
      // intentionally empty
    },
  );
});
