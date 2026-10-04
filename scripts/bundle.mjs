import { build } from 'esbuild';
await build({ entryPoints: ['src/globe.js'], outfile: 'public/assets/globe.js', bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'linked' });
await build({ entryPoints: ['src/market-block.js'], outfile: 'public/assets/market-block.js', bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'linked' });
await build({ entryPoints: ['src/lens.js'], loader: {'.html':'text'}, outfile: 'public/assets/lens.js', bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'linked' });
