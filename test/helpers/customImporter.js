import assert from "node:assert/strict";

/** @typedef {import("../../src/index.js").EXPECTED_ANY} EXPECTED_ANY */

/**
 * @param {string} url URL
 * @param {string} prev prev URL
 * @param {undefined | ((value: EXPECTED_ANY) => void)} done done callback
 * @returns {EXPECTED_ANY} result
 */
function customImporter(url, prev, done) {
  assert.equal(url, "import-with-custom-logic");
  assert.match(prev, /(sass|scss)[/\\]custom-importer\.(scss|sass)/);
  assert.notEqual(this.options, undefined);

  if (done) {
    done(customImporter.returnValue);

    return;
  }

  return customImporter.returnValue;
}

customImporter.returnValue = {
  contents: ".custom-imported {}",
};

export default customImporter;
