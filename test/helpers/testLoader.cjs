"use strict";

/**
 * @param {string} content content
 * @param {RawSourceMap} sourceMap source map
 * @returns {string} test loader code
 */
function testLoader(content, sourceMap) {
  const result = { css: content };

  if (sourceMap) {
    result.sourceMap = sourceMap;
  }

  return `export default ${JSON.stringify(result)}`;
}

module.exports = testLoader;
