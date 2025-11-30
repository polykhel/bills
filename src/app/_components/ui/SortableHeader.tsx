import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { SortConfig } from '../../../lib/types';
import { cn } from '../../../lib/utils';

interface Props {
  label: string;
  sortKey: string;
  currentSort: SortConfig;
  onSort: (key: string) => void;
}

const SortableHeader: React.FC<Props> = ({ label, sortKey, currentSort, onSort }) => {
  const isActive = currentSort.key === sortKey;
  return (
    <th 
      className="p-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className={cn("w-3 h-3 transition-opacity", isActive ? "opacity-100 text-blue-600" : "opacity-30 group-hover:opacity-60")} />
      </div>
    </th>
  );
};

export default SortableHeader;
