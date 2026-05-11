import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const APP_URL = process.env.APP_URL || 'http://127.0.0.1:5173';
const CHROME_PATH =
  process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT_DIR = path.resolve('docs/thesis-figures');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const figures = [
  {
    file: 'figure-4-1-system-overview.png',
    caption:
      'System overview of the Algorithmic Complexity Visualizer. The interface combines the grid artifact, algorithm controls, run state, and the schema-guided knowledge panel K = (A, D, S) used to ground visual execution in formal audit concepts.',
    placement: 'Chapter 4, Section 4.1 System Overview / 4.1.2 Key Components',
  },
  {
    file: 'figure-4-2-custom-maze-editor.png',
    caption:
      'Custom maze editing and obstacle configuration. Learners can generate or draw blocked cells on the 20 x 50 grid, defining the graph artifact G = (V, E) before executing BFS or A*.',
    placement: 'Chapter 4, Section 4.1.5 User Workflow / 4.5.1 User Journey',
  },
  {
    file: 'figure-4-3-prediction-checkpoint.png',
    caption:
      'Pause-Prediction checkpoint during A* execution. The visualizer pauses at a frontier decision point, highlights candidate nodes, and asks the learner to predict the next expansion according to the algorithm rule.',
    placement: 'Chapter 4, Section 4.6 Prediction Mechanism',
  },
  {
    file: 'figure-4-4-prediction-feedback.png',
    caption:
      'Immediate prediction feedback. A selected candidate is evaluated against the formal next-node rule, and the interface explains whether the choice satisfies BFS depth ordering or A* f(n) = g(n) + h(n) minimization.',
    placement: 'Chapter 4, Section 4.6.5 User Feedback System / 4.6.6 Gamification Design',
  },
  {
    file: 'figure-4-5-mathematical-trace.png',
    caption:
      'Mathematical trace view for a completed single-algorithm run. Each expansion is represented with its selected node, scoring equation, decision rule, and neighbor audit evidence.',
    placement: 'Chapter 4, Section 4.6.8 Frontend Architecture / Chapter 5, Section 5.3',
  },
  {
    file: 'figure-5-1-race-mode-comparison.png',
    caption:
      'Race Mode comparison between BFS and A*. Both algorithms run on the same maze artifact, allowing node-expansion and shortest-path metrics to be compared under identical conditions.',
    placement: 'Chapter 5, Section 5.1 Algorithm Performance Evaluation',
  },
  {
    file: 'figure-5-2-formal-result-analysis.png',
    caption:
      'Formal result analysis generated after execution. The summary links measured outputs, complexity indicators, effective branching behaviour, and prediction-learning signals to the audited run.',
    placement: 'Chapter 5, Section 5.3 System Validation and Framework Alignment',
  },
  {
    file: 'figure-4-6-visual-legend.png',
    caption:
      'Visualizer legend mapping colors and node states to semantic meaning, including start, goal, obstacle, visited state, shortest path, quiz candidate, and paused next-choice markers.',
    placement: 'Chapter 4, Section 4.5.4 Visual Feedback Language',
  },
];

async function clickByText(page, text, tag = 'button') {
  await page.evaluate(
    ({ text, tag }) => {
      const nodes = [...document.querySelectorAll(tag)];
      const target = nodes.find((node) => node.textContent.replace(/\s+/g, ' ').trim().includes(text));
      if (!target) throw new Error(`Could not find ${tag} containing text: ${text}`);
      target.click();
    },
    { text, tag },
  );
}

async function openFresh(page) {
  await page.goto(APP_URL, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 1600, height: 1100, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.zoom = '0.92';
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

    const range = document.querySelector('input[type="range"]');
    if (range) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(range, '5');
      range.dispatchEvent(new Event('input', { bubbles: true }));
      range.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await clickByText(page, 'Apply Settings');
  await page.waitForSelector('.modal-shell--settings', { hidden: true });
}

async function screenshot(page, file) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: false });
}

async function waitForDone(page, timeout = 70000) {
  await page.waitForFunction(
    () => document.body.textContent.includes('Done') || document.body.textContent.includes('View Formal Result Analysis'),
    { timeout },
  );
}

async function run() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1600, height: 1100, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    await openFresh(page);
    await setFastMode(page);
    await screenshot(page, 'figure-4-1-system-overview.png');

    await clickByText(page, 'Generate Maze');
    await clickByText(page, 'Obstacle Mode');
    await screenshot(page, 'figure-4-2-custom-maze-editor.png');

    await openFresh(page);
    await setFastMode(page);
    await clickByText(page, 'A*');
    await clickByText(page, 'Pause-Prediction', 'label');
    await clickByText(page, 'Visualize');
    await page.waitForSelector('.node-prediction-candidate', { timeout: 20000 });
    await screenshot(page, 'figure-4-3-prediction-checkpoint.png');
    await page.click('.node-prediction-candidate');
    await delay(500);
    await screenshot(page, 'figure-4-4-prediction-feedback.png');

    await openFresh(page);
    await setFastMode(page);
    await clickByText(page, 'A*');
    await clickByText(page, 'Visualize');
    await waitForDone(page, 30000);
    await clickByText(page, 'Mathematical Trace');
    await screenshot(page, 'figure-4-5-mathematical-trace.png');

    await openFresh(page);
    await setFastMode(page);
    await clickByText(page, 'Generate Maze');
    await clickByText(page, 'Race Mode', 'label');
    await clickByText(page, 'Start Race');
    await waitForDone(page);
    await screenshot(page, 'figure-5-1-race-mode-comparison.png');
    await clickByText(page, 'View Formal Result Analysis');
    await page.waitForSelector('.modal-shell--run-summary');
    await screenshot(page, 'figure-5-2-formal-result-analysis.png');

    await openFresh(page);
    await page.click('[aria-label="Open legend"]');
    await page.waitForSelector('.modal-shell--legend');
    await screenshot(page, 'figure-4-6-visual-legend.png');

    const captionMd = [
      '# Thesis Figure Captions',
      '',
      ...figures.flatMap((figure) => [
        `## ${figure.file}`,
        `Suggested placement: ${figure.placement}`,
        '',
        `Caption: ${figure.caption}`,
        '',
      ]),
    ].join('\n');
    await fs.writeFile(path.join(OUT_DIR, 'captions.md'), captionMd, 'utf8');
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
