"use client";

import React, { useEffect, useMemo } from 'react';
import { format, isValid } from 'date-fns';
import { CheckCircle2, Circle, Copy, ArrowUpDown } from 'lucide-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnSizingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { cn, formatCurrency } from '../../../lib/utils';
import { EditableField } from '../../_components/ui/EditableField';
import { DataTable } from '../../_components/ui/table/DataTable';
import { useColumnLayout } from '../../_components/ui/table/useColumnLayout';
import ColumnVisibilityMenu from '../../_components/ui/ColumnVisibilityMenu';

type DashboardData = {
  type: 'card' | 'cashInstallment' | 'oneTimeBill';
  card: any;
  stmt?: any;
  cashInstallment?: any;
  oneTimeBill?: any;
  displayDate: Date;
  displayAmount: number;
  isPaid: boolean;
  cardInstTotal?: number;
  profile?: any;
};

interface BillsTableProps {
  sortedData: DashboardData[];
  bulkSelectMode: boolean;
  selectedCards: Set<string>;
  dashboardSort: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
  onToggleCardSelection: (cardId: string) => void;
  onToggleAllCards: () => void;
  onCopyCardInfo: (cardName: string, bankName: string, amount: number) => Promise<string>;
  onTogglePaid: (cardId: string) => void;
  onToggleCashInstallmentPaid: (installmentId: string) => void;
  onToggleOneTimeBillPaid: (billId: string) => void;
  onUpdateStatement: (cardId: string, updates: any) => void;
  onUpdateCashInstallment: (installmentId: string, updates: any) => void;
  onUpdateOneTimeBill: (billId: string, updates: any) => void;
  copiedId: string | null;
  setCopiedId: (id: string | null) => void;
  activeInstallments: any[];
  multiProfileMode: boolean;
  activeProfileId: string;
  tableId?: string;
}

const DEFAULT_SIZING: ColumnSizingState = {
  select: 48,
  card: 180,
  dueDate: 120,
  statementBalance: 160,
  amountDue: 140,
  installments: 160,
  status: 80,
  copy: 60,
};

const DEFAULT_VISIBILITY: VisibilityState = {
  select: false,
  copy: true,
};

function SortLabel({
  label,
  sortKey,
  currentSort,
  onSort,
}: {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: 'asc' | 'desc' };
  onSort: (k: string) => void;
}) {
  const isActive = currentSort.key === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-[11px] sm:text-xs uppercase"
    >
      {label}
      <ArrowUpDown
        className={cn(
          'w-3 h-3 transition-opacity',
          isActive ? 'opacity-100 text-blue-600' : 'opacity-40'
        )}
      />
    </button>
  );
}

