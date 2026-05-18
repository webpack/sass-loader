---
"sass-loader": major
---

Convert source to native ECMAScript modules. The package now declares
`"type": "module"` and exposes both an ESM and a CommonJS build via the
`exports` field. CommonJS consumers continue to work via `require`, and
ESM consumers can now `import` the loader directly.
