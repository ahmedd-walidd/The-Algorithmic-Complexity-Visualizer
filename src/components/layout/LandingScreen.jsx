function LandingScreen({ gridPresets, landingDraft, setLandingDraft, onStart }) {
  const activePreset = gridPresets.find((preset) => preset.id === landingDraft.gridPreset);

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
              min="8"
              max="60"
              value={landingDraft.gridRows}
              onChange={(event) =>
                setLandingDraft((prev) => ({
                  ...prev,
                  gridPreset: 'custom',
                  gridRows: Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            Columns
            <input
              type="number"
              min="12"
              max="90"
              value={landingDraft.gridCols}
              onChange={(event) =>
                setLandingDraft((prev) => ({
                  ...prev,
                  gridPreset: 'custom',
                  gridCols: Number(event.target.value),
                }))
              }
            />
          </label>
          <div className="landing-grid-preview">
            Active grid: {activePreset?.id === 'custom'
              ? `${landingDraft.gridRows} x ${landingDraft.gridCols}`
              : `${activePreset?.rows ?? landingDraft.gridRows} x ${activePreset?.cols ?? landingDraft.gridCols}`}
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
    </main>
  );
}

export default LandingScreen;
