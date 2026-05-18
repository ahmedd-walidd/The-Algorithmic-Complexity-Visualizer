import { useEffect, useRef, useState } from 'react';
import Node from '../Node/Node';
import './Grid.css';

const FLOATING_VIEWPORT_PADDING = 12;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function Grid({
  grid,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  prefix = '',
  label = '',
  cellSize = 25,
  isLoading = false,
  enableFloating = false,
}) {
  const shellRef = useRef(null);
  const containerRef = useRef(null);
  const [isFloating, setIsFloating] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState({ left: 0, top: 0 });
  const [placeholderSize, setPlaceholderSize] = useState({ width: 0, height: 0 });
  const rowCount = grid.length;
  const colCount = grid[0]?.length || 0;
  const xTickStep = cellSize < 18 ? 5 : 1;
  const yTickStep = cellSize < 18 ? 2 : 1;

  const columns = Array.from({ length: colCount }, (_, col) => col);
  const rows = Array.from({ length: rowCount }, (_, row) => row);

  useEffect(() => {
    if (!enableFloating) return undefined;

    const shell = shellRef.current;
    if (!shell) return undefined;

    let frameId = 0;

    const syncFloatingState = () => {
      const rect = shell.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isFullyVisible =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= viewportHeight &&
        rect.right <= viewportWidth;

      setIsFloating(!isFullyVisible);

      if (!isFullyVisible) {
        const floatingWidth = placeholderSize.width || rect.width;
        const floatingHeight = placeholderSize.height || rect.height;
        const maxLeft = Math.max(
          FLOATING_VIEWPORT_PADDING,
          viewportWidth - floatingWidth - FLOATING_VIEWPORT_PADDING
        );
        const maxTop = Math.max(
          FLOATING_VIEWPORT_PADDING,
          viewportHeight - floatingHeight - FLOATING_VIEWPORT_PADDING
        );

        setFloatingPosition({
          left: Math.round(clamp(rect.left, FLOATING_VIEWPORT_PADDING, maxLeft)),
          top: Math.round(clamp(rect.top, FLOATING_VIEWPORT_PADDING, maxTop)),
        });
      }
    };

    const scheduleSync = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncFloatingState);
    };

    scheduleSync();
    window.addEventListener('scroll', scheduleSync, true);
    window.addEventListener('resize', scheduleSync);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', scheduleSync, true);
      window.removeEventListener('resize', scheduleSync);
    };
  }, [enableFloating, placeholderSize.height, placeholderSize.width]);

  useEffect(() => {
    if (!enableFloating) return undefined;

    const container = containerRef.current;
    if (!container) return undefined;

    const updatePlaceholderSize = () => {
      const rect = container.getBoundingClientRect();
      setPlaceholderSize({
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
      });
    };

    updatePlaceholderSize();

    if (!('ResizeObserver' in window)) {
      window.addEventListener('resize', updatePlaceholderSize);
      return () => window.removeEventListener('resize', updatePlaceholderSize);
    }

    const observer = new ResizeObserver(updatePlaceholderSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [cellSize, colCount, enableFloating, rowCount]);

  const shouldFloat = enableFloating && isFloating;
  const shellStyle =
    shouldFloat && placeholderSize.height > 0
      ? {
          width: `${placeholderSize.width}px`,
          height: `${placeholderSize.height}px`,
        }
      : undefined;
  const containerStyle = shouldFloat
    ? {
        left: `${floatingPosition.left}px`,
        top: `${floatingPosition.top}px`,
      }
    : undefined;

  return (
    <div
      ref={shellRef}
      className={`grid-float-shell${shouldFloat ? ' grid-float-shell-active' : ''}`}
      style={shellStyle}
    >
      <div
        ref={containerRef}
        className={`grid-container${shouldFloat ? ' grid-container-floating' : ''}`}
        style={containerStyle}
      >
        {label && <h2 className="grid-label">{label}</h2>}

        <div
          className={`grid-with-axes${cellSize < 16 ? ' grid-with-axes-compact-labels' : ''}`}
          style={{ '--cell-size': `${cellSize}px` }}
        >
          <div className="axis-corner" aria-hidden="true">
            y\x
          </div>

          <div
            className="x-axis-labels"
            style={{
              gridTemplateColumns: `repeat(${colCount}, ${cellSize}px)`,
            }}
            aria-hidden="true"
          >
            {columns.map((col) => (
              <span key={`x-${col}`} className="axis-label x-label">
                {col % xTickStep === 0 ? col : ''}
              </span>
            ))}
          </div>

          <div
            className="y-axis-labels"
            style={{
              gridTemplateRows: `repeat(${rowCount}, ${cellSize}px)`,
            }}
            aria-hidden="true"
          >
            {rows.map((row) => (
              <span key={`y-${row}`} className="axis-label y-label">
                {row % yTickStep === 0 ? row : ''}
              </span>
            ))}
          </div>

          <div
            className="grid"
            aria-busy={isLoading}
            style={{
              gridTemplateColumns: `repeat(${colCount}, ${cellSize}px)`,
            }}
          >
            {grid.map((row) =>
              row.map((node) => (
                <Node
                  key={`${node.row}-${node.col}`}
                  node={node}
                  onMouseDown={onMouseDown}
                  onMouseEnter={onMouseEnter}
                  onMouseUp={onMouseUp}
                  prefix={prefix}
                />
              ))
            )}

            {isLoading && (
              <div className="grid-loading-overlay" role="status" aria-live="polite">
                <span className="grid-loading-spinner" aria-hidden="true" />
                <span className="grid-loading-text">Generating maze</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Grid;
