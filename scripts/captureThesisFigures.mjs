import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const APP_URL = process.env.APP_URL || 'http://127.0.0.1:5173/visualizer';
const CHROME_PATH =
  process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT_DIR = path.resolve('docs/thesis-figures');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const figures = [
  {
    file: 'landing-experiment-setup.png',
    caption:
      'Experiment initialization screen of the Algorithmic Complexity Visualizer. The learner selects the grid scale and equation-overlay instrumentation before entering the audit lab, making the chosen problem instance explicit before algorithm execution.',
    placement:
      'Chapter 1, Section 1.2 From visualizer to Graph Search Auditor / Chapter 4 before Section 4.1.1 System Components',
  },
  {
    file: '50x50-grid-model.png',
    caption:
      'Obstacle-free 50 x 50 grid instantiated in the implemented visualizer. The board contains |V| = 2500 cells and, under 4-connected movement, |E| = 4900 undirected adjacency edges.',
    placement:
      'Chapter 3, Section 3.4.1, immediately after the equations |V| = 2500 and |E| = 4900',
  },
  {
    file: '50x50-race-start.png',
    caption:
      'Race Mode initialized on the same obstacle-free 50 x 50 graph for BFS and A*. Both algorithms are evaluated on the identical start state s=(25,5) and target state t=(25,44).',
    placement:
      'Chapter 3, Section 3.4.1, optional setup figure before the BFS and A* branching-factor comparison',
  },
  {
    file: '50x50-bfs-astar-result.png',
    caption:
      'Completed 50 x 50 obstacle-free comparison. BFS expanded 1625 states before reaching the target, while A* expanded 40 states and followed the optimal path directly.',
    placement:
      'Chapter 3, Section 3.4.1, immediately after the finite-grid BFS bound',
  },
  {
    file: '50x50-branching-analysis.png',
    caption:
      'Formal result analysis for the 50 x 50 run. The implementation reports b<sub>graph</sub> as 3.92 for both algorithms, b<sub>observed</sub> as 3.94 for BFS and 3.90 for A*, and b<sub>effective</sub> reduced from 1.15 for BFS to 1.00 for A*.',
    placement:
      'Chapter 3, Section 3.4.1, immediately after the final search-space compression claim',
  },
  {
    file: 'system-overview-lab.png',
    caption:
      'System overview of the Algorithmic Complexity Visualizer. The interface combines the grid artifact, algorithm controls, run state, and the schema-guided knowledge panel K = (A, D, S) used to ground visual execution in formal audit concepts.',
    placement: 'Chapter 4, Section 4.1 System Overview / 4.1.2 Key Components',
  },
  {
    file: 'custom-maze-editor-lab.png',
    caption:
      'Custom maze editing and obstacle configuration. Learners can generate or draw blocked cells on the 20 x 50 grid, defining the graph artifact G = (V, E) before executing BFS or A*.',
    placement: 'Chapter 4, Section 4.1.5 User Workflow / 4.5.1 User Journey',
  },
  {
    file: 'prediction-checkpoint-lab.png',
    caption:
      'Pause-Prediction checkpoint during A* execution. The visualizer pauses at a frontier decision point, highlights candidate nodes, and asks the learner to predict the next expansion according to the algorithm rule.',
    placement: 'Chapter 4, Section 4.6 Prediction Mechanism',
  },
  {
    file: 'prediction-feedback-lab.png',
    caption:
      'Immediate prediction feedback. A selected candidate is evaluated against the formal next-node rule, and the interface explains whether the choice satisfies BFS depth ordering or A* f(n) = g(n) + h(n) minimization.',
    placement: 'Chapter 4, Section 4.6.5 User Feedback System / 4.6.6 Gamification Design',
  },
  {
    file: 'mathematical-trace-lab.png',
    caption:
      'Mathematical trace view for a completed single-algorithm run. Each expansion is represented with its selected node, scoring equation, decision rule, and neighbor audit evidence.',
    placement: 'Chapter 4, Section 4.6.8 Frontend Architecture / Chapter 5, Section 5.3',
  },
  {
    file: 'race-mode-comparison-lab.png',
    caption:
      'Race Mode comparison between BFS and A*. Both algorithms run on the same maze artifact, allowing node-expansion and shortest-path metrics to be compared under identical conditions.',
    placement: 'Chapter 5, Section 5.1 Algorithm Performance Evaluation',
  },
  {
    file: 'formal-result-analysis-lab.png',
    caption:
      'Formal result analysis generated after execution. The summary links measured outputs, complexity indicators, effective branching behaviour, and prediction-learning signals to the audited run.',
    placement: 'Chapter 5, Section 5.3 System Validation and Framework Alignment',
  },
  {
    file: 'visual-legend-lab.png',
    caption:
      'Visualizer legend mapping colors and node states to semantic meaning, including start, goal, obstacle, visited state, shortest path, quiz candidate, and paused next-choice markers.',
    placement: 'Chapter 4, Section 4.5.4 Visual Feedback Language',
  },
  {
    file: 'settings-and-grid-scale.png',
    caption:
      'Simulation settings dialog showing animation speed, Pause-Prediction cadence, equation-overlay control, and configurable grid size. These controls define the experimental conditions used by the visualizer.',
    placement: 'Chapter 4, Section 4.1.2 Implementation Stack / 4.7.1 Experimental Conditions',
  },
  {
    file: 'knowledge-space-manifesto-panel.png',
    caption:
      'Knowledge-space side panel representing the active run as K = (A, D, S). The interface exposes artifacts, generated trace documents, schema dimensions, retrieval expressions, and verification constraints used to audit algorithm behaviour.',
    placement: 'Chapter 4, Section 4.3 Algorithm Execution and Trace Logging / Chapter 5, Section 5.6',
  },
  {
    file: 'score-hud-prediction-loop.png',
    caption:
      'Pause-Prediction scoring interface after a learner response. The HUD records score, accuracy, attempts, and response-time signals, connecting prediction feedback to measurable learning indicators.',
    placement: 'Chapter 4, Section 4.5 Feedback and Learning Signal Design / Chapter 5, Section 5.4',
  },
  {
    file: 'truth-scanner-concept-layer.png',
    caption:
      'Truth Scanner concept layer explaining the graph model, branching factor, BFS rule, A* priority rule, and heuristic interpretation in prose linked to formal terms.',
    placement: 'Chapter 4, after Section 4.6 System Architecture and Execution Loop',
  },
  {
    file: 'truth-scanner-concept-tabs.png',
    caption:
      'Truth Scanner concept tabs for formal vocabulary such as graph model, effective branching, g(n), h(n), f(n), frontier, admissibility, consistency, relaxation, Pause-Prediction, and space complexity.',
    placement: 'Chapter 4, after Section 4.6 System Architecture and Execution Loop',
  },
];

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

