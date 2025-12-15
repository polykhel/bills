"use client";

import { Plus, Trash2, Pencil } from 'lucide-react';
import { DollarSign as MoneyIcon } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import React from 'react';
import { DataTable } from '../../_components/ui/table/DataTable';
import { useReactTable, getCoreRowModel, ColumnDef } from '@tanstack/react-table';
import { OneTimeBill } from '../../../lib/types';

interface CardInfo {
  id: string;
  bankName: string;
  cardName: string;
}

interface ManageOneTimeBillsProps {
  bills: OneTimeBill[];
  cards: CardInfo[];
  viewDate: Date;
  currentSort: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
  onAddBill: () => void;
  onEditBill: (bill: OneTimeBill) => void;
  onDeleteBill: (billId: string) => void;
}

export function ManageOneTimeBills({
  bills,
  cards,
  viewDate,
  currentSort,
  onSort,
  onAddBill,
  onEditBill,
  onDeleteBill,
}: ManageOneTimeBillsProps) {
  const columns = React.useMemo<ColumnDef<OneTimeBill>[]>(() => [
    {
      id: 'name',
      accessorKey: 'name',
      header: () => (
        <button className="text-xs uppercase text-slate-600" onClick={() => onSort('name')}>Item</button>
      ),
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.name}</span>,
      size: 200,
    },
    {
      id: 'card',
      accessorFn: (row) => row.cardId,
      header: () => (
        <button className="text-xs uppercase text-slate-600" onClick={() => onSort('card')}>Card</button>
      ),
      cell: ({ row }) => {
        const bill = row.original;
        const card = cards.find((c) => c.id === bill.cardId);
        return <span className="text-slate-600">{card ? `${card.bankName} - ${card.cardName}` : 'Unknown'}</span>;
      },
      size: 240,
    },
    {
      id: 'dueDate',
      accessorKey: 'dueDate',
      header: () => (
        <button className="text-xs uppercase text-slate-600" onClick={() => onSort('dueDate')}>Due Date</button>
      ),
      cell: ({ row }) => <span className="text-slate-600">{new Date(row.original.dueDate).toLocaleDateString()}</span>,
      size: 140,
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: () => (
        <button className="text-xs uppercase text-slate-600" onClick={() => onSort('amount')}>Amount</button>
      ),
      cell: ({ row }) => <span className="text-slate-800 font-semibold">₱{formatCurrency(row.original.amount)}</span>,
      size: 140,
    },
    {
      id: 'isPaid',
      accessorKey: 'isPaid',
      header: () => (
        <button className="text-xs uppercase text-slate-600" onClick={() => onSort('isPaid')}>Status</button>
      ),
      cell: ({ row }) => (
        <span className={row.original.isPaid ? 'inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700' : 'inline-block px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700'}>
          {row.original.isPaid ? 'Paid' : 'Pending'}
        </span>
      ),
      size: 140,
    },
    {
      id: 'action',
      header: () => <span className="text-xs uppercase text-right block text-slate-600">Action</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => onEditBill(row.original)} className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDeleteBill(row.original.id)} className="p-1.5 hover:bg-red-100 rounded text-red-600 transition" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      meta: { cellClassName: 'text-right' },
      size: 140,
    },
  ], [cards, onDeleteBill, onEditBill, onSort]);

  const table = useReactTable({
    data: bills,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <MoneyIcon className="w-5 h-5" /> One-Time Bills
        </h2>
        <button
          onClick={onAddBill}
          className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
        >
          <Plus className="w-4 h-4" /> Add One-Time Bill
        </button>
      </div>
      <DataTable table={table} className="pb-2" />
      {bills.length === 0 && (
        <div className="p-4 text-center text-slate-400">No one-time bills found. Add one to get started.</div>
      )}
    </div>
  );
}