export function BillsTable({
  sortedData,
  bulkSelectMode,
  selectedCards,
  dashboardSort,
  onSort,
  onToggleCardSelection,
  onToggleAllCards,
  onCopyCardInfo,
  onTogglePaid,
  onToggleCashInstallmentPaid,
  onToggleOneTimeBillPaid,
  onUpdateStatement,
  onUpdateCashInstallment,
  onUpdateOneTimeBill,
  copiedId,
  setCopiedId,
  activeInstallments,
  multiProfileMode,
  activeProfileId,
  tableId = 'dashboard-bills',
}: BillsTableProps) {
  const profileKey = multiProfileMode ? 'multi' : activeProfileId;

  const { layout, setVisibility, setSizing, resetLayout } = useColumnLayout({
    tableId,
    profileId: profileKey,
    initialVisibility: DEFAULT_VISIBILITY,
    initialSizing: DEFAULT_SIZING,
  });

  // Sync visibility with toggles
  useEffect(() => {
    setVisibility((prev) => ({ ...prev, select: bulkSelectMode }));
  }, [bulkSelectMode, setVisibility]);

  const columns = useMemo<ColumnDef<DashboardData>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={selectedCards.size === sortedData.length && sortedData.length > 0}
            onChange={onToggleAllCards}
            className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
          />
        ),
        cell: ({ row }) => {
          const original = row.original;
          const cardId =
            original.type === 'card'
              ? original.card.id
              : original.type === 'cashInstallment'
                ? original.card.id
                : original.card.id;
          return (
            <input
              type="checkbox"
              checked={selectedCards.has(cardId)}
              onChange={() => onToggleCardSelection(cardId)}
              className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
            />
          );
        },
        enableHiding: false,
        enableResizing: false,
        meta: {
          disableDrag: true,
          headerClassName: 'w-12 text-center',
          cellClassName: 'w-12 text-center',
          headerLabel: 'Select',
        },
      },
      {
        id: 'card',
        header: () => <SortLabel label="Card" sortKey="bankName" currentSort={dashboardSort} onSort={onSort} />,
        cell: ({ row }) => {
          const original = row.original;
          const { card, profile } = original;

          if (original.type === 'cashInstallment') {
            const ci = original.cashInstallment!;
            return (
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className="w-8 h-6 sm:w-10 sm:h-7 rounded-md shadow-sm flex items-center justify-center text-[8px] sm:text-[10px] text-white font-bold tracking-wider"
                  style={{ backgroundColor: card.color || '#334155' }}
                >
                  {card.bankName.substring(0, 3)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-xs sm:text-sm flex items-center gap-1">
                    {ci.name}
                    <span className="ml-1 text-[10px] text-slate-500 font-normal">({ci.term})</span>
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-slate-500">
                      {card.bankName} {card.cardName}
                    </p>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 border border-green-200">
                      Cash
                    </span>
                    {multiProfileMode && profile && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                        {profile.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          if (original.type === 'oneTimeBill') {
            const bill = original.oneTimeBill!;
            return (
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className="w-8 h-6 sm:w-10 sm:h-7 rounded-md shadow-sm flex items-center justify-center text-[8px] sm:text-[10px] text-white font-bold tracking-wider"
                  style={{ backgroundColor: card.color || '#334155' }}
                >
                  {card.bankName.substring(0, 3)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-xs sm:text-sm">{bill.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-slate-500">
                      {card.bankName} {card.cardName}
                    </p>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200">
                      One-Time
                    </span>
                    {multiProfileMode && profile && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                        {profile.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          const stmt = original.stmt;
          return (
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="w-8 h-6 sm:w-10 sm:h-7 rounded-md shadow-sm flex items-center justify-center text-[8px] sm:text-[10px] text-white font-bold tracking-wider"
                style={{ backgroundColor: card.color || '#334155' }}
              >
                {card.bankName.substring(0, 3)}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-xs sm:text-sm">{card.cardName}</p>
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  <p className="text-[10px] sm:text-xs text-slate-500">{card.bankName}</p>
                  {multiProfileMode && profile && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                      {profile.name}
                    </span>
                  )}
                  {stmt?.isUnbilled === false && (
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium bg-green-100 text-green-700 border border-green-200">
                      Billed
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        },
        size: DEFAULT_SIZING.card,
        meta: { headerClassName: 'min-w-[160px]', headerLabel: 'Card' },
      },
      {
        id: 'dueDate',
        header: () => <SortLabel label="Due Date" sortKey="dueDate" currentSort={dashboardSort} onSort={onSort} />,
        cell: ({ row }) => {
          const original = row.original;
          const dateVal = isValid(original.displayDate) ? format(original.displayDate, 'yyyy-MM-dd') : '';

          if (original.type === 'cashInstallment') {
            const ci = original.cashInstallment!;
            return (
              <EditableField
                type="date"
                value={dateVal}
                onUpdate={(value) => onUpdateCashInstallment(ci.id, { dueDate: value as string })}
                className="bg-transparent border-none p-0 text-xs sm:text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer w-28 sm:w-32"
              />
            );
          }

          if (original.type === 'oneTimeBill') {
            const bill = original.oneTimeBill!;
            return (
              <EditableField
                type="date"
                value={dateVal}
                onUpdate={(value) => onUpdateOneTimeBill(bill.id, { dueDate: value as string })}
                className="bg-transparent border-none p-0 text-xs sm:text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer w-28 sm:w-32"
              />
            );
          }

          return (
            <div className="flex flex-col">
              <EditableField
                type="date"
                value={dateVal}
                onUpdate={(value) => onUpdateStatement(original.card.id, { customDueDate: value as string })}
                className="bg-transparent border-none p-0 text-xs sm:text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer w-28 sm:w-32"
              />
              <span className="text-[10px] text-slate-400">Cut-off: {original.card.cutoffDay}th</span>
            </div>
          );
        },
        size: DEFAULT_SIZING.dueDate,
        meta: { headerLabel: 'Due Date' },
      },
      {
        id: 'statementBalance',
        header: () => <SortLabel label="Statement Balance" sortKey="amount" currentSort={dashboardSort} onSort={onSort} />,
        cell: ({ row }) => {
          const original = row.original;
          if (original.type === 'cashInstallment' || original.type === 'oneTimeBill') {
            return <div className="text-xs sm:text-sm font-medium text-slate-800">₱{formatCurrency(original.displayAmount)}</div>;
          }

          const stmt = original.stmt;
          const displayAmount = original.displayAmount;
          return (
            <div className="space-y-1.5 sm:space-y-2">
              <div className="relative max-w-[140px]">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm">₱</span>
                <EditableField
                  type="number"
                  step="0.01"
                  value={parseFloat(displayAmount.toFixed(2))}
                  onUpdate={(value) => {
                    const numValue = parseFloat(value as string);
                    onUpdateStatement(original.card.id, {
                      amount: isNaN(numValue) ? 0 : parseFloat(numValue.toFixed(2)),
                    });
                  }}
                  className="w-full pl-6 pr-2 py-1 sm:py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-xs sm:text-sm transition-all font-medium text-slate-800"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                {!stmt && (original.cardInstTotal ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full border border-amber-200">
                    Est.
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStatement(original.card.id, {
                      isUnbilled: stmt?.isUnbilled === false ? true : false,
                      amount: stmt?.amount ?? original.cardInstTotal,
                    })
                  }
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full border transition-all',
                    stmt?.isUnbilled === false
                      ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                      : 'bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200'
                  )}
                >
                  {stmt?.isUnbilled === false ? 'Billed' : 'Unbilled'}
                </button>
              </div>
            </div>
          );
        },
        size: DEFAULT_SIZING.statementBalance,
        meta: { headerLabel: 'Statement Balance' },
      },
      {
        id: 'amountDue',
        header: () => <span className="uppercase">Amount Due</span>,
        cell: ({ row }) => {
          const original = row.original;
          if (original.type === 'cashInstallment') {
            const ci = original.cashInstallment!;
            return (
              <div className="relative max-w-[140px]">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm">₱</span>
                <EditableField
                  type="number"
                  step="0.01"
                  value={parseFloat(original.displayAmount.toFixed(2))}
                  onUpdate={(value) => {
                    const numValue = parseFloat(value as string);
                    onUpdateCashInstallment(ci.id, {
                      amount: isNaN(numValue) ? 0 : parseFloat(numValue.toFixed(2)),
                    });
                  }}
                  className="w-full pl-6 pr-2 py-1 sm:py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg text-xs sm:text-sm transition-all font-medium text-slate-800"
                  placeholder="0.00"
                />
              </div>
            );
          }

          if (original.type === 'oneTimeBill') {
            return <div className="text-sm font-medium text-slate-800">₱{formatCurrency(original.displayAmount)}</div>;
          }

          const stmt = original.stmt;
          return (
            <div className="space-y-1.5 sm:space-y-2">
              <div className="relative max-w-[140px]">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm">₱</span>
                <EditableField
                  type="number"
                  step="0.01"
                  value={stmt?.adjustedAmount !== undefined ? stmt.adjustedAmount : ''}
                  onUpdate={(value) => {
                    const strValue = value === '' ? undefined : (value as string);
                    const numValue = strValue === undefined ? undefined : parseFloat(strValue);
                    onUpdateStatement(original.card.id, {
                      adjustedAmount:
                        numValue === undefined
                          ? undefined
                          : isNaN(numValue)
                            ? 0
                            : parseFloat(numValue.toFixed(2)),
                    });
                  }}
                  className="w-full pl-6 pr-2 py-1 sm:py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg text-xs sm:text-sm transition-all font-medium text-slate-800"
                  placeholder={original.displayAmount.toFixed(2)}
                />
              </div>
              {stmt?.adjustedAmount !== undefined && stmt.adjustedAmount !== original.displayAmount && (
                <div className="text-[10px] text-slate-500">
                  {stmt.adjustedAmount < original.displayAmount ? (
                    <span className="text-green-600">
                      -₱{formatCurrency(original.displayAmount - stmt.adjustedAmount)} saved
                    </span>
                  ) : (
                    <span className="text-amber-600">
                      +₱{formatCurrency(stmt.adjustedAmount - original.displayAmount)} extra
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        },
        size: DEFAULT_SIZING.amountDue,
        meta: { headerLabel: 'Amount Due' },
      },
      {
        id: 'installments',
        header: () => <span className="uppercase">Active Installments</span>,
        cell: ({ row }) => {
          const original = row.original;
          if (original.type !== 'card') {
            return <span className="text-slate-400 text-xs italic">{original.type === 'cashInstallment' ? 'Cash Installment' : '-'}</span>;
          }

          const cardInsts = activeInstallments.filter((i: any) => i.cardId === original.card.id);
          return (
            <div className="space-y-1">
              {cardInsts.map((inst: any) => (
                <div
                  key={inst.id}
                  className="flex items-center justify-between text-[10px] sm:text-xs bg-blue-50 text-blue-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-blue-100"
                >
                  <span className="truncate max-w-[120px] font-medium">{inst.name}</span>
                  <span className="opacity-75 font-mono text-[10px] sm:text-xs">
                    {inst.status.currentTerm}/{inst.terms}
                  </span>
                </div>
              ))}
              {cardInsts.length === 0 && (
                <span className="text-slate-300 text-[10px] sm:text-xs italic">None</span>
              )}
            </div>
          );
        },
        size: DEFAULT_SIZING.installments,
        meta: { headerLabel: 'Active Installments' },
      },
      {
        id: 'status',
        header: () => <SortLabel label="Status" sortKey="status" currentSort={dashboardSort} onSort={onSort} />,
        cell: ({ row }) => {
          const original = row.original;

          if (original.type === 'cashInstallment') {
            const ci = original.cashInstallment!;
            return (
              <button
                onClick={() => onToggleCashInstallmentPaid(ci.id)}
                title="Toggle Paid"
                className={cn(
                  'p-1.5 sm:p-2 rounded-full transition-all duration-200 inline-flex items-center justify-center',
                  ci.isPaid ? 'text-green-600 bg-green-100 hover:bg-green-200' : 'text-slate-300 bg-slate-100 hover:bg-slate-200 hover:text-slate-500'
                )}
              >
                {ci.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </button>
            );
          }

          if (original.type === 'oneTimeBill') {
            const bill = original.oneTimeBill!;
            return (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-block px-2 py-1 rounded-full text-xs font-semibold',
                    bill.isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  )}
                >
                  {bill.isPaid ? 'Paid' : 'Unpaid'}
                </span>
                <button
                  onClick={() => onToggleOneTimeBillPaid(bill.id)}
                  title="Toggle Paid"
                  className={cn(
                    'p-1.5 sm:p-2 rounded-full transition-all duration-200 inline-flex items-center justify-center',
                    bill.isPaid ? 'text-green-600 bg-green-100 hover:bg-green-200' : 'text-slate-300 bg-slate-100 hover:bg-slate-200 hover:text-slate-500'
                  )}
                >
                  {bill.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
              </div>
            );
          }

          const stmt = original.stmt;
          return (
            <button
              onClick={() => onTogglePaid(original.card.id)}
              title="Toggle Paid"
              className={cn(
                'p-1.5 sm:p-2 rounded-full transition-all duration-200 inline-flex items-center justify-center',
                stmt?.isPaid
                  ? 'text-green-600 bg-green-100 hover:bg-green-200'
                  : 'text-slate-300 bg-slate-100 hover:bg-slate-200 hover:text-slate-500'
              )}
            >
              {stmt?.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </button>
          );
        },
        size: DEFAULT_SIZING.status,
        meta: { cellClassName: 'text-center', headerLabel: 'Status' },
      },
      {
        id: 'copy',
        header: () => <span className="uppercase">Actions</span>,
        cell: ({ row }) => {
          const original = row.original;
          const rowKey =
            original.type === 'card'
              ? original.card.id
              : original.type === 'cashInstallment'
                ? `cash-${original.cashInstallment!.id}`
                : `bill-${original.oneTimeBill!.id}`;

          const label =
            original.type === 'card'
              ? original.card.cardName
              : original.type === 'cashInstallment'
                ? original.cashInstallment!.name
                : original.oneTimeBill!.name;

          const bankLabel = `${original.card.bankName} ${original.card.cardName}`;
          const amount = original.displayAmount;

          return (
            <button
              onClick={async () => {
                await onCopyCardInfo(label, bankLabel, amount);
                setCopiedId(rowKey);
                setTimeout(() => setCopiedId(null), 2000);
              }}
              title="Copy info"
              className={cn(
                'p-1.5 sm:p-2 rounded-full transition-all duration-200 inline-flex items-center justify-center',
                copiedId === rowKey ? 'text-green-600 bg-green-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-600'
              )}
            >
              {copiedId === rowKey ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          );
        },
        enableHiding: true,
        enableResizing: true,
        size: DEFAULT_SIZING.copy,
        meta: { cellClassName: 'text-center', headerLabel: 'Actions' },
      },
    ],
    [activeInstallments, copiedId, dashboardSort, multiProfileMode, onCopyCardInfo, onSort, onToggleAllCards, onToggleCardSelection, onToggleCashInstallmentPaid, onToggleOneTimeBillPaid, onTogglePaid, onUpdateCashInstallment, onUpdateOneTimeBill, onUpdateStatement, selectedCards, setCopiedId, sortedData]
  );

  const table = useReactTable({
    data: sortedData,
    columns,
    state: {
      columnVisibility: layout.visibility,
      columnSizing: layout.sizing,
    },
    onColumnVisibilityChange: setVisibility,
    onColumnSizingChange: setSizing,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="hidden sm:block">
        <div className="flex justify-end px-4 py-2">
          <ColumnVisibilityMenu
            table={table}
            onReset={() =>
              resetLayout({
                visibility: { ...DEFAULT_VISIBILITY, select: bulkSelectMode },
                sizing: DEFAULT_SIZING,
              })
            }
          />
        </div>
        <DataTable
          table={table}
          stickyHeader
          className="pb-4"
          renderHeader={(header) => flexRender(header.column.columnDef.header, header.getContext())}
        />
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3 p-4">
        {sortedData.map((data) => {
          const { card, displayDate, displayAmount, profile } = data;
          const rowKey = data.type === 'card' ? card.id : data.type === 'cashInstallment' ? `cash-${data.cashInstallment!.id}` : `bill-${data.oneTimeBill!.id}`;

          if (data.type === 'cashInstallment') {
            const { cashInstallment } = data;
            return (
              <div key={rowKey} className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-6 rounded-md shadow-sm flex items-center justify-center text-[8px] text-white font-bold tracking-wider"
                      style={{ backgroundColor: card.color || '#334155' }}
                    >
                      {card.bankName.substring(0, 3)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">{cashInstallment.name}</p>
                      <p className="text-[10px] text-slate-500">{card.bankName} {card.cardName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleCashInstallmentPaid(cashInstallment.id)}
                    className={cn(
                      'p-1.5 rounded-full transition-all',
                      cashInstallment.isPaid
                        ? 'text-green-600 bg-green-100'
                        : 'text-slate-300 bg-slate-100'
                    )}
                  >
                    {cashInstallment.isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Due Date</span>
                    <p className="font-medium text-slate-700">{format(displayDate, 'MMM dd')}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Amount</span>
                    <p className="font-medium text-slate-700">₱{formatCurrency(displayAmount)}</p>
                  </div>
                </div>
              </div>
            );
          }

          if (data.type === 'oneTimeBill') {
            const { oneTimeBill } = data;
            return (
              <div key={rowKey} className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-6 rounded-md shadow-sm flex items-center justify-center text-[8px] text-white font-bold tracking-wider"
                      style={{ backgroundColor: card.color || '#334155' }}
                    >
                      {card.bankName.substring(0, 3)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">{oneTimeBill.name}</p>
                      <p className="text-[10px] text-slate-500">{card.bankName} {card.cardName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleOneTimeBillPaid(oneTimeBill.id)}
                    className={cn(
                      'p-1.5 rounded-full transition-all',
                      oneTimeBill.isPaid
                        ? 'text-green-600 bg-green-100'
                        : 'text-slate-300 bg-slate-100'
                    )}
                  >
                    {oneTimeBill.isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Due Date</span>
                    <p className="font-medium text-slate-700">{format(displayDate, 'MMM dd')}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Amount</span>
                    <p className="font-medium text-slate-700">₱{formatCurrency(displayAmount)}</p>
                  </div>
                </div>
              </div>
            );
          }

          const { stmt } = data;
          const cardInsts = activeInstallments.filter((i: any) => i.cardId === card.id);
          const amountDue = stmt?.adjustedAmount ?? displayAmount;

          return (
            <div key={rowKey} className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-6 rounded-md shadow-sm flex items-center justify-center text-[8px] text-white font-bold tracking-wider"
                    style={{ backgroundColor: card.color || '#334155' }}
                  >
                    {card.bankName.substring(0, 3)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-xs">{card.cardName}</p>
                    <p className="text-[10px] text-slate-500">{card.bankName}</p>
                  </div>
                </div>
                <button
                  onClick={() => onTogglePaid(card.id)}
                  className={cn(
                    'p-1.5 rounded-full transition-all',
                    stmt?.isPaid
                      ? 'text-green-600 bg-green-100'
                      : 'text-slate-300 bg-slate-100'
                  )}
                >
                  {stmt?.isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Due Date</span>
                  <p className="font-medium text-slate-700">{format(displayDate, 'MMM dd')}</p>
                </div>
                <div>
                  <span className="text-slate-500">Amount</span>
                  <p className="font-medium text-slate-700">₱{formatCurrency(amountDue)}</p>
                </div>
              </div>
              {cardInsts.length > 0 && (
                <div className="text-xs">
                  <span className="text-slate-500">Installments</span>
                  <div className="space-y-1 mt-1">
                    {cardInsts.map((inst: any) => (
                      <div key={inst.id} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                        {inst.name}: {inst.status.currentTerm}/{inst.terms}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {sortedData.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-4">
            {multiProfileMode
              ? 'No cards or installments found. Select profiles to view.'
              : 'No cards or installments found for this profile.'}
          </div>
        )}
      </div>
    </>
  );
}
