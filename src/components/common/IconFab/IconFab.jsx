import './IconFab.css';

function IconFab({ className = '', children, ...buttonProps }) {
  return (
    <button
      type="button"
      className={`icon-fab ${className}`.trim()}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

export default IconFab;