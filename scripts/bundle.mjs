import { build } from 'esbuild';
await build({ entryPoints: ['src/strategy-lab-experience.js'], outfile: 'public/assets/strategy-lab-experience.js', bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'linked' });
await build({ entryPoints: ['src/strategy-lab.js'], outfile: 'public/assets/strategy-lab.js', bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'linked' });
await build({ entryPoints: ['src/globe.js'], outfile: 'public/assets/globe.js', bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'linked' });
await build({ entryPoints: ['src/market-block.js'], outfile: 'public/assets/market-block.js', bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'linked' });
await build({ entryPoints: ['src/lens.js'], loader: {'.html':'text'}, outfile: 'public/assets/lens.js', bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'linked' });

await build({ entryPoints: ['src/research-desk.js'], outfile: 'public/assets/research-desk.js', bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'linked' });
await build({ entryPoints: ['src/research-terminal-workspace.js'], outfile: 'public/assets/research-terminal.js', bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'linked' });
await build({ entryPoints: ['src/research-terminal-premium.js'], outfile: 'public/assets/research-terminal-premium.js', bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'linked' });
await build({ entryPoints: ['src/research-desk-embed.js'], outfile: 'public/assets/research-desk-embed.js', bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'linked' });
