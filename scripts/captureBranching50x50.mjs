import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const APP_URL = process.env.APP_URL || 'http://127.0.0.1:5173';
const CHROME_PATH =
  process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT_DIR = path.resolve('docs/thesis-figures');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function clickByText(page, text, tag = 'button') {
  await page.evaluate(
    ({ text, tag }) => {
      const nodes = [...document.querySelectorAll(tag)];
      const target = nodes.find((node) =>
        node.textContent.replace(/\s+/g, ' ').trim().includes(text),
      );
      if (!target) throw new Error(`Could not find ${tag} containing text: ${text}`);
      target.click();
    },
    { text, tag },
  );
}

async function setInputByLabel(page, labelText, value) {
  await page.evaluate(
    ({ labelText, value }) => {
      const label = [...document.querySelectorAll('label')].find((node) =>
        node.textContent.replace(/\s+/g, ' ').trim().includes(labelText),
      );
      const input = label?.querySelector('input');
      if (!input) throw new Error(`Could not find input for label: ${labelText}`);
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, String(value));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    { labelText, value },
  );
}

async function screenshot(page, file) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: false });
}

async function open50x50Lab(page) {
  await page.goto(APP_URL, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 1800, height: 1200, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.zoom = '0.9';
  });

  await setInputByLabel(page, 'Rows', 50);
  await setInputByLabel(page, 'Columns', 50);
  await clickByText(page, 'Enter The Audit Lab');
  await page.waitForSelector('.grid', { timeout: 20000 });
}

async function setFastMode(page) {
  await page.click('[aria-label="Open settings"]');
  await page.waitForSelector('.modal-shell--settings');
  await page.evaluate(() => {
    const fast = [...document.querySelectorAll('label')].find((label) =>
      label.textContent.includes('Fast'),
    );
    fast?.click();
  });
  await clickByText(page, 'Apply Settings');
  await page.waitForSelector('.modal-shell--settings', { hidden: true });
}

async function waitForDone(page, timeout = 120000) {
  await page.waitForFunction(
    () =>
      document.body.textContent.includes('Done') ||
      document.body.textContent.includes('View Formal Result Analysis'),
    { timeout },
  );
}

async function run() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1800, height: 1200, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await open50x50Lab(page);
    await setFastMode(page);

    await screenshot(page, 'figure-3-4-1-50x50-grid-model.png');

    await clickByText(page, 'Race Mode', 'label');
    await delay(300);
    await screenshot(page, 'figure-3-4-2-50x50-race-start.png');

    await clickByText(page, 'Start Race');
    await waitForDone(page);
    await screenshot(page, 'figure-3-4-3-50x50-bfs-astar-result.png');

    await clickByText(page, 'View Formal Result Analysis');
    await page.waitForSelector('.modal-shell--run-summary');
    await screenshot(page, 'figure-3-4-4-50x50-branching-analysis.png');
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
