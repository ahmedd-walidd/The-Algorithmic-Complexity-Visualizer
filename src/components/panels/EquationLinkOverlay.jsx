import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import TraceEquation from './TraceEquation';

const VIEWPORT_PADDING = 16;
const EDGE_OFFSET = 18;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatScore(value) {
  return Number.isFinite(value) ? value : 'N/A';
}

function EquationLinkOverlay({
  anchor,
  scores,
  algorithm,
  start,
  end,
  prefix = '',
  label = 'trace',
  animationKey,
}) {
  const [position, setPosition] = useState(null);

  const updatePosition = useCallback(() => {
    if (!anchor) {
      setPosition(null);
      return;
    }

    const anchorEl = document.getElementById(`${prefix}node-${anchor.row}-${anchor.col}`);
    if (!anchorEl) {
      setPosition(null);
      return;
    }

    const rect = anchorEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const preferBottom = rect.top < 140;
    const top = preferBottom ? rect.bottom + EDGE_OFFSET : rect.top - EDGE_OFFSET;
    const left = clamp(centerX, VIEWPORT_PADDING, window.innerWidth - VIEWPORT_PADDING);

    setPosition({
      left: `${left}px`,
      top: `${top}px`,
      placement: preferBottom ? 'bottom' : 'top',
    });
  }, [anchor, prefix]);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(frame);
  }, [updatePosition, animationKey]);

  useEffect(() => {
    if (!anchor) return undefined;

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchor, updatePosition]);

  useEffect(() => {
    if (!anchor) return undefined;

    const anchorEl = document.getElementById(`${prefix}node-${anchor.row}-${anchor.col}`);
    const startEl = start
      ? document.getElementById(`${prefix}node-${start.row}-${start.col}`)
      : null;
    const goalEl = end
      ? document.getElementById(`${prefix}node-${end.row}-${end.col}`)
      : null;

    anchorEl?.classList.add('node-equation-anchor');
    startEl?.classList.add('node-equation-source');
    if (algorithm === 'astar') goalEl?.classList.add('node-equation-goal');

    return () => {
      anchorEl?.classList.remove('node-equation-anchor');
      startEl?.classList.remove('node-equation-source');
      goalEl?.classList.remove('node-equation-goal');
    };
  }, [anchor, algorithm, start, end, prefix, animationKey]);

  if (!anchor || !scores || !position) return null;

  const gValue = formatScore(scores.g);
  const hValue = formatScore(scores.h);
  const headerLabel = label === 'hover' ? 'Hovered node equation' : 'Active expansion equation';
  const hLabel =
    algorithm === 'astar'
      ? `h(n) = ${hValue} exact graph distance to goal`
      : 'h(n) = 0 in BFS';

  return (
    <div
      className={`equation-link equation-link-${label} equation-link-${position.placement}`}
      style={{ left: position.left, top: position.top }}
      aria-live="polite"
    >
      <div className="equation-link-header">
        <span className="equation-link-title">{headerLabel}</span>
        <span className="equation-link-node">({anchor.row}, {anchor.col})</span>
      </div>

      <TraceEquation key={animationKey} scores={scores} animate />

      <div className="equation-link-metrics">
        <div className="equation-link-metric equation-link-metric-g">
          <span className="equation-chip equation-chip-start">S</span>
          <span>
            g(n) = {gValue} step{gValue === 1 ? '' : 's'} from start
          </span>
        </div>
        <div
          className={`equation-link-metric equation-link-metric-h${
            algorithm === 'astar' ? '' : ' equation-link-metric-muted'
          }`}
        >
          <span className="equation-chip equation-chip-goal">G</span>
          <span>{hLabel}</span>
        </div>
      </div>
      <p className="equation-link-legend">S = Start, G = Goal</p>
    </div>
  );
}

export default EquationLinkOverlay;
