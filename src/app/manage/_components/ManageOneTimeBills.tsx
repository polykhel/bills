"use client";

import { Plus, Trash2, Pencil } from 'lucide-react';
import { DollarSign as MoneyIcon } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import SortableHeader from '../../_components/ui/SortableHeader';
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
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50">
            <tr>
              <SortableHeader
                label="Item"
                sortKey="name"
                currentSort={currentSort}
                onSort={(k) => onSort(k)}
              />
              <SortableHeader
                label="Card"
                sortKey="card"
                currentSort={currentSort}
                onSort={(k) => onSort(k)}
              />
              <SortableHeader
                label="Due Date"
                sortKey="dueDate"
                currentSort={currentSort}
                onSort={(k) => onSort(k)}
              />
              <SortableHeader
                label="Amount"
                sortKey="amount"
                currentSort={currentSort}
                onSort={(k) => onSort(k)}
              />
              <SortableHeader
                label="Status"
                sortKey="isPaid"
                currentSort={currentSort}
                onSort={(k) => onSort(k)}
              />
              <th className="p-3 text-right rounded-r-lg">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bills.map((bill) => {
              const card = cards.find((c) => c.id === bill.cardId);
              return (
                <tr key={bill.id} className="hover:bg-slate-50 group">
                  <td className="p-3 font-medium text-slate-800">{bill.name}</td>
                  <td className="p-3 text-slate-600">
                    {card ? `${card.bankName} - ${card.cardName}` : 'Unknown'}
                  </td>
                  <td className="p-3 text-slate-600">
                    {new Date(bill.dueDate).toLocaleDateString()}
                  </td>
                  <td className="p-3 font-semibold text-slate-800">
                    {formatCurrency(bill.amount)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        bill.isPaid
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {bill.isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => onEditBill(bill)}
                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteBill(bill.id)}
                        className="p-1.5 hover:bg-red-100 rounded text-red-600 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {bills.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-400">
                  No one-time bills found. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
