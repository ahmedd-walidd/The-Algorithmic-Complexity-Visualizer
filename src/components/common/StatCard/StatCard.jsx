function StatCard({ title, className = '', children }) {
  return (
    <div className={`stat-card ${className}`.trim()}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export default StatCard;