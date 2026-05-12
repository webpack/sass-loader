---
"sass-loader": major
---

Add `"auto"` to the `api` option and make it the default. When the Sass implementation supports the modern compiler, `"auto"` enables it and reuses a single long-running compiler across files, which significantly improves build performance; otherwise it falls back to the `modern` API.
