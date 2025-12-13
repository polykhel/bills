"use client";

import { FileSpreadsheet, CheckCircle2, Copy } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';

interface BillsTableHeaderProps {
  viewDate: Date;
  bulkSelectMode: boolean;
  setBulkSelectMode: (mode: boolean) => void;
  selectedCardsCount: number;
  batchCopied: boolean;
  onCopySelected: () => void;
  onExportCSV: () => void;
}

export function BillsTableHeader({
  viewDate,
  bulkSelectMode,
  setBulkSelectMode,
  selectedCardsCount,
  batchCopied,
  onCopySelected,
  onExportCSV,
}: BillsTableHeaderProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50">
      <h3 className="font-bold text-slate-700 text-sm sm:text-base">Bills for {format(viewDate, 'MMMM yyyy')}</h3>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {bulkSelectMode && selectedCardsCount > 0 && (
          <button
            onClick={onCopySelected}
            className={cn(
              "flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition",
              batchCopied
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
            )}
          >
            {batchCopied ? (
              <><CheckCircle2 className="w-4 h-4" /> Copied {selectedCardsCount}!</>
            ) : (
              <><Copy className="w-4 h-4" /> Copy {selectedCardsCount} Selected</>
            )}
          </button>
        )}
        {bulkSelectMode && (
          <button
            onClick={() => {
              setBulkSelectMode(false);
            }}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition"
          >
            Cancel Select
          </button>
        )}
        {!bulkSelectMode && (
          <button
            onClick={() => setBulkSelectMode(true)}
            className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition"
          >
            <Copy className="w-4 h-4" /> Bulk Copy
          </button>
        )}
        <button
          onClick={onExportCSV}
          className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition"
        >
          <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export CSV
        </button>
      </div>
    </div>
  );
}
