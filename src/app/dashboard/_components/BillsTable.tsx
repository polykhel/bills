"use client";

import { format, isValid, parseISO, setDate } from 'date-fns';
import { CheckCircle2, Circle, Copy } from 'lucide-react';
import { cn, formatCurrency } from '../../../lib/utils';
import SortableHeader from '../../_components/ui/SortableHeader';
import { EditableField } from '../../_components/ui/EditableField';

interface DashboardData {
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
}

interface BillsTableProps {
  sortedData: DashboardData[];
  bulkSelectMode: boolean;
  selectedCards: Set<string>;
  columnWidths: Record<string, number>;
  onStartResize: (column: string, e: React.MouseEvent) => void;
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
  isResizing: boolean;
}

export function BillsTable({
  sortedData,
  bulkSelectMode,
  selectedCards,
  columnWidths,
  onStartResize,
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
  isResizing,
}: BillsTableProps) {
  const tableRef = React.useRef<HTMLTableElement>(null);

  return (
    <div className="overflow-x-auto">
      <table
        ref={tableRef}
        className={cn("w-full text-left border-collapse", isResizing && "select-none")}
        style={{ tableLayout: 'fixed' }}
      >
        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
          <tr>
            {bulkSelectMode && (
              <th className="p-4 relative" style={{ width: `${columnWidths.checkbox}px` }}>
                <input
                  type="checkbox"
                  checked={selectedCards.size === sortedData.length && sortedData.length > 0}
                  onChange={onToggleAllCards}
                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <div
                  className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400 group"
                  onMouseDown={(e) => onStartResize('checkbox', e)}
                >
                  <div className="absolute inset-y-0 -left-1 -right-1" />
                </div>
              </th>
            )}
            <SortableHeader
              label="Card"
              sortKey="bankName"
              currentSort={dashboardSort}
              onSort={(k) => onSort(k)}
              className="relative"
              style={{ width: `${columnWidths.card}px` }}
            >
              <div
                className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400 group"
                onMouseDown={(e) => onStartResize('card', e)}
              >
                <div className="absolute inset-y-0 -left-1 -right-1" />
              </div>
            </SortableHeader>
            <SortableHeader
              label="Due Date"
              sortKey="dueDate"
              currentSort={dashboardSort}
              onSort={(k) => onSort(k)}
              className="relative"
              style={{ width: `${columnWidths.dueDate}px` }}
            >
              <div
                className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400 group"
                onMouseDown={(e) => onStartResize('dueDate', e)}
              >
                <div className="absolute inset-y-0 -left-1 -right-1" />
              </div>
            </SortableHeader>
            <SortableHeader
              label="Statement Balance"
              sortKey="amount"
              currentSort={dashboardSort}
              onSort={(k) => onSort(k)}
              className="relative"
              style={{ width: `${columnWidths.statementBalance}px` }}
            >
              <div
                className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400 group"
                onMouseDown={(e) => onStartResize('statementBalance', e)}
              >
                <div className="absolute inset-y-0 -left-1 -right-1" />
              </div>
            </SortableHeader>
            <th className="p-4 relative" style={{ width: `${columnWidths.amountDue}px` }}>
              Amount Due
              <div
                className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400 group"
                onMouseDown={(e) => onStartResize('amountDue', e)}
              >
                <div className="absolute inset-y-0 -left-1 -right-1" />
              </div>
            </th>
            <th className="p-4 relative" style={{ width: `${columnWidths.installments}px` }}>
              Active Installments
              <div
                className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400 group"
                onMouseDown={(e) => onStartResize('installments', e)}
              >
                <div className="absolute inset-y-0 -left-1 -right-1" />
              </div>
            </th>
            <SortableHeader
              label="Status"
              sortKey="status"
              currentSort={dashboardSort}
              onSort={(k) => onSort(k)}
              className="relative"
              style={{ width: `${columnWidths.status}px` }}
            >
              <div
                className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400 group"
                onMouseDown={(e) => onStartResize('status', e)}
              >
                <div className="absolute inset-y-0 -left-1 -right-1" />
              </div>
            </SortableHeader>
            <th className="p-4 relative" style={{ width: `${columnWidths.copy}px` }}>
              Copy
              <div
                className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400 group"
                onMouseDown={(e) => onStartResize('copy', e)}
              >
                <div className="absolute inset-y-0 -left-1 -right-1" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedData.map((data) => {
            const { card, displayDate, displayAmount, profile } = data;
            const rowKey = data.type === 'card' ? card.id : data.type === 'cashInstallment' ? `cash-${data.cashInstallment.id}` : `bill-${data.oneTimeBill.id}`;

            // Render cash installment row
            if (data.type === 'cashInstallment') {
              const { cashInstallment } = data;
              return (
                <tr
                  key={rowKey}
                  className={cn(
                    "hover:bg-slate-50 transition-colors group",
                    bulkSelectMode && selectedCards.has(card.id) && "bg-blue-50/50"
                  )}
                >
                  {bulkSelectMode && (
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedCards.has(card.id)}
                        onChange={() => onToggleCardSelection(card.id)}
                        className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-7 rounded-md shadow-sm flex items-center justify-center text-[10px] text-white font-bold tracking-wider"
                        style={{ backgroundColor: card.color || '#334155' }}
                      >
                        {card.bankName.substring(0, 3)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {cashInstallment.name}
                          <span className="ml-2 text-xs text-slate-500 font-normal">
                            ({cashInstallment.term})
                          </span>
                        </p>
                        <div className="flex items-center gap-2">
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
                  </td>
                  <td className="p-4">
                    <EditableField
                      type="date"
                      value={isValid(displayDate) ? format(displayDate, 'yyyy-MM-dd') : ''}
                      onUpdate={(value) =>
                        onUpdateCashInstallment(cashInstallment.id, { dueDate: value as string })
                      }
                      className="bg-transparent border-none p-0 text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer w-32"
                    />
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-slate-800">₱{formatCurrency(displayAmount)}</div>
                  </td>
                  <td className="p-4">
                    <div className="relative max-w-[140px]">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₱</span>
                      <EditableField
                        type="number"
                        step="0.01"
                        value={parseFloat(displayAmount.toFixed(2))}
                        onUpdate={(value) => {
                          const numValue = parseFloat(value as string);
                          onUpdateCashInstallment(cashInstallment.id, {
                            amount: isNaN(numValue) ? 0 : parseFloat(numValue.toFixed(2)),
                          });
                        }}
                        className="w-full pl-6 pr-2 py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg text-sm transition-all font-medium text-slate-800"
                        placeholder="0.00"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-slate-400 text-xs italic">Cash Installment</span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => onToggleCashInstallmentPaid(cashInstallment.id)}
                      title="Toggle Paid Status"
                      className={cn(
                        'p-2 rounded-full transition-all duration-200',
                        cashInstallment.isPaid
                          ? 'text-green-600 bg-green-100 hover:bg-green-200'
                          : 'text-slate-300 bg-slate-100 hover:bg-slate-200 hover:text-slate-500'
                      )}
                    >
                      {cashInstallment.isPaid ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={async () => {
                        await onCopyCardInfo(
                          cashInstallment.name,
                          `${card.bankName} ${card.cardName}`,
                          displayAmount
                        );
                        setCopiedId(rowKey);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      title="Copy installment info"
                      className={cn(
                        'p-2 rounded-full transition-all duration-200',
                        copiedId === rowKey
                          ? 'text-green-600 bg-green-100'
                          : 'text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-600'
                      )}
                    >
                      {copiedId === rowKey ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            }

            // Render one-time bill row
            if (data.type === 'oneTimeBill') {
              const { oneTimeBill } = data;
              return (
                <tr
                  key={rowKey}
                  className={cn(
                    "hover:bg-slate-50 transition-colors group",
                    bulkSelectMode && selectedCards.has(card.id) && "bg-blue-50/50"
                  )}
                >
                  {bulkSelectMode && (
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedCards.has(card.id)}
                        onChange={() => onToggleCardSelection(card.id)}
                        className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-7 rounded-md shadow-sm flex items-center justify-center text-[10px] text-white font-bold tracking-wider"
                        style={{ backgroundColor: card.color || '#334155' }}
                      >
                        {card.bankName.substring(0, 3)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {oneTimeBill.name}
                        </p>
                        <div className="flex items-center gap-2">
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
                  </td>
                  <td className="p-4">
                    <EditableField
                      type="date"
                      value={isValid(displayDate) ? format(displayDate, 'yyyy-MM-dd') : ''}
                      onUpdate={(value) =>
                        onUpdateOneTimeBill(oneTimeBill.id, { dueDate: value as string })
                      }
                      className="bg-transparent border-none p-0 text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer w-32"
                    />
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-slate-800">₱{formatCurrency(displayAmount)}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-slate-800">₱{formatCurrency(displayAmount)}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-xs text-slate-500">-</span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        oneTimeBill.isPaid
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {oneTimeBill.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => onToggleOneTimeBillPaid(oneTimeBill.id)}
                      title={oneTimeBill.isPaid ? 'Mark as unpaid' : 'Mark as paid'}
                      className={cn(
                        'p-2 rounded-full transition-all duration-200',
                        oneTimeBill.isPaid
                          ? 'text-green-600 bg-green-100 hover:bg-green-200'
                          : 'text-slate-300 bg-slate-100 hover:bg-slate-200 hover:text-slate-500'
                      )}
                    >
                      {oneTimeBill.isPaid ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={async () => {
                        await onCopyCardInfo(
                          oneTimeBill.name,
                          `${card.bankName} ${card.cardName}`,
                          displayAmount
                        );
                        setCopiedId(rowKey);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      title="Copy bill info"
                      className={cn(
                        'p-2 rounded-full transition-all duration-200',
                        copiedId === rowKey
                          ? 'text-green-600 bg-green-100'
                          : 'text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-600'
                      )}
                    >
                      {copiedId === rowKey ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            }

            // Render regular card row
            const { stmt, cardInstTotal } = data;
            const cardInsts = activeInstallments.filter((i: any) => i.cardId === card.id);
            const amountDue = stmt?.adjustedAmount ?? displayAmount;

            return (
              <tr
                key={rowKey}
                className={cn(
                  "hover:bg-slate-50 transition-colors group",
                  bulkSelectMode && selectedCards.has(card.id) && "bg-blue-50/50"
                )}
              >
                {bulkSelectMode && (
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedCards.has(card.id)}
                      onChange={() => onToggleCardSelection(card.id)}
                      className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                )}
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-7 rounded-md shadow-sm flex items-center justify-center text-[10px] text-white font-bold tracking-wider"
                      style={{ backgroundColor: card.color || '#334155' }}
                    >
                      {card.bankName.substring(0, 3)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{card.cardName}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500">{card.bankName}</p>
                        {multiProfileMode && profile && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                            {profile.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <EditableField
                      type="date"
                      value={isValid(displayDate) ? format(displayDate, 'yyyy-MM-dd') : ''}
                      onUpdate={(value) =>
                        onUpdateStatement(card.id, { customDueDate: value as string })
                      }
                      className="bg-transparent border-none p-0 text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer w-32"
                    />
                    <span className="text-[10px] text-slate-400">Cut-off: {card.cutoffDay}th</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-2">
                    <div className="relative max-w-[140px]">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₱</span>
                      <EditableField
                        type="number"
                        step="0.01"
                        value={parseFloat(displayAmount.toFixed(2))}
                        onUpdate={(value) => {
                          const numValue = parseFloat(value as string);
                          onUpdateStatement(card.id, {
                            amount: isNaN(numValue) ? 0 : parseFloat(numValue.toFixed(2)),
                          });
                        }}
                        className="w-full pl-6 pr-2 py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm transition-all font-medium text-slate-800"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {!stmt && (cardInstTotal ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full border border-amber-200">
                          Est.
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateStatement(card.id, {
                            isUnbilled: stmt?.isUnbilled === false ? true : false,
                            amount: stmt?.amount ?? cardInstTotal,
                          })
                        }
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-all',
                          stmt?.isUnbilled === false
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                            : 'bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200'
                        )}
                      >
                        {stmt?.isUnbilled === false ? 'Billed' : 'Unbilled'}
                      </button>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-2">
                    <div className="relative max-w-[140px]">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₱</span>
                      <EditableField
                        type="number"
                        step="0.01"
                        value={stmt?.adjustedAmount !== undefined ? stmt.adjustedAmount : ''}
                        onUpdate={(value) => {
                          const strValue = value === '' ? undefined : (value as string);
                          const numValue = strValue === undefined ? undefined : parseFloat(strValue);
                          onUpdateStatement(card.id, {
                            adjustedAmount:
                              numValue === undefined
                                ? undefined
                                : isNaN(numValue)
                                  ? 0
                                  : parseFloat(numValue.toFixed(2)),
                          });
                        }}
                        className="w-full pl-6 pr-2 py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg text-sm transition-all font-medium text-slate-800"
                        placeholder={displayAmount.toFixed(2)}
                      />
                    </div>
                    {stmt?.adjustedAmount !== undefined && stmt.adjustedAmount !== displayAmount && (
                      <div className="text-[10px] text-slate-500">
                        {stmt.adjustedAmount < displayAmount ? (
                          <span className="text-green-600">
                            -₱{formatCurrency(displayAmount - stmt.adjustedAmount)} saved
                          </span>
                        ) : (
                          <span className="text-amber-600">
                            +₱{formatCurrency(stmt.adjustedAmount - displayAmount)} extra
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    {cardInsts.map((inst: any) => (
                      <div
                        key={inst.id}
                        className="flex items-center justify-between text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100"
                      >
                        <span className="truncate max-w-[100px] font-medium">{inst.name}</span>
                        <span className="opacity-75 font-mono">
                          {inst.status.currentTerm}/{inst.terms}
                        </span>
                      </div>
                    ))}
                    {cardInsts.length === 0 && (
                      <span className="text-slate-300 text-xs italic">None</span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => onTogglePaid(card.id)}
                    title="Toggle Paid Status"
                    className={cn(
                      'p-2 rounded-full transition-all duration-200',
                      stmt?.isPaid
                        ? 'text-green-600 bg-green-100 hover:bg-green-200'
                        : 'text-slate-300 bg-slate-100 hover:bg-slate-200 hover:text-slate-500'
                    )}
                  >
                    {stmt?.isPaid ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={async () => {
                      await onCopyCardInfo(card.cardName, card.bankName, amountDue);
                      setCopiedId(card.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    title="Copy card info"
                    className={cn(
                      'p-2 rounded-full transition-all duration-200',
                      copiedId === card.id
                        ? 'text-green-600 bg-green-100'
                        : 'text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-600'
                    )}
                  >
                    {copiedId === card.id ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
          {sortedData.length === 0 && (
            <tr>
              <td colSpan={bulkSelectMode ? 8 : 7} className="p-8 text-center text-slate-500">
                {multiProfileMode
                  ? 'No cards or installments found. Select profiles to view.'
                  : 'No cards or installments found for this profile.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

import * as React from 'react';
