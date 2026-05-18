import * as sassNs from "sass";
import * as sassEmbeddedNs from "sass-embedded";

/**
 * Copy every export from a module namespace except `default` into a plain,
 * mutable object. ESM namespace properties are non-configurable, so
 * `node:test`'s `mock.method` cannot replace them in place. The wrapper is
 * also handed straight to `mock.module`'s `namedExports` in
 * `implementation-option.test.js`, so any later `mock.method(wrapper, ...)`
 * mutates the exact object the mock module reads from — keeping the test
 * spies and the loader's `await import(...)` in lockstep.
 *
 * `default` is excluded because `mock.module` synthesizes ESM source text
 * from `namedExports`, and a `default` key would produce
 * `export const default = ...` (a syntax error). The default export is
 * fed in separately via `mock.module`'s `defaultExport` option.
 * @param {Record<string, unknown>} ns module namespace
 * @returns {Record<string, unknown>} mutable copy without the `default` key
 */
function namedExportsOnly(ns) {
  const copy = {};

  for (const key of Object.keys(ns)) {
    if (key !== "default") {
      copy[key] = ns[key];
    }
  }

  return copy;
}

const sass = namedExportsOnly(sassNs);
const sassEmbedded = namedExportsOnly(sassEmbeddedNs);

/** @typedef {import("../../src/index.js").EXPECTED_ANY} EXPECTED_ANY */

/**
 * @returns {{ name: string, implementation: EXPECTED_ANY, api: "modern" | "modern-compile" }} implementations
 */
export default function getImplementationsAndAPI() {
  return [
    {
      name: sass.info.split("\t")[0],
      implementation: sass,
      api: "modern",
    },
    {
      name: sass.info.split("\t")[0],
      implementation: sass,
      api: "modern-compiler",
    },
    {
      name: sassEmbedded.info.split("\t")[0],
      implementation: sassEmbedded,
      api: "modern",
    },
    {
      name: sassEmbedded.info.split("\t")[0],
      implementation: sassEmbedded,
      api: "modern-compiler",
    },
  ];
}

export { sass, sassEmbedded };