async function openFresh(page) {
  await page.goto(APP_URL, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 1600, height: 1100, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.zoom = '0.92';
  });
  await page.waitForSelector('.grid');
}

async function openProofSidePanel(page) {
  const isOpen = await page.$('.side-panel');
  if (isOpen) return;

  await page.click('[aria-label="Open proof side panel"]');
  await page.waitForSelector('.side-panel');
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

async function waitForMazeIdle(page) {
  await page.waitForFunction(
    () => !document.body.textContent.includes('Generating...'),
    { timeout: 20000 },
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
    await screenshot(page, 'system-overview-lab.png');

    await clickByText(page, 'Generate Maze');
    await clickByText(page, 'Obstacle Mode');
    await screenshot(page, 'custom-maze-editor-lab.png');

    await openFresh(page);
    await setFastMode(page);
    await clickByText(page, 'A*');
    await clickByText(page, 'Pause-Prediction', 'label');
    await clickByText(page, 'Visualize!');
    await page.waitForSelector('.node-prediction-candidate', { timeout: 20000 });
    await screenshot(page, 'prediction-checkpoint-lab.png');
    await page.click('.node-prediction-candidate');
    await delay(500);
    await screenshot(page, 'prediction-feedback-lab.png');

    await openFresh(page);
    await setFastMode(page);
    await clickByText(page, 'A*');
    await clickByText(page, 'Visualize!');
    await waitForDone(page, 30000);
    await openProofSidePanel(page);
    await page.waitForSelector('.formal-trace-panel');
    await screenshot(page, 'mathematical-trace-lab.png');

    await openFresh(page);
    await setFastMode(page);
    await clickByText(page, 'Generate Maze');
    await waitForMazeIdle(page);
    await clickByText(page, 'Race Mode', 'label');
    await clickByText(page, 'Start Race!');
    await waitForDone(page);
    await screenshot(page, 'race-mode-comparison-lab.png');
    await clickByText(page, 'Formal Results Analysis');
    await page.waitForSelector('.modal-shell--run-summary');
    await screenshot(page, 'formal-result-analysis-lab.png');

    await openFresh(page);
    await page.click('[aria-label="Open legend"]');
    await page.waitForSelector('.modal-shell--legend');
    await screenshot(page, 'visual-legend-lab.png');

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
