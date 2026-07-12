/** Escapes a single CSV field: wraps in quotes if it contains a comma, quote, or newline. */
function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of flat objects into a CSV string using the given column
 * definitions (header label + accessor function per column).
 */
export function toCsv<T>(rows: T[], columns: { header: string; accessor: (row: T) => unknown }[]): string {
  const headerLine = columns.map((c) => escapeCsvField(c.header)).join(',');
  const dataLines = rows.map((row) => columns.map((c) => escapeCsvField(c.accessor(row))).join(','));
  return [headerLine, ...dataLines].join('\n');
}