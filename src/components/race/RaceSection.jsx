import Grid from '../Grid/Grid';
import StatCard from '../common/StatCard/StatCard';

function RaceSection({
  grid,
  handleMouseDown,
  handleMouseEnter,
  handleMouseUp,
  responsiveCellSize,
  stats,
  raceResultComparison,
  isMazeGenerating,
}) {
  return (
    <>
      <div className="race-container">
        <Grid
          grid={grid}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onMouseUp={handleMouseUp}
          prefix="bfs-"
          label="BFS"
          cellSize={responsiveCellSize}
          isLoading={isMazeGenerating}
        />
        <Grid
          grid={grid}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onMouseUp={handleMouseUp}
          prefix="astar-"
          label="A*"
          cellSize={responsiveCellSize}
          isLoading={isMazeGenerating}
        />
      </div>
      {stats && (
        <div className="stats-container">
          {Object.entries(stats).map(([key, { visited, path }]) => (
            <StatCard
              key={key}
              title={key === 'bfs' ? 'BFS traversal profile' : 'A* traversal profile'}
              className="stat-card-comparison"
            >
              <div className="stat-metric-row">
                <span className="stat-metric-label">Node expansions</span>
                <span
                  className={`stat-metric-value stat-metric-value--${raceResultComparison?.[key]?.visited.tone ?? 'equal'}`}
                >
                  {visited}
                </span>
                <span className="stat-metric-note">
                  {raceResultComparison?.[key]?.visited.note}
                </span>
              </div>
              <div className="stat-metric-row">
                <span className="stat-metric-label">Shortest-path length</span>
                <span
                  className={`stat-metric-value stat-metric-value--${raceResultComparison?.[key]?.path.tone ?? 'equal'}`}
                >
                  {path > 0 ? path : '—'}
                </span>
                <span className="stat-metric-note">
                  {path > 0
                    ? raceResultComparison?.[key]?.path.note
                    : 'No valid path recorded'}
                </span>
              </div>
            </StatCard>
          ))}
        </div>
      )}
    </>
  );
}

export default RaceSection;
