export function buildExportRows({ turn, mode, runResults, createdAt = new Date().toISOString() }) {
  return Object.entries(runResults).map(([algorithm, result]) => ({
    Turn: turn,
    Timestamp: createdAt,
    Mode: mode,
    Algorithm: algorithm === 'astar' ? 'A*' : 'BFS',
    heuristicType: algorithm === 'astar' ? 'manhattan' : 'none',
    'Nodes Visited': result.visited,
    'Path Length': result.pathNodes?.length || 0,
  }));
}
