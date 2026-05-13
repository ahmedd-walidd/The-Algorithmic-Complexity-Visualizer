import ModalShell from '../common/ModalShell/ModalShell';

const SPEED_OPTIONS = [
  { value: 'slow', label: 'Slow', detail: 'Easier to follow' },
  { value: 'medium', label: 'Medium', detail: 'Balanced pace' },
  { value: 'fast', label: 'Fast', detail: 'Quick runs' },
];

const GRID_PRESETS = [
  { id: 'small', label: 'Small', rows: 10, cols: 25 },
  { id: 'default', label: 'Default', rows: 20, cols: 50 },
  { id: 'large', label: 'Large', rows: 30, cols: 75 },
  { id: 'custom', label: 'Custom', rows: null, cols: null },
];

function SettingsModal({
  isOpen,
  settingsDraft,
  setSettingsDraft,
  closeSettings,
  saveSettings,
  resetSettingsToDefaults,
}) {
  if (!isOpen) return null;

  return (
    <ModalShell
      className="modal-shell--settings"
      titleId="settings-title"
      kicker="Preferences"
      title="Simulation Settings"
      onClose={closeSettings}
      footer={(
        <>
          <button type="button" className="settings-secondary-btn" onClick={closeSettings}>
            Cancel
          </button>
          <button type="button" className="settings-primary-btn" onClick={saveSettings}>
            Apply Settings
          </button>
        </>
      )}
    >
      <section className="settings-card">
        <h3>Simulation Speed</h3>
        <p>Controls how quickly traversal steps are animated.</p>
        <div className="settings-option-list" role="radiogroup" aria-label="Simulation speed">
          {SPEED_OPTIONS.map((option) => (
            <label key={option.value} className="settings-option-card">
              <input
                type="radio"
                name="simulation-speed"
                value={option.value}
                checked={settingsDraft.speed === option.value}
                onChange={() => setSettingsDraft((prev) => ({ ...prev, speed: option.value }))}
              />
              <span>
                <strong>{option.label}</strong>
                <small>{option.detail}</small>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="settings-card">
        <h3>Pause-Prediction cadence</h3>
        <p>How many algorithm steps pass before a quiz prompt appears.</p>
        <div className="settings-slider-row">
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={settingsDraft.quizPromptInterval}
            onChange={(event) =>
              setSettingsDraft((prev) => ({
                ...prev,
                quizPromptInterval: Number(event.target.value),
              }))
            }
          />
          <div className="settings-slider-value">
            <strong>{settingsDraft.quizPromptInterval}</strong>
            <span>steps</span>
          </div>
        </div>
      </section>

      <section className="settings-card">
        <h3>Equation overlay</h3>
        <p>Show the on-grid f(n) equation tether and g/h ladder labels.</p>
        <label className="settings-toggle-row">
          <input
            type="checkbox"
            checked={settingsDraft.showEquationOverlay}
            onChange={(event) =>
              setSettingsDraft((prev) => ({
                ...prev,
                showEquationOverlay: event.target.checked,
              }))
            }
          />
          <span>Enable equation overlay</span>
        </label>
      </section>

      <section className="settings-card">
        <h3>Grid size</h3>
        <p>Adjust the size of the maze. Changing this will rebuild the board.</p>
        <div className="settings-grid-size">
          <label>
            Preset
            <select
              value={(() => {
                const match = GRID_PRESETS.find(
                  (preset) =>
                    preset.rows === settingsDraft.gridRows &&
                    preset.cols === settingsDraft.gridCols
                );
                return match?.id || 'custom';
              })()}
              onChange={(event) => {
                const preset = GRID_PRESETS.find((item) => item.id === event.target.value);
                if (!preset) return;
                if (preset.id === 'custom') return;
                setSettingsDraft((prev) => ({
                  ...prev,
                  gridRows: preset.rows,
                  gridCols: preset.cols,
                }));
              }}
            >
              {GRID_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Rows
            <input
              type="number"
              min="8"
              max="60"
              value={settingsDraft.gridRows}
              onChange={(event) =>
                setSettingsDraft((prev) => ({
                  ...prev,
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
              value={settingsDraft.gridCols}
              onChange={(event) =>
                setSettingsDraft((prev) => ({
                  ...prev,
                  gridCols: Number(event.target.value),
                }))
              }
            />
          </label>
        </div>
      </section>

      <section className="settings-card settings-card-muted">
        <h3>Quick actions</h3>
        <p>Use the defaults if you want the original pacing back.</p>
        <button type="button" className="settings-secondary-btn" onClick={resetSettingsToDefaults}>
          Restore defaults
        </button>
      </section>
    </ModalShell>
  );
}

export default SettingsModal;
