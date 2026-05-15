import assert from "node:assert";
import { readFileSync } from "node:fs";
// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { findPackageJSON } from "node:module";
import path from "node:path";
import { describe, it, mock } from "node:test";
import { pathToFileURL } from "node:url";

import { sass, sassEmbedded } from "./helpers/getImplementationsAndAPI.js";
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

/**
 * Resolve the absolute `file:` URL that `await import(specifier)` from inside
 * `src/` would land on. Walks the package's `exports` field preferring the
 * `node` / `import` / `default` conditions, falling back to `module` / `main`.
 * Used to key `mock.module` so the loader's dynamic `import("sass-embedded")`
 * / `import("sass")` get intercepted even though they are issued from outside
 * the `test/` directory (and so are not affected by the `test/node_modules/sass`
 * fixture that blocks bare-specifier resolution from inside `test/`).
 * @param {string} specifier package name to resolve
 * @returns {string} `file:` URL of the package's ESM entry
 */
function resolveEsmEntry(specifier) {
  const pkgPath = findPackageJSON(
    specifier,
    new URL("../src/utils.js", import.meta.url),
  );
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

  const walk = (node) => {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) {
      for (const item of node) {
        const r = walk(item);
        if (r) return r;
      }
    }
    if (node && typeof node === "object") {
      for (const key of ["node", "import", "default"]) {
        if (key in node) {
          const r = walk(node[key]);
          if (r) return r;
        }
      }
    }
    return null;
  };

  const entry =
    (pkg.exports && walk(pkg.exports["."] ?? pkg.exports)) ??
    pkg.module ??
    pkg.main ??
    "index.js";

  return pathToFileURL(path.join(path.dirname(pkgPath), entry)).href;
}

const sassEsmURL = resolveEsmEntry("sass");
const sassEmbeddedEsmURL = resolveEsmEntry("sass-embedded");

// Make the loader's `await import("sass")` / `await import("sass-embedded")`
// resolve to the same plain-object wrappers the test mutates via
// `mock.method`. Later spy installs and property mutations on `sass` /
// `sassEmbedded` must propagate to the loader's view, which means
// `mock.module`'s exports have to read from the wrapper *live*.
//
// On Node 22 / 24, `mock.module({ namedExports, defaultExport })` is
// already live — internally those keys are accessed each time the
// mocked module is loaded. On Node 26, the deprecated keys are gone
// and the new unified `exports` option snapshots values at synthesis
// time, so we have to thread reads through getters that delegate to
// the wrapper.
const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0], 10);

/**
 * Build a `mock.module` options bag whose exports read live from the
 * given wrapper object.
 * @param {Record<string, unknown>} target wrapped namespace
 * @returns {Record<string, unknown>} options accepted by the running Node's `mock.module`
 */
function mockModuleOptions(target) {
  if (NODE_MAJOR < 26) {
    return { namedExports: target, defaultExport: target };
  }

  const liveExports = {};

  for (const key of Object.keys(target)) {
    Object.defineProperty(liveExports, key, {
      enumerable: true,
      get: () => target[key],
    });
  }

  Object.defineProperty(liveExports, "default", {
    enumerable: true,
    get: () => target,
  });

  return { exports: liveExports };
}

mock.module(sassEsmURL, mockModuleOptions(sass));
mock.module(sassEmbeddedEsmURL, mockModuleOptions(sassEmbedded));

/** @typedef {import("../src/index.js").EXPECTED_ANY} EXPECTED_ANY */

const implementations = [
  ...getImplementationsAndAPI(),
  {
    name: "sass_string",
    implementation: await getImplementationByName("sass_string"),
    api: "modern",
  },
  {
    name: "sass_file_url",
    implementation: await getImplementationByName("sass_file_url"),
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
  const dartSassSpyModernAPI = mock.method(sass, "compileStringAsync");
  const dartSassCompilerSpies = spyOnCompiler(sass);
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
      ...sass,
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
      implementation: { ...sass, info: "strange-sass\t1.0.0" },
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
      implementation: { ...sass, info: "asdfj" },
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
      implementation: { ...sass, info: undefined },
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

  // The two tests below originally relied on `jest.doMock` to make
  // `require("sass")` / `require("sass-embedded")` throw. `node:test`'s
  // `mock.module` resolves bare specifiers from the caller's location,
  // which used to trip on the `test/node_modules/sass` fixture (a
  // deliberately-invalid package). The fixture has since been renamed to
  // `test/node_modules/sass-test`, so the bare-specifier resolution
  // problem is gone — but `mock.module` for these URLs is *already* held
  // at the suite level (to give the loader and the spies the same
  // implementation object). Re-mocking would throw "module is already
  // mocked", so instead these tests temporarily mutate the very objects
  // the suite-level `mock.module` uses as `namedExports`. The loader's
  // `await import(...)` reads through to the live values, restored in
  // `finally`.
  it("should try to load using valid order", async () => {
    // `mock.module`'s synthesized exports list is locked at the time of
    // synthesis, so adding new keys to `sass` / `sassEmbedded` here
    // wouldn't reach the loader. Encode the marker into the existing
    // `info` export instead, which is what `getSassImplementation`
    // already reads to identify the implementation.
    const savedSassInfo = sass.info;
    const savedSassEmbeddedInfo = sassEmbedded.info;

    sass.info = "dart-sass\t99.0.0\t(Sass Compiler)\t[sass-mock]";
    sassEmbedded.info =
      "sass-embedded\t99.0.0\t(Sass Compiler)\t[sass-embedded-mock]";

    try {
      const { getSassImplementation } = await import(
        `../src/utils.js?valid-order=${Date.now()}`
      );
      const impl = await getSassImplementation({}, undefined);

      // sass-embedded is preferred when both load successfully.
      assert.match(impl.info, /^sass-embedded\t.*\[sass-embedded-mock\]/);
    } finally {
      sass.info = savedSassInfo;
      sassEmbedded.info = savedSassEmbeddedInfo;
    }
  });

  it("should not swallow an error when trying to load a sass implementation", async () => {
    // Make sass-embedded.info a getter that throws — `await import(...)`
    // succeeds (the mocked module is real), but the moment the loader
    // looks at `.info`, the throw surfaces instead of being silently
    // swallowed by a fallback to `sass`.
    const savedDesc = Object.getOwnPropertyDescriptor(sassEmbedded, "info");

    Object.defineProperty(sassEmbedded, "info", {
      configurable: true,
      enumerable: true,
      get() {
        throw new Error("Some error sass-embedded");
      },
    });

    try {
      const { getSassImplementation } = await import(
        `../src/utils.js?no-swallow=${Date.now()}`
      );

      await assert.rejects(
        getSassImplementation({}, undefined),
        /Some error sass-embedded/,
      );
    } finally {
      Object.defineProperty(sassEmbedded, "info", savedDesc);
    }
  });
});
