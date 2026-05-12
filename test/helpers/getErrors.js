import normalizeErrors from "./normalizeErrors.js";

export default (stats) => normalizeErrors(stats.compilation.errors.sort());
