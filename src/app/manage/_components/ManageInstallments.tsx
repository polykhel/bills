"use client";

import { Plus, Trash2, Pencil } from 'lucide-react';
import { List as ListIcon } from 'lucide-react';
import { cn, formatCurrency, getInstallmentStatus } from '../../../lib/utils';
import React from 'react';
import { DataTable } from '../../_components/ui/table/DataTable';
import { useReactTable, getCoreRowModel, ColumnDef } from '@tanstack/react-table';
import { Installment } from '../../../lib/types';

interface CardInfo {
  id: string;
  bankName: string;
  cardName: string;
}

interface ManageInstallmentsProps {
  installments: Installment[];
  cards: CardInfo[];
  viewDate: Date;
  currentSort: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
  onAddInstallment: () => void;
  onEditInstallment: (installment: Installment) => void;
  onDeleteInstallment: (installmentId: string) => void;
}

export function ManageInstallments({
  installments,
  cards,
  viewDate,
  currentSort,
  onSort,
  onAddInstallment,
  onEditInstallment,
  onDeleteInstallment,
}: ManageInstallmentsProps) {
  const columns = React.useMemo<ColumnDef<Installment>[]>(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: () => (
        <button className="text-xs sm:text-sm font-bold text-slate-700 uppercase hover:text-slate-900" onClick={() => onSort('name')}>Item</button>
      ),
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.name}</span>,
      size: 200,
    },
    {
      id: 'card',
      accessorFn: (row) => row.cardId,
      header: () => (
        <button className="text-xs sm:text-sm font-bold text-slate-700 uppercase hover:text-slate-900" onClick={() => onSort('card')}>Card</button>
      ),
      cell: ({ row }) => {
        const inst = row.original;
        const card = cards.find((c) => c.id === inst.cardId);
        return <span className="text-slate-600">{card ? `${card.bankName} - ${card.cardName}` : 'Unknown'}</span>;
      },
      size: 240,
    },
    {
      id: 'startDate',
      accessorKey: 'startDate',
      header: () => (
        <button className="text-xs sm:text-sm font-bold text-slate-700 uppercase hover:text-slate-900" onClick={() => onSort('startDate')}>Start Date</button>
      ),
      cell: ({ row }) => <span className="text-slate-600">{new Date(row.original.startDate).toLocaleDateString()}</span>,
      size: 140,
    },
    {
      id: 'progress',
      accessorFn: (row) => getInstallmentStatus(row as Installment, viewDate).currentTerm,
      header: () => (
        <button className="text-xs sm:text-sm font-bold text-slate-700 uppercase hover:text-slate-900" onClick={() => onSort('progress')}>Progress</button>
      ),
      cell: ({ row }) => {
        const inst = row.original;
        const status = getInstallmentStatus(inst, viewDate);
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono w-12 text-right">
              {status.currentTerm > inst.terms ? 'Done' : status.currentTerm < 1 ? 'Pending' : `${status.currentTerm}/${inst.terms}`}
            </span>
            {status.isActive && (
              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(status.currentTerm / inst.terms) * 100}%` }} />
              </div>
            )}
          </div>
        );
      },
      size: 180,
    },
    {
      id: 'monthly',
      accessorKey: 'monthlyAmortization',
      header: () => <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase">Monthly</span>,
      cell: ({ row }) => <span className="text-slate-800 font-semibold">₱{formatCurrency(row.original.monthlyAmortization)}</span>,
      size: 140,
    },
    {
      id: 'action',
      header: () => <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase block text-right">Action</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => onEditInstallment(row.original)} className="text-slate-400 hover:text-blue-500">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDeleteInstallment(row.original.id)} className="text-slate-400 hover:text-rose-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      meta: { cellClassName: 'text-right' },
      size: 140,
    },
  ], [cards, onDeleteInstallment, onEditInstallment, onSort, viewDate]);

  const table = useReactTable({
    data: installments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ListIcon className="w-5 h-5" /> All Installments
        </h2>
        <button
          onClick={onAddInstallment}
          className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
        >
          <Plus className="w-4 h-4" /> Add Installment
        </button>
      </div>
      <DataTable table={table} className="pb-2" />
      {installments.length === 0 && (
        <div className="p-4 text-center text-slate-400">No installments found.</div>
      )}
    </div>
  );
}
