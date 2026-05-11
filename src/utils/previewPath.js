import { clearPath, cloneGrid, getNodesInShortestPathOrder } from './gridHelpers';
import { bfs } from '../algorithms/bfs';
import { astar } from '../algorithms/astar';

export function buildPreviewPath(grid, start, end, algorithm) {
  if (!grid?.length || !start || !end) return [];

  const previewGrid = clearPath(cloneGrid(grid));
  const startNode = previewGrid[start.row]?.[start.col];
  const endNode = previewGrid[end.row]?.[end.col];

  if (!startNode || !endNode) return [];

  if (algorithm === 'astar') {
    astar(previewGrid, startNode, endNode);
  } else {
    bfs(previewGrid, startNode, endNode);
  }

  return endNode.isVisited ? getNodesInShortestPathOrder(endNode) : [];
}
