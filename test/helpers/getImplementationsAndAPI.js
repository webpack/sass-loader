import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const dartSass = require("sass");

// Match the loader's `await import("sass-embedded")` so tests and loader
// hold the same module instance (CJS and ESM builds are cached separately).
const SassEmbedded = (await import("sass-embedded")).default;

/** @typedef {import("../../src/index.js").EXPECTED_ANY} EXPECTED_ANY */

/**
 * @returns {{ name: string, implementation: EXPECTED_ANY, api: "modern" | "modern-compile" }} implementations
 */
export default function getImplementationsAndAPI() {
  return [
    {
      name: dartSass.info.split("\t")[0],
      implementation: dartSass,
      api: "modern",
    },
    {
      name: dartSass.info.split("\t")[0],
      implementation: dartSass,
      api: "modern-compiler",
    },
    {
      name: SassEmbedded.info.split("\t")[0],
      implementation: SassEmbedded,
      api: "modern",
    },
    {
      name: SassEmbedded.info.split("\t")[0],
      implementation: SassEmbedded,
      api: "modern-compiler",
    },
  ];
}
