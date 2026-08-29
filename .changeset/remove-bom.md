---
"sass-loader": patch
---

Remove the byte order mark (BOM) from the compiled CSS. `dart-sass` prepends it when the compiled CSS contains non ASCII characters and the `style` option is `compressed` (the default for the `production` mode), but a BOM is only valid at the very beginning of a file - tools like `css-loader` move `@import` at-rules above it, so it ended up in the middle of the generated CSS and broke the rule after it. Source maps are shifted accordingly.
