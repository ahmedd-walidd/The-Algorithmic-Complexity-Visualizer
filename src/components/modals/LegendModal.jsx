import ModalShell from '../common/ModalShell/ModalShell';

function LegendModal({ isOpen, closeLegend }) {
  if (!isOpen) return null;

  return (
    <ModalShell
      className="modal-shell--legend"
      titleId="legend-title"
      kicker="Reference"
      title="Visualizer Legend"
      onClose={closeLegend}
    >
      <div className="legend-grid">
        <div className="legend-item">
          <span className="legend-swatch swatch-start" />
          <span>Start node</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-end" />
          <span>Goal node</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-wall" />
          <span>Obstacle / wall</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-unvisited" />
          <span>Unvisited node</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-visited" />
          <span>Visited during search</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-path" />
          <span>Shortest path</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-candidate" />
          <span>Quiz candidate node</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-next" />
          <span>Paused next valid choice</span>
        </div>
      </div>
    </ModalShell>
  );
}

export default LegendModal;
