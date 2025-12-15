"use client";

import React from 'react';
import {
  flexRender,
  type Header,
  type Cell,
  type Table as TanTable,
  type ColumnMeta,
} from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends unknown, TValue> {
    headerClassName?: string;
    cellClassName?: string;
    disableDrag?: boolean;
    headerLabel?: string;
  }
}
import { cn } from '../../../../lib/utils';

interface DataTableProps<TData> {
  table: TanTable<TData>;
  stickyHeader?: boolean;
  renderCell?: (cell: Cell<TData, unknown>) => React.ReactNode;
  renderHeader?: (header: Header<TData, unknown>) => React.ReactNode;
  className?: string;
}

export function DataTable<TData>({
  table,
  stickyHeader = true,
  renderCell,
  renderHeader,
  className,
}: DataTableProps<TData>) {
  const totalSize = table.getTotalSize() || 1;

  return (
    <div className={cn('overflow-x-auto px-4 py-2', className)}>
      <table
        className="w-full text-left border-collapse"
        style={{ tableLayout: 'fixed', minWidth: '100%' }}
      >
        <thead className={cn(stickyHeader && 'sticky top-0 z-10 bg-white')}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const column = header.column;
                const headerClassName = column.columnDef.meta?.headerClassName as string | undefined;
                const widthPercent = (column.getSize() / totalSize) * 100;
                return (
                  <th
                    key={header.id}
                    className={cn(
                      'relative bg-slate-50 text-[11px] sm:text-xs text-slate-500 font-semibold border-b border-slate-200 select-none',
                      column.getIsResizing() ? 'bg-slate-100' : '',
                      headerClassName
                    )}
                    style={{ width: `${widthPercent}%` }}
                  >
                    <div className="flex items-center justify-between px-3 py-2 gap-2">
                      <div className="flex-1 min-w-0">
                        {header.isPlaceholder
                          ? null
                          : renderHeader
                            ? renderHeader(header)
                            : flexRender(column.columnDef.header, header.getContext())}
                      </div>
                      {column.getCanResize() && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            header.getResizeHandler()(e);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            header.getResizeHandler()(e);
                          }}
                          className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400/60 z-10"
                        >
                          <span className="absolute inset-y-0 -left-1 -right-1" />
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-100">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
              {row.getVisibleCells().map((cell) => {
                const column = cell.column;
                const widthPercent = (column.getSize() / totalSize) * 100;
                return (
                  <td
                    key={cell.id}
                    className={cn('align-top p-3', column.columnDef.meta?.cellClassName)}
                    style={{ width: `${widthPercent}%` }}
                  >
                    {renderCell ? renderCell(cell) : flexRender(column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={table.getVisibleFlatColumns().length} className="p-6 text-center text-slate-500 text-sm">
                No data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
