# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [16.0.6](https://github.com/webpack/sass-loader/compare/v16.0.5...v16.0.6) (2025-10-23)

### Bug Fixes

* cache fs calls for modern API

### [16.0.5](https://github.com/webpack-contrib/sass-loader/compare/v16.0.4...v16.0.5) (2025-02-14)


### Bug Fixes

* allow to import CSS using `@use` with `css` extension ([#1254](https://github.com/webpack-contrib/sass-loader/issues/1254)) ([3352e49](https://github.com/webpack-contrib/sass-loader/commit/3352e49f45ac9c7b0e9f6b42752443652e893e21))

### [16.0.4](https://github.com/webpack-contrib/sass-loader/compare/v16.0.3...v16.0.4) (2024-12-04)


### Bug Fixes

* include sources map сontent for modern api by default ([#1250](https://github.com/webpack-contrib/sass-loader/issues/1250)) ([70a10ff](https://github.com/webpack-contrib/sass-loader/commit/70a10fffa4b7fc971bccb3bb0a95d3f1d74f765a))

### [16.0.3](https://github.com/webpack-contrib/sass-loader/compare/v16.0.2...v16.0.3) (2024-11-01)


### Bug Fixes

* **modern-compiler:** dispose redundant compilers ([#1245](https://github.com/webpack-contrib/sass-loader/issues/1245)) ([004ed38](https://github.com/webpack-contrib/sass-loader/commit/004ed385084b3fa1e47bfc061124049716386b1b))

### [16.0.2](https://github.com/webpack-contrib/sass-loader/compare/v16.0.1...v16.0.2) (2024-09-20)


### Bug Fixes

* error message from sass ([#1231](https://github.com/webpack-contrib/sass-loader/issues/1231)) ([c75c606](https://github.com/webpack-contrib/sass-loader/commit/c75c6061266a6df6a7c736de407fcbf05ef5b2be))

## [16.0.1](https://github.com/webpack-contrib/sass-loader/compare/v16.0.0...v16.0.1) (2024-08-19)

### Bug Fixes

* generate correct sourceMaps for `modern-compiler` api ([#1228](https://github.com/webpack-contrib/sass-loader/issues/1228)) ([f862f7a](https://github.com/webpack-contrib/sass-loader/commit/f862f7a8382fab11c9c2a897ab1e26d35167cd10))

## [16.0.0](https://github.com/webpack-contrib/sass-loader/compare/v15.0.0...v16.0.0) (2024-07-26)


### ⚠ BREAKING CHANGES

* use modern Sass JS API by default for `sass` and `sass-embedded`

> [!WARNING]
>
> The sass options are different for the `legacy` (before) and `modern` APIs. Please look at [docs](https://sass-lang.com/documentation/js-api) how to migrate to the modern options.
> Legacy options - https://sass-lang.com/documentation/js-api/interfaces/legacystringoptions/
> Modern options - https://sass-lang.com/documentation/js-api/interfaces/options/

To return to the previous logic use:

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              api: "legacy",
              // Your options
            },
          },
        ],
      },
    ],
  },
};
```

### Features

* use modern Sass JS API by default for `sass` and `sass-embedded` ([10be1ba](https://github.com/webpack-contrib/sass-loader/commit/10be1ba161557638fd3b80f4a5467159179ef9b1))


## [15.0.0](https://github.com/webpack-contrib/sass-loader/compare/v14.2.1...v15.0.0) (2024-07-23)


### ⚠ BREAKING CHANGES

* prefer `sass-embedded` over `sass` by default (#1211)

### Features

* prefer `sass-embedded` over `sass` by default ([#1211](https://github.com/webpack-contrib/sass-loader/issues/1211)) ([83423ff](https://github.com/webpack-contrib/sass-loader/commit/83423ff933b1086e6203ca640c0994e14b95de2b))

### [14.2.1](https://github.com/webpack-contrib/sass-loader/compare/v14.2.0...v14.2.1) (2024-04-16)


### Bug Fixes

* avoid multiple sass compiler creation ([#1199](https://github.com/webpack-contrib/sass-loader/issues/1199)) ([77051d8](https://github.com/webpack-contrib/sass-loader/commit/77051d81b26ffe42e8a7c6769337a1c0f55f73ef))

## [14.2.0](https://github.com/webpack-contrib/sass-loader/compare/v14.1.1...v14.2.0) (2024-04-11)


### Features

* added the `modern-compiler` value for API to reuse compiler process ([#1195](https://github.com/webpack-contrib/sass-loader/issues/1195)) ([cef40a8](https://github.com/webpack-contrib/sass-loader/commit/cef40a8af9891adca9fc99d9641b46dc58db023f))
* support webpack built-in resolver for `modern` and `modern-compiler` API ([#1197](https://github.com/webpack-contrib/sass-loader/issues/1197)) ([2265b72](https://github.com/webpack-contrib/sass-loader/commit/2265b72c4899a6784e0785938f892743d1c942bf))

Notes:

Using the `modern-compiler` value for the `api` option together with `sass-embedded` reduces compilation time by 5-10 times, especially for projects using large files with a lot of `@import`/`@use`, for small files the build time reduction will not be significant.

### [14.1.1](https://github.com/webpack-contrib/sass-loader/compare/v14.1.0...v14.1.1) (2024-02-19)


### Bug Fixes

* handle `pkg:` scheme ([#1191](https://github.com/webpack-contrib/sass-loader/issues/1191)) ([c34c8e3](https://github.com/webpack-contrib/sass-loader/commit/c34c8e3330fb2b08cac217fc44ba602889a1db48))

## [14.1.0](https://github.com/webpack-contrib/sass-loader/compare/v14.0.0...v14.1.0) (2024-01-30)


### Features

* add `@rspack/core` as an optional peer dependency ([#1184](https://github.com/webpack-contrib/sass-loader/issues/1184)) ([637ba5b](https://github.com/webpack-contrib/sass-loader/commit/637ba5b49005ab5d31a2b2979ad9af7f008b0267))

## [14.0.0](https://github.com/webpack-contrib/sass-loader/compare/v13.3.3...v14.0.0) (2024-01-15)


### ⚠ BREAKING CHANGES

* removed `fibers` support
* minimum supported Node.js version is `18.12.0` ([627f55d](https://github.com/webpack-contrib/sass-loader/commit/627f55d750eb0aa21161b949b327e9801f971e98))

### [13.3.3](https://github.com/webpack-contrib/sass-loader/compare/v13.3.2...v13.3.3) (2023-12-25)


### Bug Fixes

* sass embedded importer detection ([e34f938](https://github.com/webpack-contrib/sass-loader/commit/e34f9387500c8ad8add4c1e1284912eaef7cf5c6))
* warning output ([#1173](https://github.com/webpack-contrib/sass-loader/issues/1173)) ([0084b93](https://github.com/webpack-contrib/sass-loader/commit/0084b93a9e061105f906a9e91294e0924b81c801))

### [13.3.2](https://github.com/webpack-contrib/sass-loader/compare/v13.3.1...v13.3.2) (2023-06-09)


### Bug Fixes

* **perf:** avoid using `klona` for `sass` options ([#1145](https://github.com/webpack-contrib/sass-loader/issues/1145)) ([9e87b6b](https://github.com/webpack-contrib/sass-loader/commit/9e87b6b103c4f8a32f89235f97f006c3a1115355))

### [13.3.1](https://github.com/webpack-contrib/sass-loader/compare/v13.3.0...v13.3.1) (2023-05-28)


### Bug Fixes

* error handling better ([#1141](https://github.com/webpack-contrib/sass-loader/issues/1141)) ([1f99474](https://github.com/webpack-contrib/sass-loader/commit/1f9947441ae95f7bd396886ec7a7d0ecbe939f8c))
* warnings and errors serialization ([#1142](https://github.com/webpack-contrib/sass-loader/issues/1142)) ([ed6f313](https://github.com/webpack-contrib/sass-loader/commit/ed6f3136f067e4c863077cb0d6c89c7ea8638bf8))

## [13.3.0](https://github.com/webpack-contrib/sass-loader/compare/v13.2.2...v13.3.0) (2023-05-22)


### Features

* add support for node-sass v9 ([#1140](https://github.com/webpack-contrib/sass-loader/issues/1140)) ([9a03c87](https://github.com/webpack-contrib/sass-loader/commit/9a03c87b192866a616a3fbab37dbeb3ea132de6b))

### [13.2.2](https://github.com/webpack-contrib/sass-loader/compare/v13.2.1...v13.2.2) (2023-03-27)


### Bug Fixes

* fix dependencies in modern API ([#1125](https://github.com/webpack-contrib/sass-loader/issues/1125)) ([50987bc](https://github.com/webpack-contrib/sass-loader/commit/50987bceca61b270375719ec6b731a071ecd83c2))

### [13.2.1](https://github.com/webpack-contrib/sass-loader/compare/v13.2.0...v13.2.1) (2023-03-18)


### Bug Fixes

* do not crash on a custom scheme in `@import`/`@use` for the modern API ([21966ee](https://github.com/webpack-contrib/sass-loader/commit/21966ee01efde0368996ac743a90efcb51c8d591))

## [13.2.0](https://github.com/webpack-contrib/sass-loader/compare/v13.1.0...v13.2.0) (2022-11-09)


### Features

* add support for node-sass v8 ([#1100](https://github.com/webpack-contrib/sass-loader/issues/1100)) ([e5581b7](https://github.com/webpack-contrib/sass-loader/commit/e5581b75e84879f27e221d67caa8507897e7051d))

## [13.1.0](https://github.com/webpack-contrib/sass-loader/compare/v13.0.2...v13.1.0) (2022-10-06)


### Features

* allow to extend `conditionNames` ([#1092](https://github.com/webpack-contrib/sass-loader/issues/1092)) ([6e02c64](https://github.com/webpack-contrib/sass-loader/commit/6e02c64da80e3c8b3b6399923b7268aaf957d2cb))

### [13.0.2](https://github.com/webpack-contrib/sass-loader/compare/v13.0.1...v13.0.2) (2022-06-27)


### Bug Fixes

* hide error stacktrace on Sass errors ([#1069](https://github.com/webpack-contrib/sass-loader/issues/1069)) ([5e6a61b](https://github.com/webpack-contrib/sass-loader/commit/5e6a61bd7248ff13fd4dbe882b2556f70cecf892))

### [13.0.1](https://github.com/webpack-contrib/sass-loader/compare/v13.0.0...v13.0.1) (2022-06-24)


### Bug Fixes

* optimize debug message formatting, [#1065](https://github.com/webpack-contrib/sass-loader/issues/1065) ([#1066](https://github.com/webpack-contrib/sass-loader/issues/1066)) ([49a578a](https://github.com/webpack-contrib/sass-loader/commit/49a578a218574ddc92a597c7e365b6c21960717e))

## [13.0.0](https://github.com/webpack-contrib/sass-loader/compare/v12.6.0...v13.0.0) (2022-05-18)


### ⚠ BREAKING CHANGES

* minimum supported `Node.js` version is `14.15.0` (#1048)
* emit `@warn` at-rules as webpack warnings by default, if you want to revert behavior please use the [`warnRuleAsWarning`](https://github.com/webpack-contrib/sass-loader#warnruleaswarning) option ([#1054](https://github.com/webpack-contrib/sass-loader/issues/1054)) ([58ffb68](https://github.com/webpack-contrib/sass-loader/commit/58ffb686768defb684669a2428bea040c95c2399))

### Bug Fixes

* do not crash on importers for modern API ([#1052](https://github.com/webpack-contrib/sass-loader/issues/1052)) ([095814e](https://github.com/webpack-contrib/sass-loader/commit/095814e6c2a991bacad3c3af4f239e9b1bc4b2e3))
* do not store original sass error in webpack error([#1053](https://github.com/webpack-contrib/sass-loader/issues/1053)) ([06d7533](https://github.com/webpack-contrib/sass-loader/commit/06d7533cef2029d4a91f4760071078eb676c8c1c))

## [12.6.0](https://github.com/webpack-contrib/sass-loader/compare/v12.5.0...v12.6.0) (2022-02-15)


### Features

* added support for automatic loading of `sass-embedded` ([#1025](https://github.com/webpack-contrib/sass-loader/issues/1025)) ([c8dae87](https://github.com/webpack-contrib/sass-loader/commit/c8dae87f0c90b13303096e0d3aec857c4046c36b))

## [12.5.0](https://github.com/webpack-contrib/sass-loader/compare/v12.4.0...v12.5.0) (2022-02-14)


### Features

* added support for `sass-embedded` (faster than `node-sass`), feel free to [feedback](https://github.com/webpack-contrib/sass-loader/issues/774)
* added the `api` option (`modern` api is experimental and currently doesn't support built-in webpack resolver) ([afbe114](https://github.com/webpack-contrib/sass-loader/commit/afbe114fecf54fa99ef635aea5ae1d3db6a119c1))

## [12.4.0](https://github.com/webpack-contrib/sass-loader/compare/v12.3.0...v12.4.0) (2021-12-07)


### Features

* add support for node-sass 7 ([#1002](https://github.com/webpack-contrib/sass-loader/issues/1002)) ([be5cbc9](https://github.com/webpack-contrib/sass-loader/commit/be5cbc9b5f851422bcead329d4bfb0c9dab5eb18))

## [12.3.0](https://github.com/webpack-contrib/sass-loader/compare/v12.2.0...v12.3.0) (2021-10-27)


### Features

* added the `warnRuleAsWarning` option, allows to emit a warning on the `@warn` rule ([#992](https://github.com/webpack-contrib/sass-loader/issues/992)) ([c652c79](https://github.com/webpack-contrib/sass-loader/commit/c652c79b67999546d0e65f237a947b3e1b454691))
* use webpack logger to log sass messages (only for `dart-sass`), configure it using [infrastructureLogging](https://webpack.js.org/configuration/other-options/#infrastructurelogging) ([#991](https://github.com/webpack-contrib/sass-loader/issues/991)) ([bb7cef9](https://github.com/webpack-contrib/sass-loader/commit/bb7cef97d5d9ba26dc2db2e1948a2a04b26f4031))

## [12.2.0](https://github.com/webpack-contrib/sass-loader/compare/v12.1.0...v12.2.0) (2021-10-12)


### Features

* add link field in schema ([#976](https://github.com/webpack-contrib/sass-loader/issues/976)) ([1b453fb](https://github.com/webpack-contrib/sass-loader/commit/1b453fb4926ab27616f3c38104033fafe37633ab))

## [12.1.0](https://github.com/webpack-contrib/sass-loader/compare/v12.0.0...v12.1.0) (2021-06-10)


### Features

* allow `String` value for the `implementation` option ([382a3ca](https://github.com/webpack-contrib/sass-loader/commit/382a3ca7ca8b7041712de30ce5ad8e6532944c1b))

## [12.0.0](https://github.com/webpack-contrib/sass-loader/compare/v11.1.1...v12.0.0) (2021-06-01)


### ⚠ BREAKING CHANGES

* minimum supported `Node.js` version is `12.13.0`

### Bug Fixes

* crash in custom importers with worker threads ([#958](https://github.com/webpack-contrib/sass-loader/issues/958)) ([67aa139](https://github.com/webpack-contrib/sass-loader/commit/67aa1391c12013aae70e08f5bbabb94e74b10a6d))
* resolving `_index.import.scss`/`index.import.scss` in packages ([#906](https://github.com/webpack-contrib/sass-loader/issues/906)) ([6641a16](https://github.com/webpack-contrib/sass-loader/commit/6641a16d510db653fbdc2bcfc265603c9f6fcd1a))

### [11.1.1](https://github.com/webpack-contrib/sass-loader/compare/v11.1.0...v11.1.1) (2021-05-13)


### Bug Fixes

* disabled auto importing `fiber` on node >= 16 due incompatibility problems ([#950](https://github.com/webpack-contrib/sass-loader/issues/950)) ([4ca004b](https://github.com/webpack-contrib/sass-loader/commit/4ca004b9e733bd2261ec68a7db4de07d79cf331a))

## [11.1.0](https://github.com/webpack-contrib/sass-loader/compare/v11.0.1...v11.1.0) (2021-05-10)


### Features

* support `node-sass` v6.0.0 ([#947](https://github.com/webpack-contrib/sass-loader/issues/947)) ([7869b29](https://github.com/webpack-contrib/sass-loader/commit/7869b29916d5120037a0e67063420b3333d7f68b))

### [11.0.1](https://github.com/webpack-contrib/sass-loader/compare/v11.0.0...v11.0.1) (2021-02-08)


### Bug Fixes

* compatibility with custom importers for `node-sass` ([#927](https://github.com/webpack-contrib/sass-loader/issues/927)) ([af5a072](https://github.com/webpack-contrib/sass-loader/commit/af5a072c5170f96f3d0643dec658248d98f65ff7))

## [11.0.0](https://github.com/webpack-contrib/sass-loader/compare/v10.1.1...v11.0.0) (2021-02-05)


### Notes

* using `~` is deprecated and can be removed from your code (**we recommend it**), but we still support it for historical reasons. 

Why you can removed it?
The loader will first try to resolve `@import`/`@use` as relative, if it cannot be resolved, the loader will try to resolve `@import`/`@use` inside [`node_modules`](https://webpack.js.org/configuration/resolve/#resolve-modules).
Using `~` means looking for files in [`node_modules`](https://webpack.js.org/configuration/resolve/#resolve-modules) or `resolve.alias` or `resolve.fallback`.

### ⚠ BREAKING CHANGES

* minimum supported `webpack` version is `5`

### Features

* supported the [`resolve.byDependency`](https://webpack.js.org/configuration/resolve/#resolvebydependency) option, you can setup `{ resolve: { byDependency: { sass: { mainFiles: ['custom', '...'] } } } }`

## [10.2.0](https://github.com/webpack-contrib/sass-loader/compare/v10.1.1...v10.2.0) (2021-05-10)


### Features

* support `node-sass` v6 ([dbbbdde](https://github.com/webpack-contrib/sass-loader/commit/dbbbdde8d73b5ebac89fdc3ca7009a644a471c5f))

### [10.1.1](https://github.com/webpack-contrib/sass-loader/compare/v10.1.0...v10.1.1) (2021-01-11)


### Bug Fixes

* problem with resolving and the `includePaths` option ([#913](https://github.com/webpack-contrib/sass-loader/issues/913)) ([cadc75e](https://github.com/webpack-contrib/sass-loader/commit/cadc75e80caf7d32ea47de1cbaab639f9204c0eb))

## [10.1.0](https://github.com/webpack-contrib/sass-loader/compare/v10.0.5...v10.1.0) (2020-11-11)


### Features

* allow the `additionalData` to be async ([#902](https://github.com/webpack-contrib/sass-loader/issues/902)) ([9d925ff](https://github.com/webpack-contrib/sass-loader/commit/9d925ff794e1e4cb9db253a6867bfa2405ec3428))

### [10.0.5](https://github.com/webpack-contrib/sass-loader/compare/v10.0.4...v10.0.5) (2020-11-02)


### Bug Fixes

* support node-sass v5.0.0 ([#899](https://github.com/webpack-contrib/sass-loader/issues/899)) ([c3e279f](https://github.com/webpack-contrib/sass-loader/commit/c3e279fb4668fce4c597a6c8cd1d0f2ff8bc95e5))

### [10.0.4](https://github.com/webpack-contrib/sass-loader/compare/v10.0.3...v10.0.4) (2020-10-22)


### Bug Fixes

* compatibility with the filesystem cache ([#896](https://github.com/webpack-contrib/sass-loader/issues/896)) ([e31f9b6](https://github.com/webpack-contrib/sass-loader/commit/e31f9b682f62e957fd2075582c3cf6cf0daf6b52))

### [10.0.3](https://github.com/webpack-contrib/sass-loader/compare/v10.0.2...v10.0.3) (2020-10-09)

### Chore

* update `schema-utils`

### [10.0.2](https://github.com/webpack-contrib/sass-loader/compare/v10.0.1...v10.0.2) (2020-09-03)


### Bug Fixes

* source maps generation ([#886](https://github.com/webpack-contrib/sass-loader/issues/886)) ([8327d55](https://github.com/webpack-contrib/sass-loader/commit/8327d55df9e8fc6e24d2759d7bd50174ed1ff1e4))

### [10.0.1](https://github.com/webpack-contrib/sass-loader/compare/v10.0.0...v10.0.1) (2020-08-25)

### Chore

* update deps

## [10.0.0](https://github.com/webpack-contrib/sass-loader/compare/v10.0.0-rc.0...v10.0.0) (2020-08-24)

### Bug Fixes

* handle absolute windows path in source maps

## [10.0.0-rc.0](https://github.com/webpack-contrib/sass-loader/compare/v9.0.3...v10.0.0-rc.0) (2020-08-24)


### ⚠ BREAKING CHANGES

* loader generates absolute `sources` in source maps, also avoids modifying `sass` source maps if the `sourceMap` option is `false`

### [9.0.3](https://github.com/webpack-contrib/sass-loader/compare/v9.0.2...v9.0.3) (2020-08-05)


### Bug Fixes

* resolution algorithm ([#875](https://github.com/webpack-contrib/sass-loader/issues/875)) ([ea73cfa](https://github.com/webpack-contrib/sass-loader/commit/ea73cfab047c751e1055d0c2ec58ef503f7dbe36))

### [9.0.2](https://github.com/webpack-contrib/sass-loader/compare/v9.0.1...v9.0.2) (2020-07-07)


### Bug Fixes

* resolution algorithm for `node-sass` ([#866](https://github.com/webpack-contrib/sass-loader/issues/866)) ([4584c90](https://github.com/webpack-contrib/sass-loader/commit/4584c9054befbc56661e2781a55df96fb9f94673))

### [9.0.1](https://github.com/webpack-contrib/sass-loader/compare/v9.0.0...v9.0.1) (2020-07-03)


### Bug Fixes

* do not crash on errors ([#860](https://github.com/webpack-contrib/sass-loader/issues/860)) ([e854933](https://github.com/webpack-contrib/sass-loader/commit/e8549330f8d9373ff8baccffbfd3e0c3b6f3ef61))

## [9.0.0](https://github.com/webpack-contrib/sass-loader/compare/v8.0.2...v9.0.0) (2020-07-02)


### ⚠ BREAKING CHANGES

* minimum supported Nodejs version is `10.13`
* prefer `sass` (`dart-sass`) by default, it is strongly recommended to migrate on `sass` (`dart-sass`)
* the `prependData` option was removed in favor the `additionalData` option, see [docs](https://github.com/webpack-contrib/sass-loader#additionaldata)
* when the `sourceMap` is `true`, `sassOptions.sourceMap`, `sassOptions.sourceMapContents`, `sassOptions.sourceMapEmbed`, `sassOptions.sourceMapRoot` and `sassOptions.omitSourceMapUrl` will be ignored.

### Features

* pass the loader context to custom importers under the `this.webpackLoaderContext` property ([#853](https://github.com/webpack-contrib/sass-loader/issues/853)) ([d487683](https://github.com/webpack-contrib/sass-loader/commit/d487683221fcd1e5a173e083b4b40644751c8cb1))
* supports for `process.cwd()` resolution logic by default ([#837](https://github.com/webpack-contrib/sass-loader/issues/837)) ([0c8d3b3](https://github.com/webpack-contrib/sass-loader/commit/0c8d3b3fb1cf371779b4a886cfc4e60facf68759))
* supports for `SASS-PATH` env variable resolution logic by default ([#836](https://github.com/webpack-contrib/sass-loader/issues/836)) ([8376179](https://github.com/webpack-contrib/sass-loader/commit/83761798380dcccc5a2badde3b3affe2bac385e8))
* supports for the `sass` property for the `exports` field from `package.json` (conditional exports, for more information read [docs](https://nodejs.org/api/esm.html))

### Bug Fixes

* avoid different content on different os ([#832](https://github.com/webpack-contrib/sass-loader/issues/832)) ([68dd278](https://github.com/webpack-contrib/sass-loader/commit/68dd27883ce0536adc5bc170816242c67fb118ff))
* resolution logic when the `includePaths` option used was improved ([#827](https://github.com/webpack-contrib/sass-loader/issues/827)) ([cbe5ad4](https://github.com/webpack-contrib/sass-loader/commit/cbe5ad407582a617be097d3eadd3ad8619e52507))
* resolution logic for `file://` scheme was improved ([17832fd](https://github.com/webpack-contrib/sass-loader/commit/17832fdb11f91593f4e2995003d67aebefb3be90))
* resolution logic for absolute paths and server relative URLs was improved
* source maps generation was improved

### [8.0.2](https://github.com/webpack-contrib/sass-loader/compare/v8.0.1...v8.0.2) (2020-01-13)


### Bug Fixes

* compatibility with node@8 ([#798](https://github.com/webpack-contrib/sass-loader/issues/798)) ([6f3852f](https://github.com/webpack-contrib/sass-loader/commit/6f3852f7d393dd0bc8f8d264d81ecc941bc72511))

### [8.0.1](https://github.com/webpack-contrib/sass-loader/compare/v8.0.0...v8.0.1) (2020-01-10)


### Bug Fixes

* support webpack@5 ([#794](https://github.com/webpack-contrib/sass-loader/issues/794)) ([6c59e37](https://github.com/webpack-contrib/sass-loader/commit/6c59e37e3f67668d7a3908444ddfc0176bc5601f))

## [8.0.0](https://github.com/webpack-contrib/sass-loader/compare/v7.3.1...v8.0.0) (2019-08-29)


### ⚠ BREAKING CHANGES

* minimum required `webpack` version is `4.36.0`
* minimum required `node.js` version is `8.9.0`
* move all sass (`includePaths`, `importer`, `functions`, `outputStyle`) options to the `sassOptions` option. The `functions` option can't be used as `Function`, you should use `sassOption` as `Function` to achieve this.
* the `data` option was renamed to the `prependData` option
* default value of the `sourceMap` option depends on the `devtool` value (`eval`/`false` values don't enable source map generation)


### Features

* automatically use the `fibers` package if it is possible ([#744](https://github.com/webpack-contrib/sass-loader/issues/744)) ([96184e1](https://github.com/webpack-contrib/sass-loader/commit/96184e1))
* source map generation depends on the `devtool` option ([#743](https://github.com/webpack-contrib/sass-loader/issues/743)) ([fcea88e](https://github.com/webpack-contrib/sass-loader/commit/fcea88e))
* validate loader options ([#737](https://github.com/webpack-contrib/sass-loader/issues/737)) ([7b543fc](https://github.com/webpack-contrib/sass-loader/commit/7b543fc))
* reworked error handling from `node-sass`/`sass`
* improve resolution for `@import` (including support `_index` and `index` files in a directory)

### Bug Fixes

* compatibility with `pnp`


### [7.3.1](https://github.com/webpack-contrib/sass-loader/compare/v7.3.0...v7.3.1) (2019-08-20)


### Bug Fixes

* minimum `node` version in `package.json` ([#733](https://github.com/webpack-contrib/sass-loader/issues/733)) ([1175920](https://github.com/webpack-contrib/sass-loader/commit/1175920))

## [7.3.0](https://github.com/webpack-contrib/sass-loader/compare/v7.2.0...v7.3.0) (2019-08-20)


### Bug Fixes

* handle module import ending `/` as module ([#728](https://github.com/webpack-contrib/sass-loader/issues/728)) ([997a255](https://github.com/webpack-contrib/sass-loader/commit/997a255))
* resolution algorithm ([#720](https://github.com/webpack-contrib/sass-loader/issues/720)) ([0e94940](https://github.com/webpack-contrib/sass-loader/commit/0e94940))
* use "compressed" output when mode is "production" ([#723](https://github.com/webpack-contrib/sass-loader/issues/723)) ([b2af379](https://github.com/webpack-contrib/sass-loader/commit/b2af379))


### Features

* `webpackImporter` option ([#732](https://github.com/webpack-contrib/sass-loader/issues/732)) ([6f4ea37](https://github.com/webpack-contrib/sass-loader/commit/6f4ea37))

<a name="7.2.0"></a>
# [7.2.0](https://github.com/webpack-contrib/sass-loader/compare/v7.1.0...v7.2.0) (2019-08-08)


### Bug Fixes

* better handle stdin in sources ([#681](https://github.com/webpack-contrib/sass-loader/issues/681)) ([e279f2a](https://github.com/webpack-contrib/sass-loader/commit/e279f2a))
* prefer `sass`/`scss`/`css` extensions ([#711](https://github.com/webpack-contrib/sass-loader/issues/711)) ([6fc9d4e](https://github.com/webpack-contrib/sass-loader/commit/6fc9d4e))
* relax node engine ([#708](https://github.com/webpack-contrib/sass-loader/issues/708)) ([2a51502](https://github.com/webpack-contrib/sass-loader/commit/2a51502))


### Features

* allow passing `functions` option as function ([#651](https://github.com/webpack-contrib/sass-loader/issues/651)) ([6c9654d](https://github.com/webpack-contrib/sass-loader/commit/6c9654d))
* support `data` as `Function` ([#648](https://github.com/webpack-contrib/sass-loader/issues/648)) ([aa64e1b](https://github.com/webpack-contrib/sass-loader/commit/aa64e1b))
* support `sass` and `style` fields in `package.json` ([#647](https://github.com/webpack-contrib/sass-loader/issues/647)) ([a8709c9](https://github.com/webpack-contrib/sass-loader/commit/a8709c9))
* support auto resolving `dart-sass` ([ff90dd6](https://github.com/webpack-contrib/sass-loader/commit/ff90dd6))



<a name="7.1.0"></a>
# [7.1.0](https://github.com/webpack-contrib/sass-loader/compare/v7.0.3...v7.1.0) (2018-08-01)


### Features

* Make this package implementation-agnostic (#573) ([bed9fb5](https://github.com/webpack-contrib/sass-loader/commit/bed9fb5)), closes [#435](https://github.com/webpack-contrib/sass-loader/issues/435)



<a name="7.0.3"></a>
## [7.0.3](https://github.com/webpack-contrib/sass-loader/compare/v7.0.2...v7.0.3) (2018-06-05)


### Bug Fixes

* Bare imports not working sometimes (#579) ([c348281](https://github.com/webpack-contrib/sass-loader/commit/c348281)), closes [#566](https://github.com/webpack-contrib/sass-loader/issues/566)



<a name="7.0.2"></a>
## [7.0.2](https://github.com/webpack-contrib/sass-loader/compare/v7.0.1...v7.0.2) (2018-06-02)


### Bug Fixes

* Errors being swallowed when trying to load node-sass (#576) ([6dfb274](https://github.com/webpack-contrib/sass-loader/commit/6dfb274)), closes [#563](https://github.com/webpack-contrib/sass-loader/issues/563)
* Report error to user for problems loading node-sass (#562) ([2529c07](https://github.com/webpack-contrib/sass-loader/commit/2529c07))



<a name="7.0.1"></a>
## [7.0.1](https://github.com/webpack-contrib/sass-loader/compare/v7.0.0...v7.0.1) (2018-04-13)


### Bug Fixes

* Wrong import precedence (#557) ([f4eeff1](https://github.com/webpack-contrib/sass-loader/commit/f4eeff1))



<a name="7.0.0"></a>
# [7.0.0](https://github.com/webpack-contrib/sass-loader/compare/v6.0.7...v7.0.0) (2018-04-13)


### Features

* Refactor resolving and simplify webpack config aliases (#479) ([e0fde1a](https://github.com/webpack-contrib/sass-loader/commit/e0fde1a))
* Remove `node-sass` from `peerDependencies` (#533) ([6439cef](https://github.com/webpack-contrib/sass-loader/commit/6439cef))


### BREAKING CHANGES

* Drop official node 4 support
* This slightly changes the resolving algorithm. Should not break in normal usage, but might break in complex configurations.
* The sass-loader throws an error at runtime now and refuses to compile if the peer dependency is wrong. This could break applications where npm's peer dependency warning was just ignored.



<a name="6.0.7"></a>
## [6.0.7](https://github.com/webpack-contrib/sass-loader/compare/v6.0.6...v6.0.7) (2018-03-03)


### Bug Fixes

* **package:** add `webpack >= v4.0.0` (`peerDependencies`) ([#541](https://github.com/webpack-contrib/sass-loader/issues/541)) ([620bdd4](https://github.com/webpack-contrib/sass-loader/commit/620bdd4))


### Performance Improvements

* use `neo-async` instead `async` ([#538](https://github.com/webpack-contrib/sass-loader/issues/538)) ([fab89dc](https://github.com/webpack-contrib/sass-loader/commit/fab89dc))



<a name="6.0.6"></a>
## [6.0.6](https://github.com/webpack-contrib/sass-loader/compare/v6.0.5...v6.0.6) (2017-06-14)

### Chore

* Adds Webpack 3.x version range to peerDependencies


<a name="6.0.5"></a>
# [6.0.5](https://github.com/webpack-contrib/sass-loader/compare/v6.0.5...v6.0.4) (2017-05-10)

### Bug Fixes

* importing file directly from scoped npm package [#450](https://github.com/webpack-contrib/sass-loader/pull/450) ([5d06e9d](https://github.com/webpack-contrib/sass-loader/commit/5d06e9d))


<a name="6.0.4"></a>
# [6.0.4](https://github.com/webpack-contrib/sass-loader/compare/v6.0.4...v6.0.3) (2017-05-09)

### Bug Fixes

* fix: Resolving of scoped npm packages [#447](https://github.com/webpack-contrib/sass-loader/pull/447)


<a name="6.0.3"></a>
# [6.0.3](https://github.com/webpack-contrib/sass-loader/compare/v6.0.3...v6.0.2) (2017-03-07)

### Bug Fixes

* Fix regression with empty files [#398](https://github.com/webpack-contrib/sass-loader/pull/398)


### Chore

* Reduce npm package size by using the [files](https://docs.npmjs.com/files/package.json#files) property in the `package.json`


<a name="6.0.2"></a>
# [6.0.2](https://github.com/webpack-contrib/sass-loader/compare/v6.0.2...v6.0.1) (2017-02-21)

### Chore

* Update dependencies [#383](https://github.com/webpack-contrib/sass-loader/pull/383)


<a name="6.0.1"></a>
# [6.0.1](https://github.com/webpack-contrib/sass-loader/compare/v6.0.1...v6.0.0) (2017-02-17)

### Bug Fixes

* Fix source maps in certain CWDs. [#377](https://github.com/webpack-contrib/sass-loader/pull/377)


<a name="6.0.0"></a>
# [6.0.0](https://github.com/webpack-contrib/sass-loader/compare/v6.0.0...v5.0.1) (2017-02-13)

### Bug Fixes

* Improve source map support. [#374](https://github.com/webpack-contrib/sass-loader/issues/374)


### BREAKING CHANGES

* This is breaking for the resolve-url-loader


<a name="5.0.1"></a>
# [5.0.1](https://github.com/webpack-contrib/sass-loader/compare/v5.0.1...v5.0.0) (2017-02-13)

### Bug Fixes

* Fix bug where multiple compilations interfered with each other. [#369](https://github.com/webpack-contrib/sass-loader/pull/369)


<a name="5.0.0"></a>
# [5.0.0](https://github.com/webpack-contrib/sass-loader/compare/v5.0.0...v4.1.1) (2017-02-13)

### Code Refactoring

* Remove synchronous compilation support [#334](https://github.com/webpack-contrib/sass-loader/pull/334)


### BREAKING CHANGES

* Remove node 0.12 support. [29b30755021a834e622bf4b5bb9db4d6e5913905](https://github.com/webpack-contrib/sass-loader/commit/29b30755021a834e622bf4b5bb9db4d6e5913905)
* Remove official node-sass@3 and webpack@1 support. [5a6bcb96d8bd7a7a11c33252ba739ffe09ca38c5](https://github.com/webpack-contrib/sass-loader/commit/5a6bcb96d8bd7a7a11c33252ba739ffe09ca38c5)
* Remove synchronous compilation support. [#334](https://github.com/webpack-contrib/sass-loader/pull/334)


<a name="4.1.1"></a>
# [4.1.1](https://github.com/webpack-contrib/sass-loader/compare/v4.1.1...v4.1.0) (2016-12-21)

### Chore

* Update webpack peer dependency to support 2.2.0rc. [#330](https://github.com/webpack-contrib/sass-loader/pull/330)


<a name="4.1.0"></a>
# [4.1.0](https://github.com/webpack-contrib/sass-loader/compare/v4.1.0...v4.0.2) (2016-12-14)

### Features

* Update `node-sass@4.0.0` [#319](https://github.com/webpack-contrib/sass-loader/pull/319)


<a name="4.0.2"></a>
# [4.0.2](https://github.com/webpack-contrib/sass-loader/compare/v4.0.2...v4.0.1) (2016-07-07)

### Bug Fixes

* Fix wrong context in customImporters [#281](https://github.com/webpack-contrib/sass-loader/pull/281)


<a name="4.0.1"></a>
# [4.0.1](https://github.com/webpack-contrib/sass-loader/compare/v4.0.1...v4.0.0) (2016-07-01)

### Bug Fixes

* Fix custom importers receiving `'stdin'` as second argument instead of the actual `resourcePath` [#267](https://github.com/webpack-contrib/sass-loader/pull/267)


<a name="4.0.0"></a>
# [4.0.0](https://github.com/webpack-contrib/sass-loader/compare/v4.0.0...v3.2.2) (2016-06-27)

### Bug Fixes

* Fix incorrect source map paths [#250](https://github.com/webpack-contrib/sass-loader/pull/250)


### BREAKING CHANGES

* Release new major version because the previous release was a breaking change in certain scenarios
  See: https://github.com/webpack-contrib/sass-loader/pull/250#issuecomment-228663059


<a name="3.2.2"></a>
# [3.2.2](https://github.com/webpack-contrib/sass-loader/compare/v3.2.2...v3.2.1) (2016-06-26)

### Bug Fixes

* Fix incorrect source map paths [#250](https://github.com/webpack-contrib/sass-loader/pull/250)


<a name="3.2.1"></a>
# [3.2.1](https://github.com/webpack-contrib/sass-loader/compare/v3.2.1...v3.2.0) (2016-06-19)

### Bug Fixes

* Add `webpack@^2.1.0-beta` as peer dependency [#233](https://github.com/webpack-contrib/sass-loader/pull/233)


<a name="3.2.0"></a>
# [3.2.0](https://github.com/webpack-contrib/sass-loader/compare/v3.2.0...v3.1.2) (2016-03-12)

### Features

* Append file content instead of overwriting when `data`-option is already present [#216](https://github.com/webpack-contrib/sass-loader/pull/216)
* Make `indentedSyntax` option a bit smarter [#196](https://github.com/webpack-contrib/sass-loader/pull/196)


<a name="3.1.2"></a>
# [3.1.2](https://github.com/webpack-contrib/sass-loader/compare/v3.1.2...v3.1.1) (2015-11-22)

### Bug Fixes

* Fix loader query not overriding webpack config [#189](https://github.com/webpack-contrib/sass-loader/pull/189)
* Update peer-dependencies [#182](https://github.com/webpack-contrib/sass-loader/pull/182)
  - `node-sass^3.4.2`
  - `webpack^1.12.6`


<a name="3.1.1"></a>
# [3.1.1](https://github.com/webpack-contrib/sass-loader/compare/v3.1.1...v3.1.0) (2015-10-26)

### Bug Fixes

* Fix missing module `object-assign` [#178](https://github.com/webpack-contrib/sass-loader/issues/178)


<a name="3.1.0"></a>
# [3.1.0](https://github.com/webpack-contrib/sass-loader/compare/v3.1.0...v3.0.0) (2015-10-25)

### Bug Fixes

* Fix a problem where modules with a `.` in their names were not resolved [#167](https://github.com/webpack-contrib/sass-loader/issues/167)


### Features

* Add possibility to also define all options in your `webpack.config.js` [#152](https://github.com/webpack-contrib/sass-loader/pull/152) [#170](https://github.com/webpack-contrib/sass-loader/pull/170)


<a name="3.0.0"></a>
# [3.0.0](https://github.com/webpack-contrib/sass-loader/compare/v3.0.0...v2.0.1) (2015-09-29)

### Bug Fixes

* Fix crash when Sass reported an error without `file` [#158](https://github.com/webpack-contrib/sass-loader/pull/158)


### BREAKING CHANGES

* Add `node-sass@^3.3.3` and `webpack@^1.12.2` as peer-dependency [#165](https://github.com/webpack-contrib/sass-loader/pull/165) [#166](https://github.com/webpack-contrib/sass-loader/pull/166) [#169](https://github.com/webpack-contrib/sass-loader/pull/169)


<a name="2.0.1"></a>
# [2.0.1](https://github.com/webpack-contrib/sass-loader/compare/v2.0.1...v2.0.0) (2015-08-14)

### Bug Fixes

* Add missing path normalization (fixes [#141](https://github.com/webpack-contrib/sass-loader/pull/141))


<a name="2.0.0"></a>
# [2.0.0](https://github.com/webpack-contrib/sass-loader/compare/v2.0.0...v1.0.4) (2015-08-06)

### Bug Fixes

* Add temporary fix for stuck processes (see [sass/node-sass#857](https://github.com/sass/node-sass/issues/857)) [#100](https://github.com/webpack-contrib/sass-loader/issues/100) [#119](https://github.com/webpack-contrib/sass-loader/issues/119) [#132](https://github.com/webpack-contrib/sass-loader/pull/132)
* Fix path resolving on Windows [#108](https://github.com/webpack-contrib/sass-loader/issues/108)
* Fix file watchers on Windows [#102](https://github.com/webpack-contrib/sass-loader/issues/102)
* Fix file watchers for files with errors [#134](https://github.com/webpack-contrib/sass-loader/pull/134)


### Code Refactoring

* Refactor [import resolving algorithm](https://github.com/webpack-contrib/sass-loader/blob/089c52dc9bd02ec67fb5c65c2c226f43710f231c/index.js#L293-L348). ([#138](https://github.com/webpack-contrib/sass-loader/issues/138)) ([c8621a1](https://github.com/webpack-contrib/sass-loader/commit/80944ccf09cd9716a100160c068d255c5d742338))


### BREAKING CHANGES

* The new algorithm is aligned to libsass' way of resolving files. This yields to different results if two files with the same path and filename but with different extensions are present. Though this change should be no problem for most users, we must flag it as breaking change. [#135](https://github.com/webpack-contrib/sass-loader/issues/135) [#138](https://github.com/webpack-contrib/sass-loader/issues/138)


<a name="1.0.4"></a>
# [1.0.4](https://github.com/webpack-contrib/sass-loader/compare/v1.0.4...v1.0.3) (2015-08-03)

### Bug Fixes

* Fix wrong source-map urls [#123](https://github.com/webpack-contrib/sass-loader/pull/123)
* Include source-map contents by default [#104](https://github.com/webpack-contrib/sass-loader/pull/104)


<a name="1.0.3"></a>
# [1.0.3](https://github.com/webpack-contrib/sass-loader/compare/v1.0.3...v1.0.2) (2015-07-22)

### Bug Fixes

* Fix importing css files from scss/sass [#101](https://github.com/webpack-contrib/sass-loader/issues/101)
* Fix importing Sass partials from includePath [#98](https://github.com/webpack-contrib/sass-loader/issues/98) [#110](https://github.com/webpack-contrib/sass-loader/issues/110)


<a name="1.0.2"></a>
# [1.0.2](https://github.com/webpack-contrib/sass-loader/compare/v1.0.2...v1.0.1) (2015-04-15)

### Bug Fixes

* Fix a bug where files could not be imported across language styles [#73](https://github.com/webpack-contrib/sass-loader/issues/73)
* Update peer-dependency `node-sass` to `3.1.0`


<a name="1.0.1"></a>
# [1.0.1](https://github.com/webpack-contrib/sass-loader/compare/v1.0.1...v1.0.0) (2015-03-31)

### Bug Fixes

* Fix Sass partials not being resolved anymore [#68](https://github.com/webpack-contrib/sass-loader/issues/68)
* Update peer-dependency `node-sass` to `3.0.0-beta.4`


<a name="1.0.0"></a>
# [1.0.0](https://github.com/webpack-contrib/sass-loader/compare/v1.0.0...v0.3.1) (2015-03-22)

### Bug Fixes

* Moved `node-sass^3.0.0-alpha.0` to `peerDependencies` [#28](https://github.com/webpack-contrib/sass-loader/issues/28)
* Using webpack's module resolver as custom importer [#39](https://github.com/webpack-contrib/sass-loader/issues/31)
* Add synchronous compilation support for usage with [enhanced-require](https://github.com/webpack/enhanced-require) [#39](https://github.com/webpack-contrib/sass-loader/pull/39)
