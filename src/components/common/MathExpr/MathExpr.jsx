function MathExpr({ children, className = '' }) {
  const classes = className ? `math-expr ${className}` : 'math-expr';
  return <span className={classes}>{children}</span>;
}

function MathFraction({ numerator, denominator, className = '', label }) {
  const classes = className ? `math-frac ${className}` : 'math-frac';
  return (
    <span className={classes} aria-label={label}>
      <span className="math-frac-num">{numerator}</span>
      <span className="math-frac-bar" aria-hidden="true" />
      <span className="math-frac-den">{denominator}</span>
    </span>
  );
}

export { MathFraction };
export default MathExpr;
