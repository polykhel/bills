"use client";

import React, { useState } from 'react';
import type { Table } from '@tanstack/react-table';
import { cn } from '../../../lib/utils';

interface ColumnVisibilityMenuProps<TData> {
	table: Table<TData>;
	onReset?: () => void;
	className?: string;
}

export function ColumnVisibilityMenu<TData>({ table, onReset, className }: ColumnVisibilityMenuProps<TData>) {
	const [open, setOpen] = useState(false);
	const columns = table.getAllLeafColumns().filter((col) => col.getCanHide());

	if (columns.length === 0) return null;

	return (
		<div className={cn('relative inline-block text-left', className)}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 transition"
			>
				Columns
			</button>

			{open && (
				<div className="absolute right-0 mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-20">
					<div className="max-h-64 overflow-auto p-2 space-y-1 text-sm">
						{columns.map((column) => {
							const header = column.columnDef.header;
							const label = column.columnDef.meta?.headerLabel ?? (typeof header === 'string' ? header : column.id);
							return (
								<label key={column.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer">
									<input
										type="checkbox"
										checked={column.getIsVisible()}
										onChange={(e) => column.toggleVisibility(e.target.checked)}
										className="accent-blue-600"
									/>
									<span className="text-slate-700 text-xs truncate">{label}</span>
								</label>
							);
						})}
					</div>
					<div className="flex items-center justify-between px-2 py-2 border-t border-slate-100">
						<button
							type="button"
							onClick={() => {
								columns.forEach((col) => col.toggleVisibility(true));
								onReset?.();
							}}
							className="text-xs text-blue-600 hover:text-blue-800 font-medium"
						>
							Reset
						</button>
						<button
							type="button"
							onClick={() => setOpen(false)}
							className="text-xs text-slate-500 hover:text-slate-700"
						>
							Close
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default ColumnVisibilityMenu;
