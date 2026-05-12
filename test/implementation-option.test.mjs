import assert from "node:assert/strict";
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
const sassEmbedded = require("sass-embedded");

/**
 * `node:test` `mock.method` cannot replace getter-style properties. Convert
 * them to plain data properties first so that they can be mocked in place.
 * @param {object} obj target object
 * @param {string} name property name
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

ensureDataProperty(dartSass, "render");
ensureDataProperty(dartSass, "compileStringAsync");
ensureDataProperty(dartSass, "initAsyncCompiler");
ensureDataProperty(sassEmbedded, "render");
ensureDataProperty(sassEmbedded, "compileStringAsync");
ensureDataProperty(sassEmbedded, "initAsyncCompiler");
const implementations = [...getImplementationsAndAPI(), "sass_string"];

/**
 * Helper to create spy functions for the modern Compiler API
 * @param {"sass" | "sass-embedded"} implementation an implementation
 * @returns {JestSpy} jest spy
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
  const dartSassSpy = mock.method(dartSass, "render");
  const dartSassSpyModernAPI = mock.method(dartSass, "compileStringAsync");
  const dartSassCompilerSpies = spyOnCompiler(dartSass);
  const sassEmbeddedSpy = mock.method(sassEmbedded, "render");
  const sassEmbeddedSpyModernAPI = mock.method(
    sassEmbedded,
    "compileStringAsync",
  );
  const sassEmbeddedCompilerSpies = spyOnCompiler(sassEmbedded);

  for (const item of implementations) {
    let implementationName;
    let implementation;
    let api;

    if (typeof item === "string") {
      implementationName = item;
      implementation = getImplementationByName(implementationName);
      api = "legacy";
    } else {
      ({ name: implementationName, api, implementation } = item);
    }

    it(`'${implementationName}', '${api}' API`, async (t) => {
      const testId = getTestId("language", "scss");
      const options = { api, implementation };
      const compiler = getCompiler(testId, { loader: { options } });
      const stats = await compile(compiler);
      const { css, sourceMap } = getCodeFromBundle(stats, compiler);

      assert.notEqual(css, undefined);
      assert.equal(sourceMap, undefined);

      t.assert.snapshot(getWarnings(stats));
      t.assert.snapshot(getErrors(stats));

      if (
        implementationName === "dart-sass" ||
        implementationName === "dart-sass_string"
      ) {
        if (api === "modern") {
          assert.equal(dartSassSpy.mock.callCount(), 0);
          assert.equal(dartSassSpyModernAPI.mock.callCount(), 1);
          assert.equal(sassEmbeddedSpy.mock.callCount(), 0);
          assert.equal(sassEmbeddedSpyModernAPI.mock.callCount(), 0);
        } else if (api === "modern-compiler") {
          assert.equal(dartSassSpy.mock.callCount(), 0);
          assert.equal(dartSassSpyModernAPI.mock.callCount(), 0);
          assert.equal(
            dartSassCompilerSpies.compileStringSpy.mock.callCount(),
            1,
          );
          assert.equal(sassEmbeddedSpy.mock.callCount(), 0);
          assert.equal(sassEmbeddedSpyModernAPI.mock.callCount(), 0);
        } else if (api === "legacy") {
          assert.equal(dartSassSpy.mock.callCount(), 1);
          assert.equal(dartSassSpyModernAPI.mock.callCount(), 0);
          assert.equal(sassEmbeddedSpy.mock.callCount(), 0);
          assert.equal(sassEmbeddedSpyModernAPI.mock.callCount(), 0);
        }
      } else if (implementationName === "sass-embedded") {
        if (api === "modern") {
          assert.equal(dartSassSpy.mock.callCount(), 0);
          assert.equal(dartSassSpyModernAPI.mock.callCount(), 0);
          assert.equal(sassEmbeddedSpy.mock.callCount(), 0);
          assert.equal(sassEmbeddedSpyModernAPI.mock.callCount(), 1);
        } else if (api === "modern-compiler") {
          assert.equal(dartSassSpy.mock.callCount(), 0);
          assert.equal(dartSassSpyModernAPI.mock.callCount(), 0);
          assert.equal(sassEmbeddedSpy.mock.callCount(), 0);
          assert.equal(sassEmbeddedSpyModernAPI.mock.callCount(), 0);
          assert.equal(
            sassEmbeddedCompilerSpies.compileStringSpy.mock.callCount(),
            1,
          );
        } else if (api === "legacy") {
          assert.equal(dartSassSpy.mock.callCount(), 0);
          assert.equal(dartSassSpyModernAPI.mock.callCount(), 0);
          assert.equal(sassEmbeddedSpy.mock.callCount(), 1);
          assert.equal(sassEmbeddedSpyModernAPI.mock.callCount(), 0);
        }
      }

      dartSassSpy.mock.resetCalls();
      dartSassSpyModernAPI.mock.resetCalls();
      dartSassCompilerSpies.mockClear();
      sassEmbeddedSpy.mock.resetCalls();
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

    assert.notEqual(css, undefined);
    assert.equal(sourceMap, undefined);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));

    assert.equal(sassEmbeddedSpy.mock.callCount(), 0);
    assert.equal(sassEmbeddedSpyModernAPI.mock.callCount(), 1);
    assert.equal(dartSassSpy.mock.callCount(), 0);
    assert.equal(dartSassSpyModernAPI.mock.callCount(), 0);

    sassEmbeddedSpy.mock.resetCalls();
    sassEmbeddedSpyModernAPI.mock.resetCalls();
    dartSassSpy.mock.resetCalls();
    dartSassSpyModernAPI.mock.resetCalls();

    await close(compiler);
  });

  it("not specify with legacy API", async (t) => {
    const testId = getTestId("language", "scss");
    const options = {
      api: "legacy",
    };
    const compiler = getCompiler(testId, { loader: { options } });
    const stats = await compile(compiler);
    const { css, sourceMap } = getCodeFromBundle(stats, compiler);

    assert.notEqual(css, undefined);
    assert.equal(sourceMap, undefined);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));

    assert.equal(sassEmbeddedSpy.mock.callCount(), 1);
    assert.equal(dartSassSpy.mock.callCount(), 0);

    sassEmbeddedSpy.mock.resetCalls();
    sassEmbeddedSpyModernAPI.mock.resetCalls();
    dartSassSpy.mock.resetCalls();
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

    assert.notEqual(css, undefined);
    assert.equal(sourceMap, undefined);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));

    assert.equal(sassEmbeddedSpyModernAPI.mock.callCount(), 1);
    assert.equal(dartSassSpyModernAPI.mock.callCount(), 0);

    sassEmbeddedSpy.mock.resetCalls();
    sassEmbeddedSpyModernAPI.mock.resetCalls();
    dartSassSpy.mock.resetCalls();
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

    assert.notEqual(css, undefined);
    assert.equal(sourceMap, undefined);

    t.assert.snapshot(getWarnings(stats));
    t.assert.snapshot(getErrors(stats));

    assert.equal(
      sassEmbeddedCompilerSpies.compileStringSpy.mock.callCount(),
      1,
    );
    assert.equal(sassEmbeddedSpyModernAPI.mock.callCount(), 0);
    assert.equal(dartSassSpyModernAPI.mock.callCount(), 0);
    assert.equal(dartSassCompilerSpies.compileStringSpy.mock.callCount(), 0);

    sassEmbeddedSpy.mock.resetCalls();
    sassEmbeddedSpyModernAPI.mock.resetCalls();
    dartSassSpy.mock.resetCalls();
    dartSassSpyModernAPI.mock.resetCalls();

    await close(compiler);
  });

  for (const implementationName of ["sass-embedded", "dart-sass"]) {
    it(`should support switching the implementation within the same process when using the modern-compiler API (${implementationName})`, async (t) => {
      const testId = getTestId("language", "scss");
      const options = {
        api: "modern-compiler",
        implementation: getImplementationByName(implementationName),
      };
      const compiler = getCompiler(testId, { loader: { options } });
      const stats = await compile(compiler);
      const { css, sourceMap } = getCodeFromBundle(stats, compiler);

      assert.notEqual(css, undefined);
      assert.equal(sourceMap, undefined);

      t.assert.snapshot(getWarnings(stats));
      t.assert.snapshot(getErrors(stats));

      assert.equal(
        dartSassCompilerSpies.compileStringSpy.mock.callCount(),
        implementationName === "dart-sass" ? 1 : 0,
      );
      assert.equal(
        sassEmbeddedCompilerSpies.compileStringSpy.mock.callCount(),
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
    assert.equal(initSpy.mock.callCount(), 2);

    await close(compiler);

    initSpy.mock.restore();

    assert.equal(firstDisposeSpy.mock.callCount(), 1);
    firstDisposeSpy.mock.restore();

    assert.equal(secondDisposeSpy.mock.callCount(), 1);
    secondDisposeSpy.mock.restore();
  });

  // Simulate a sass module that throws on import by replacing the default
  // export with a Proxy that throws on any property access.
  const makeThrowingModule = (message) => ({
    defaultExport: new Proxy(
      {},
      {
        get() {
          const error = new Error(message);
          error.code = "MODULE_NOT_FOUND";
          error.stack = null;
          throw error;
        },
      },
    ),
  });

  // The two tests below rely on `t.mock.module()` to make "sass" /
  // "sass-embedded" imports fail. Node's experimental test module mocker uses
  // ESM resolution, which trips on the `test/node_modules/sass` Sass fixture
  // directory (it shares the package name but has no `package.json`/entry
  // point, so ESM cannot resolve it before mocking). We skip these tests
  // until the test runner allows mocking modules without resolution.
  it(
    "should try to load using valid order",
    {
      skip: "blocked by test/node_modules/sass fixture (mock.module needs ESM resolution)",
    },
    async (t) => {
      t.mock.module("sass", makeThrowingModule("Some error sass"));
      t.mock.module(
        "sass-embedded",
        makeThrowingModule("Some error sass-embedded"),
      );

      const testId = getTestId("language", "scss");
      const options = {};

      const compiler = getCompiler(testId, { loader: { options } });
      const stats = await compile(compiler);

      t.assert.snapshot(getWarnings(stats));
      t.assert.snapshot(getErrors(stats));

      await close(compiler);
    },
  );

  it(
    "should not swallow an error when trying to load a sass implementation",
    {
      skip: "blocked by test/node_modules/sass fixture (mock.module needs ESM resolution)",
    },
    async (t) => {
      t.mock.module("sass", makeThrowingModule("Some error"));

      const testId = getTestId("language", "scss");
      const options = {};

      const compiler = getCompiler(testId, { loader: { options } });
      const stats = await compile(compiler);

      t.assert.snapshot(getWarnings(stats));
      t.assert.snapshot(getErrors(stats));

      await close(compiler);
    },
  );
});
