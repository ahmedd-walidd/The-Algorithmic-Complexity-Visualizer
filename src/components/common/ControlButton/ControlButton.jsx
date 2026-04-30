import './ControlButton.css';

function ControlButton({ className = '', variant = 'default', active = false, children, ...buttonProps }) {
  return (
    <button
      className={`control-button control-button--${variant} ${active ? 'is-active' : ''} ${className}`.trim()}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

export default ControlButton;