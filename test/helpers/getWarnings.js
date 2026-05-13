import normalizeErrors from "./normalizeErrors.js";

export default (stats, needVerbose) =>
  normalizeErrors(stats.compilation.warnings.toSorted(), needVerbose);
