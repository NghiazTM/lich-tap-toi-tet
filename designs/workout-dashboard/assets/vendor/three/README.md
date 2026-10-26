# Three.js 0.186.1

Vendored from the official npm package `three@0.186.1` on 27/10/2026:
https://registry.npmjs.org/three/-/three-0.186.1.tgz

`three.module.min.js` bundles the package's original `build/three.module.js` and `build/three.core.js`, minified once using `esbuild@0.28.2`:

```sh
npx esbuild@0.28.2 three.module.js --bundle --minify --format=esm --legal-comments=linked --outfile=three.module.min.js
```

`LICENSE` is the upstream MIT license; the linked legal comment is retained beside the bundle. No CDN, npm dependency or build step is required to run or deploy the website. Loaded dynamically only when the motion stage is enabled and visible.
