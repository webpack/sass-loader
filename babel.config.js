const MIN_BABEL_VERSION = 7;

export default (api) => {
  api.assertVersion(MIN_BABEL_VERSION);

  const env = api.env();
  const isCjs = env === "cjs";

  return {
    presets: [
      [
        "@babel/preset-env",
        {
          targets: { node: "22.11.0" },
          modules: false,
        },
      ],
    ],
    plugins: isCjs
      ? [
          [
            "@babel/plugin-transform-modules-commonjs",
            {
              ignoreDynamicImport: true,
            },
          ],
        ]
      : [],
  };
};
