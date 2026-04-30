import './StatusBadge.css';

function StatusBadge({ label, value, className = '' }) {
  return (
    <div className={`status-badge ${className}`.trim()} role="status" aria-live="polite">
      <span className="status-badge-label">{label}</span>
      <span className="status-badge-value">{value}</span>
    </div>
  );
}

export default StatusBadge;