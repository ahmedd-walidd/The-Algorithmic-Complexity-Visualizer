const TUTORIAL_STEPS = [
  {
    id: 'setup',
    eyebrow: '1. Configure',
    title: 'Pick a board that stays in view',
    body: 'Choose the experiment scale, then keep equation overlays enabled when you want g(n), h(n), and f(n) evidence during traversal.',
    image: '/tutorial/landing-setup.png',
  },
  {
    id: 'controls',
    eyebrow: '2. Run',
    title: 'Generate, edit, and visualize',
    body: 'Use maze generation, obstacle mode, BFS/A*, race mode, and timeline controls to shape the graph and inspect algorithm behavior.',
    image: '/tutorial/visualizer-controls.png',
  },
  {
    id: 'pause',
    eyebrow: '3. Pause',
    title: 'Use Spacebar as a microscope',
    body: 'During a single-algorithm run, press Spacebar to pause or resume. The pause freezes the frontier so the next expansion can be inspected instead of merely watched.',
    image: '/tutorial/spacebar-pause.png',
  },
  {
    id: 'labels',
    eyebrow: '4. Decode',
    title: 'Read g(n) and h(n) node labels',
    body: 'The yellow g(n) labels show path cost from the start. The blue h(n) labels show estimated remaining cost to the goal. A* chooses by f(n)=g(n)+h(n).',
    image: '/tutorial/trace-inspection.png',
  },
  {
    id: 'prediction',
    eyebrow: '5. Predict',
    title: 'Pause-Prediction is the core learning loop',
    body: 'Enable Pause-Prediction to stop at frontier decision points. The learner must choose the mathematically valid next node, then receives rule-based feedback.',
    image: '/tutorial/pause-prediction.png',
  },
  {
    id: 'trace',
    eyebrow: '6. Inspect',
    title: 'Read the formal trace',
    body: 'Open the side panel to compare frontier state, selected node, neighbor decisions, and proof checks for each expansion.',
    image: '/tutorial/trace-inspection.png',
  },
  {
    id: 'scanner',
    eyebrow: '7. Study',
    title: 'Continue to the Truth Scanner',
    body: 'After the lab, move to the Truth Scanner for a math-rigorous explanation of graph models, branching factors, heuristics, and f(n)=g(n)+h(n).',
    image: '/tutorial/truth-scanner.png',
  },
];

function LandingScreen({ gridPresets, gridLimits, landingDraft, setLandingDraft, onStart }) {
  const activePreset = gridPresets.find((preset) => preset.id === landingDraft.gridPreset);
  const previewRows = landingDraft.gridRows === '' ? '-' : landingDraft.gridRows;
  const previewCols = landingDraft.gridCols === '' ? '-' : landingDraft.gridCols;
  const activeTutorial =
    TUTORIAL_STEPS.find((step) => step.id === landingDraft.tutorialStep) || TUTORIAL_STEPS[0];

  const handlePresetSelect = (preset) => {
    if (!preset) return;
    setLandingDraft((prev) => ({
      ...prev,
      gridPreset: preset.id,
      gridRows: preset.rows ?? prev.gridRows,
      gridCols: preset.cols ?? prev.gridCols,
    }));
  };

  return (
    <main className="landing-screen">
      <div className="landing-hero">
        <div className="landing-badge">Algorithmic Complexity Visualizer</div>
        <h1>
          Architectural Audit Console
          <span>Map, measure, and verify informed search.</span>
        </h1>
        <p>
          Set the board scale and instrumentation before you enter the lab. The system records
          formal traces, branching metrics, and heuristic impact for each run.
        </p>
        <div className="landing-highlights">
          <article>
            <h3>Formal Trace</h3>
            <p>Every expansion is logged with f(n)=g(n)+h(n) proofs.</p>
          </article>
          <article>
            <h3>Branching Factor</h3>
            <p>See b_graph, b_observed, and b_effective in the analysis summary.</p>
          </article>
          <article>
            <h3>Heuristic Impact</h3>
            <p>Compare effective branching reduction between BFS and A*.</p>
          </article>
        </div>
      </div>

      <div className="landing-panel">
        <div className="landing-panel-header">
          <h2>Initialize Experiment</h2>
          <p>Choose your grid size and overlay instrumentation.</p>
        </div>

        <div className="landing-preset-grid">
          {gridPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`landing-preset-card${landingDraft.gridPreset === preset.id ? ' active' : ''}`}
              onClick={() => handlePresetSelect(preset)}
            >
              <strong>{preset.label}</strong>
              <span>
                {preset.id === 'custom'
                  ? 'Set your own scale'
                  : `${preset.rows} x ${preset.cols}`}
              </span>
            </button>
          ))}
        </div>

        <div className="landing-grid-inputs">
          <label>
            Rows
            <input
              type="number"
              min={gridLimits.minRows}
              max={gridLimits.maxRows}
              value={landingDraft.gridRows}
              onChange={(event) =>
                setLandingDraft((prev) => ({
                  ...prev,
                  gridPreset: 'custom',
                  gridRows: event.target.value === '' ? '' : Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            Columns
            <input
              type="number"
              min={gridLimits.minCols}
              max={gridLimits.maxCols}
              value={landingDraft.gridCols}
              onChange={(event) =>
                setLandingDraft((prev) => ({
                  ...prev,
                  gridPreset: 'custom',
                  gridCols: event.target.value === '' ? '' : Number(event.target.value),
                }))
              }
            />
          </label>
          <div className="landing-grid-preview">
            Active grid: {activePreset?.id === 'custom'
              ? `${previewRows} x ${previewCols}`
              : `${activePreset?.rows ?? landingDraft.gridRows} x ${activePreset?.cols ?? landingDraft.gridCols}`}
            <span>
              Overview limit: {gridLimits.maxRows} rows x {gridLimits.maxCols} columns
            </span>
          </div>
        </div>

        <label className="landing-toggle">
          <input
            type="checkbox"
            checked={landingDraft.showEquationOverlay}
            onChange={(event) =>
              setLandingDraft((prev) => ({
                ...prev,
                showEquationOverlay: event.target.checked,
              }))
            }
          />
          <span>Enable equation overlay + g/h ladder</span>
        </label>

        <button type="button" className="landing-start-btn" onClick={onStart}>
          Enter The Audit Lab
        </button>
      </div>

      <section className="landing-tutorial" aria-labelledby="landing-tutorial-title">
        <div className="landing-tutorial-copy">
          <span className="landing-badge">Guided tour</span>
          <h2 id="landing-tutorial-title">Learn the visualizer UI before the first run</h2>
        </div>

        <div className="landing-tutorial-shell">
          <nav className="landing-tutorial-nav" aria-label="Visualizer tutorial steps">
            {TUTORIAL_STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                className={`landing-tutorial-tab${activeTutorial.id === step.id ? ' active' : ''}`}
                onClick={() =>
                  setLandingDraft((prev) => ({
                    ...prev,
                    tutorialStep: step.id,
                  }))
                }
              >
                <span>{step.eyebrow}</span>
                <strong>{step.title}</strong>
              </button>
            ))}
          </nav>

          <article className="landing-tutorial-stage">
            <img src={activeTutorial.image} alt="" />
            <div className="landing-tutorial-caption">
              <span>{activeTutorial.eyebrow}</span>
              <h3>{activeTutorial.title}</h3>
              <p>{activeTutorial.body}</p>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

export default LandingScreen;
