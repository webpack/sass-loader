/* global expect */

/** @typedef {import("../../src/index.js").EXPECTED_ANY} EXPECTED_ANY */

/**
 * @param {string} url URL
 * @param {string} prev prev URL
 * @param {undefined | ((value: EXPECTED_ANY) => void)} done done callback
 * @returns {EXPECTED_ANY} result
 */
function customImporter(url, prev, done) {
  expect(url).toBe("import-with-custom-logic");
  expect(prev).toMatch(/(sass|scss)[/\\]custom-importer\.(scss|sass)/);
  expect(this.options).toBeDefined();

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
