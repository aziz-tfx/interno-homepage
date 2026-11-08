#!/usr/bin/env node
// OG-картинки для соцсетей и поисковых сниппетов: assets/og.jpg (RU) и assets/og-uz.jpg (UZ).
// Запуск: node scripts/build-og.mjs  (нужен Playwright с Chromium: npm i -g playwright && npx playwright install chromium)
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const require = createRequire(import.meta.url);
const {chromium} = require('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const tpl = pathToFileURL(join(here, 'og.html')).href;

const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1200, height: 630}});
for (const [lang, out] of [['ru', 'og.jpg'], ['uz', 'og-uz.jpg']]) {
  await page.goto(`${tpl}?lang=${lang}`, {waitUntil: 'networkidle'});
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({path: join(here, '..', 'assets', out), type: 'jpeg', quality: 86});
  console.log('assets/' + out);
}
await browser.close();
