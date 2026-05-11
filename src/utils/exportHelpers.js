export const EXPORT_COLUMNS = [
  'Turn',
  'Timestamp',
  'Mode',
  'Algorithm',
  'Nodes Visited',
  'Path Length',
];

export function escapeCsvValue(value) {
  const normalized = value ?? '';
  const stringValue = String(normalized);
  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

export function buildExportRows({ turn, mode, runResults, createdAt = new Date().toISOString() }) {
  return Object.entries(runResults).map(([algorithm, result]) => ({
    Turn: turn,
    Timestamp: createdAt,
    Mode: mode,
    Algorithm: algorithm === 'astar' ? 'A*' : 'BFS',
    'Nodes Visited': result.visited,
    'Path Length': result.pathNodes?.length || 0,
  }));
}

export function buildCsv(rows) {
  const header = EXPORT_COLUMNS.join(',');
  const body = rows.map((row) =>
    EXPORT_COLUMNS.map((column) => escapeCsvValue(row[column])).join(',')
  );
  return [header, ...body].join('\n');
}
