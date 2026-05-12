"use strict";

module.exports = {
  devtool: "source-map",
  mode: "development",
  output: {
    publicPath: "/dist/",
  },
  module: {
    rules: [
      {
        test: /\.scss$/i,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
            },
          },
          {
            loader: require.resolve("../../dist/cjs.cjs"),
            options: {
              api: process.env.SASS_API || "modern-compiler",
              implementation: process.env.SASS_IMPLEMENTATION
                ? require(process.env.SASS_IMPLEMENTATION)
                : require("sass"),
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  devServer: {
    static: __dirname,
  },
};
