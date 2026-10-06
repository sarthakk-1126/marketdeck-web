import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir:'tests/browser',testMatch:'market-block*.spec.mjs',workers:1,
  timeout:60000,expect:{timeout:15000},
  outputDir:'.preview/kinetic-test-results',reporter:'list',
  use:{baseURL:'http://127.0.0.1:4180',viewport:{width:1440,height:900},headless:true,launchOptions:{args:['--enable-unsafe-swiftshader']},trace:'retain-on-failure'},
  webServer:{command:'node scripts/dev.mjs --port 4180',url:'http://127.0.0.1:4180',reuseExistingServer:true}
});
