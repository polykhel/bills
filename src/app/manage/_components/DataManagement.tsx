"use client";

import { Users, Upload, Download } from 'lucide-react';

interface DataManagementProps {
  onImportClick: () => void;
  onExportClick: () => void;
}

export function DataManagement({ onImportClick, onExportClick }: DataManagementProps) {
  return (
    <div className="bg-slate-900 text-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" /> Data Management
        </h2>
        <p className="text-slate-400 text-sm mt-1">Backup, restore, or move your profile data.</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onImportClick}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Upload className="w-4 h-4" /> Import Profile (JSON)
        </button>
        <button
          onClick={onExportClick}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-900/50"
        >
          <Download className="w-4 h-4" /> Export Profile (JSON)
        </button>
      </div>
    </div>
  );
}
