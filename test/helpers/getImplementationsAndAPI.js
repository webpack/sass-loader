import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const dartSass = require("sass");
const SassEmbedded = require("sass-embedded");

/** @typedef {import("../../src/index.js").EXPECTED_ANY} EXPECTED_ANY */

/**
 * @returns {{ name: string, implementation: EXPECTED_ANY, api: "legacy" | "modern" | "modern-compile" }} implementations
 */
export default function getImplementationsAndAPI() {
  return [
    {
      name: dartSass.info.split("\t")[0],
      implementation: dartSass,
      api: "legacy",
    },
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
      api: "legacy",
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
