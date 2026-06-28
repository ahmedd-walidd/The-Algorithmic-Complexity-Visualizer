import ModalShell from '../common/ModalShell/ModalShell';

const LEGEND_ITEMS = [
  {
    tone: 'start',
    title: 'Start',
    description: 'Where the search begins.',
  },
  {
    tone: 'end',
    title: 'Goal',
    description: 'The target cell the algorithm is trying to reach.',
  },
  {
    tone: 'wall',
    title: 'Wall',
    description: 'Blocked cell. Search cannot move through it.',
  },
  {
    tone: 'unvisited',
    title: 'Unvisited',
    description: 'Open cell the algorithm has not checked yet.',
  },
  {
    tone: 'visited',
    title: 'Checked / expanded',
    description: 'Blue cells have already been examined by the algorithm.',
  },
  {
    tone: 'path',
    title: 'Final path',
    description: 'Yellow cells show the route returned after the search finishes.',
  },
  {
    tone: 'candidate',
    title: 'Prediction candidate',
    description: 'Cyan glow marks clickable frontier choices during Pause-Prediction.',
  },
  {
    tone: 'next',
    title: 'Paused next expansion',
    description: 'Gold outline marks node(s) that would be expanded next during a normal pause.',
  },
];

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
        {LEGEND_ITEMS.map((item) => (
          <div className="legend-item" key={item.tone}>
            <span className={`legend-swatch swatch-${item.tone}`} />
            <span className="legend-item-copy">
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </span>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

export default LegendModal;
