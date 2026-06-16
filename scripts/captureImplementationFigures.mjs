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
      const normalize = (node) => node.textContent.replace(/\s+/g, ' ').trim();
      const target =
        nodes.find((node) => normalize(node) === text) ||
        nodes.find((node) => normalize(node).includes(text));
      if (!target) throw new Error(`Could not find ${tag} containing text: ${text}`);
      target.click();
    },
    { text, tag },
  );
}

async function captureSelector(page, selector, file, padding = 12) {
  await page.waitForSelector(selector, { timeout: 20000 });
  const box = await page.$eval(selector, (node) => {
    const rect = node.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  });

  const viewport = page.viewport();
  const clip = {
    x: Math.max(0, Math.floor(box.x - padding)),
    y: Math.max(0, Math.floor(box.y - padding)),
    width: Math.min(
      viewport.width,
      Math.ceil(box.width + padding * 2),
    ),
    height: Math.min(
      viewport.height,
      Math.ceil(box.height + padding * 2),
    ),
  };

  await page.screenshot({ path: path.join(OUT_DIR, file), clip });
}

async function captureViewport(page, file) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: false });
}

async function openVisualizer(page) {
  await page.goto(`${APP_URL}/visualizer`, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.zoom = '0.95';
  });
  await page.waitForSelector('.grid');
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

async function waitForDone(page, timeout = 70000) {
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
    defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
    await captureViewport(page, 'landing-experiment-setup.png');

    await openVisualizer(page);
    await captureSelector(page, '.control-panel', 'ui-building-block-control-panel.png', 16);

    await page.click('[aria-label="Open settings"]');
    await page.waitForSelector('.modal-shell--settings');
    await captureSelector(page, '.modal-shell--settings', 'settings-and-grid-scale.png', 8);
    await clickByText(page, 'Apply Settings');
    await page.waitForSelector('.modal-shell--settings', { hidden: true });

    await clickByText(page, 'Generate Maze');
    await delay(700);
    await clickByText(page, 'Obstacle Mode');
    await captureSelector(page, '.visualizer-container', 'ui-building-block-grid-artifact.png', 10);

    await openVisualizer(page);
    await setFastMode(page);
    await clickByText(page, 'A*');
    await clickByText(page, 'Pause-Prediction', 'label');
    await clickByText(page, 'Visualize!');
    await page.waitForSelector('.node-prediction-candidate', { timeout: 25000 });
    await captureSelector(page, '.top-navigation-score', 'score-hud-prediction-loop.png', 8);
    await captureSelector(page, '.visualizer-container', 'ui-building-block-node-states.png', 8);

    await openVisualizer(page);
    await setFastMode(page);
    await clickByText(page, 'A*');
    await clickByText(page, 'Visualize!');
    await waitForDone(page, 40000);
    await captureSelector(page, '.side-panel', 'knowledge-space-manifesto-panel.png', 10);

    await page.goto(`${APP_URL}/truth-scanner`, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.zoom = '0.92';
      window.scrollTo(0, 0);
    });
    await captureViewport(page, 'truth-scanner-concept-layer.png');
    await page.waitForSelector('.truth-concept-tabs');
    await captureSelector(page, '.truth-concept-shell', 'truth-scanner-concept-tabs.png', 10);
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
