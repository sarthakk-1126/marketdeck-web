import { build } from 'esbuild';
await build({ entryPoints: ['src/globe.js'], outfile: 'public/assets/globe.js', bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'linked' });
