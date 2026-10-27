"use strict";

/**
 * Gives a `data:` resource the context webpack gives one from webpack/webpack#22940
 * on: the directory of what referenced it, so tests run on older webpack too.
 * @this {import("webpack").LoaderContext<{ context: string }>}
 * @param {string} source source
 * @returns {string} the source, untouched
 */
function loader(source) {
  return source;
}

/**
 * @this {import("webpack").LoaderContext<{ context: string }>}
 */
loader.pitch = function pitch() {
  if (this.resourcePath.startsWith("data:")) {
    this.context = this.getOptions().context;
  }
};

module.exports = loader;
