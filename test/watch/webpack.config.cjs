"use strict";

const path = require("node:path");

const sassLoader = require.resolve("../../src/index.js");

module.exports = {
  entry: [
    path.resolve(__dirname, "../scss/imports.scss"),
    path.resolve(__dirname, "../scss/import-include-paths.scss"),
  ],
  output: {
    path: path.resolve(__dirname, "../outputs/watch"),
    filename: "bundle.watch.js",
  },
  watch: true,
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
          },
          {
            loader: sassLoader,
            options: {
              includePaths: [path.resolve(__dirname, "../scss/includePath")],
            },
          },
        ],
      },
    ],
  },
};
