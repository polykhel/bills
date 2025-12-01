"use client";

import { format, setDate, parseISO, isValid } from 'date-fns';
import { FileSpreadsheet, CheckCircle2, Circle } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import SortableHeader from '../_components/ui/SortableHeader';
import { useApp } from "../providers";

export default function DashboardPage() {
  const {
    viewDate,
    totals,
    dashboardSort,
    setDashboardSort,
    visibleCards,
    profiles,
    multiProfileMode,
    activeInstallments,
    monthlyStatements,
    getCardInstallmentTotal,
    handleUpdateStatement,
    handleTogglePaid,
    handleExportMonthCSV,
    bankBalanceTrackingEnabled,
    setBankBalanceTrackingEnabled,
    currentBankBalance,
    updateBankBalance,
    balanceStatus,
    isLoaded,
  } = useApp();

  if (!isLoaded) {
    return null;
  }

  const sortedDashboardData = visibleCards.map(card => {
    const stmt = monthlyStatements.find(s => s.cardId === card.id);
    const defaultDate = setDate(viewDate, card.dueDay);
    const displayDate = stmt?.customDueDate ? parseISO(stmt.customDueDate) : defaultDate;
    const cardInstTotal = getCardInstallmentTotal(card.id);
    const displayAmount = stmt ? stmt.amount : cardInstTotal;
    const isPaid = stmt?.isPaid || false;
    const profile = profiles.find(p => p.id === card.profileId);
    return { card, stmt, displayDate, displayAmount, isPaid, cardInstTotal, profile };
  }).sort((a, b) => {
    const dir = dashboardSort.direction === 'asc' ? 1 : -1;
    switch (dashboardSort.key) {
      case 'bankName': return a.card.bankName.localeCompare(b.card.bankName) * dir;
      case 'dueDate': return (a.displayDate.getTime() - b.displayDate.getTime()) * dir;
      case 'amount': return (a.displayAmount - b.displayAmount) * dir;
      case 'status': return (Number(a.isPaid) - Number(b.isPaid)) * dir;
      default: return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className={cn("grid gap-4", bankBalanceTrackingEnabled ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3")}>
        {bankBalanceTrackingEnabled && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 text-sm font-medium">Bank Balance</p>
              <button
                onClick={() => setBankBalanceTrackingEnabled(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
                title="Disable bank balance tracking"
              >
                ✕
              </button>
            </div>
            <div className="relative max-w-[200px]">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-800 text-2xl font-bold">₱</span>
              <input 
                type="number" 
                step="0.01"
                className="w-full pl-5 pr-2 py-0 bg-transparent border-none focus:bg-slate-50 focus:ring-2 focus:ring-blue-200 rounded-lg text-3xl font-bold text-slate-800 transition-all"
                placeholder="0.00"
                value={currentBankBalance || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  updateBankBalance(isNaN(value) ? 0 : value);
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    updateBankBalance(parseFloat(value.toFixed(2)));
                  }
                }}
              />
            </div>
            <div className={cn(
              "text-xs mt-2 font-medium flex items-center gap-1",
              balanceStatus.isEnough ? "text-green-600" : "text-rose-600"
            )}>
              {balanceStatus.isEnough ? (
                <>
                  <span>✓</span>
                  <span>₱{formatCurrency(balanceStatus.difference)} remaining</span>
                </>
              ) : (
                <>
                  <span>⚠</span>
                  <span>₱{formatCurrency(Math.abs(balanceStatus.difference))} short</span>
                </>
              )}
            </div>
          </div>
        )}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Total Statement Balance</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">₱{formatCurrency(totals.billTotal)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Unpaid Balance</p>
          <p className="text-3xl font-bold text-rose-600 mt-2">₱{formatCurrency(totals.unpaidTotal)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Monthly Installments</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">₱{formatCurrency(totals.installmentTotal)}</p>
          <p className="text-xs text-slate-400 mt-1">Included in statements if billed</p>
        </div>
      </div>
      
      {!bankBalanceTrackingEnabled && (
        <button
          onClick={() => setBankBalanceTrackingEnabled(true)}
          className="w-full bg-blue-50 border-2 border-dashed border-blue-200 hover:border-blue-300 hover:bg-blue-100 text-blue-600 px-4 py-3 rounded-xl transition-all text-sm font-medium"
        >
          + Enable Bank Balance Tracking
        </button>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-700">Bills for {format(viewDate, 'MMMM yyyy')}</h3>
          <button 
            onClick={handleExportMonthCSV}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <SortableHeader label="Card" sortKey="bankName" currentSort={dashboardSort} onSort={(k) => setDashboardSort({ key: k, direction: dashboardSort.key === k && dashboardSort.direction === 'asc' ? 'desc' : 'asc' })} />
                <SortableHeader label="Due Date" sortKey="dueDate" currentSort={dashboardSort} onSort={(k) => setDashboardSort({ key: k, direction: dashboardSort.key === k && dashboardSort.direction === 'asc' ? 'desc' : 'asc' })} />
                <SortableHeader label="Statement Balance" sortKey="amount" currentSort={dashboardSort} onSort={(k) => setDashboardSort({ key: k, direction: dashboardSort.key === k && dashboardSort.direction === 'asc' ? 'desc' : 'asc' })} />
                <th className="p-4">Amount Due</th>
                <th className="p-4 w-1/4">Active Installments</th>
                <SortableHeader label="Status" sortKey="status" currentSort={dashboardSort} onSort={(k) => setDashboardSort({ key: k, direction: dashboardSort.key === k && dashboardSort.direction === 'asc' ? 'desc' : 'asc' })} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedDashboardData.map(({ card, stmt, displayDate, displayAmount, cardInstTotal, profile }) => {
                const cardInsts = activeInstallments.filter((i: any) => i.cardId === card.id);
                return (
                  <tr key={card.id} className="hover:bg-slate-50 transition-colors group">
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
                        <input 
                          type="date"
                          className="bg-transparent border-none p-0 text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer w-32"
                          value={isValid(displayDate) ? format(displayDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => handleUpdateStatement(card.id, { customDueDate: e.target.value })}
                        />
                        <span className="text-[10px] text-slate-400">Cut-off: {card.cutoffDay}th</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="relative max-w-[140px]">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₱</span>
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-full pl-6 pr-2 py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm transition-all font-medium text-slate-800"
                            placeholder="0.00"
                            value={stmt ? (parseFloat(displayAmount.toFixed(2) || '')) : parseFloat(displayAmount.toFixed(2))}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              handleUpdateStatement(card.id, { amount: isNaN(value) ? 0 : value });
                            }}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value)) {
                                handleUpdateStatement(card.id, { amount: parseFloat(value.toFixed(2)) });
                              }
                            }}
                          />
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {!stmt && cardInstTotal > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full border border-amber-200">
                              Est.
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleUpdateStatement(card.id, { isUnbilled: stmt?.isUnbilled === false ? true : false, amount: stmt?.amount ?? cardInstTotal })}
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
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-full pl-6 pr-2 py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg text-sm transition-all font-medium text-slate-800"
                            placeholder={displayAmount.toFixed(2)}
                            value={stmt?.adjustedAmount !== undefined ? stmt.adjustedAmount : ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              handleUpdateStatement(card.id, { adjustedAmount: value === undefined ? undefined : (isNaN(value) ? 0 : value) });
                            }}
                            onBlur={(e) => {
                              const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              if (value !== undefined && !isNaN(value)) {
                                handleUpdateStatement(card.id, { adjustedAmount: parseFloat(value.toFixed(2)) });
                              }
                            }}
                          />
                        </div>
                        {stmt?.adjustedAmount !== undefined && stmt.adjustedAmount !== displayAmount && (
                          <div className="text-[10px] text-slate-500">
                            {stmt.adjustedAmount < displayAmount ? (
                              <span className="text-green-600">-₱{formatCurrency(displayAmount - stmt.adjustedAmount)} saved</span>
                            ) : (
                              <span className="text-amber-600">+₱{formatCurrency(stmt.adjustedAmount - displayAmount)} extra</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {cardInsts.map((inst: any) => (
                          <div key={inst.id} className="flex items-center justify-between text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                            <span className="truncate max-w-[100px] font-medium">{inst.name}</span>
                            <span className="opacity-75 font-mono">{inst.status.currentTerm}/{inst.terms}</span>
                          </div>
                        ))}
                        {cardInsts.length === 0 && <span className="text-slate-300 text-xs italic">None</span>}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleTogglePaid(card.id)}
                        title="Toggle Paid Status"
                        className={cn(
                          'p-2 rounded-full transition-all duration-200',
                          stmt?.isPaid 
                            ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                            : 'text-slate-300 bg-slate-100 hover:bg-slate-200 hover:text-slate-500'
                        )}
                      >
                        {stmt?.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {visibleCards.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {multiProfileMode ? 'No cards found. Select profiles to view.' : 'No cards found for this profile.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
