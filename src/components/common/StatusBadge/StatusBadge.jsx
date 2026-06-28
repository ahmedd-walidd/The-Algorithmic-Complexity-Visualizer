import './StatusBadge.css';

function StatusBadge({ label, value, description, keyItems = [], className = '' }) {
  return (
    <div className={`status-badge ${className}`.trim()} role="status" aria-live="polite">
      <div className="status-badge-main">
        <span className="status-badge-label">{label}</span>
        <span className="status-badge-value">{value}</span>
        {description && <span className="status-badge-description">{description}</span>}
      </div>

      {keyItems.length > 0 && (
        <div className="status-badge-key" aria-label="Node color key">
          {keyItems.map((item) => (
            <span className="status-badge-key-item" key={item.tone}>
              <span className={`status-badge-swatch status-badge-swatch-${item.tone}`} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default StatusBadge;
