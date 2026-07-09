import { ReactNode } from 'react';

export interface DataTableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, rows, rowKey, emptyMessage = 'No records found.' }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-ink/50">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-ink/5 text-xs uppercase tracking-wide text-ink/50">
          <tr>
            {columns.map((column) => (
              <th key={column.header} className="px-4 py-3 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border last:border-b-0 hover:bg-ink/5">
              {columns.map((column) => (
                <td key={column.header} className={column.className ?? 'px-4 py-3'}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
