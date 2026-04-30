import './ControlToggle.css';

function ControlToggle({ className = '', children, ...inputProps }) {
  return (
    <label className={`control-toggle ${className}`.trim()}>
      <input type="checkbox" {...inputProps} />
      <span>{children}</span>
    </label>
  );
}

export default ControlToggle;