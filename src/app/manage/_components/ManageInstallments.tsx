"use client";

import { Plus, Trash2, Pencil } from 'lucide-react';
import { List as ListIcon } from 'lucide-react';
import { cn, formatCurrency, getInstallmentStatus } from '../../../lib/utils';
import SortableHeader from '../../_components/ui/SortableHeader';
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
                label="Start Date"
                sortKey="startDate"
                currentSort={currentSort}
                onSort={(k) => onSort(k)}
              />
              <SortableHeader
                label="Progress"
                sortKey="progress"
                currentSort={currentSort}
                onSort={(k) => onSort(k)}
              />
              <SortableHeader
                label="Monthly"
                sortKey="monthly"
                currentSort={currentSort}
                onSort={(k) => onSort(k)}
              />
              <th className="p-3 text-right rounded-r-lg">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {installments.map((inst) => {
              const card = cards.find((c) => c.id === inst.cardId);
              const status = getInstallmentStatus(inst, viewDate);
              return (
                <tr key={inst.id} className="hover:bg-slate-50 group">
                  <td className="p-3 font-medium text-slate-800">{inst.name}</td>
                  <td className="p-3 text-slate-600">
                    {card ? `${card.bankName} - ${card.cardName}` : 'Unknown'}
                  </td>
                  <td className="p-3 text-slate-600">
                    {new Date(inst.startDate).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono w-12 text-right">
                        {status.currentTerm > inst.terms
                          ? 'Done'
                          : status.currentTerm < 1
                            ? 'Pending'
                            : `${status.currentTerm}/${inst.terms}`}
                      </span>
                      {status.isActive && (
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(status.currentTerm / inst.terms) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">₱{formatCurrency(inst.monthlyAmortization)}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => onEditInstallment(inst)}
                        className="text-slate-400 hover:text-blue-500"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteInstallment(inst.id)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {installments.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-400">
                  No installments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
