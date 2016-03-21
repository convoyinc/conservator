# Conservator

Run focused scripts when files change.


## Example: Webpack

An example configuration for a webpack based project:

```js
#!/usr/bin/env node
var conservator = require('conservator');

conservator.service('./scripts/start:webpack', [
  '*.webpack.config.*',
]);

conservator.task('./scripts/test:style', [
  '{src,test}/**/*.{js,jsx}',
  '*.js',
]);

conservator.task('./scripts/test:unit', [
  'test/unit/**/*.js',
  {'src/(**/*).{js,jsx}': 'test/unit/$1.js'},
]);

conservator.start();
```
