import * as sass from "sass";
import * as sassEmbedded from "sass-embedded";

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
