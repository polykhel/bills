"use client";

import { cn, formatCurrency } from '../../../lib/utils';

interface StatsCardsProps {
  bankBalanceTrackingEnabled: boolean;
  setBankBalanceTrackingEnabled: (enabled: boolean) => void;
  currentBankBalance: number;
  updateBankBalance: (balance: number) => void;
  balanceStatus: { isEnough: boolean; difference: number };
  billTotal: number;
  unpaidTotal: number;
  installmentTotal: number;
  multiProfileMode: boolean;
  profilesCount: number;
}

export function StatsCards({
  bankBalanceTrackingEnabled,
  setBankBalanceTrackingEnabled,
  currentBankBalance,
  updateBankBalance,
  balanceStatus,
  billTotal,
  unpaidTotal,
  installmentTotal,
  multiProfileMode,
  profilesCount,
}: StatsCardsProps) {
  return (
    <div className={cn("grid gap-4", bankBalanceTrackingEnabled ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3")}>
      {bankBalanceTrackingEnabled && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 text-sm font-medium">
              Bank Balance
              {multiProfileMode && profilesCount > 1 && (
                <span className="ml-2 text-[10px] text-amber-600 font-normal">(Sum of all profiles)</span>
              )}
            </p>
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
              disabled={multiProfileMode && profilesCount > 1}
              className={cn(
                "w-full pl-5 pr-2 py-0 bg-transparent border-none focus:bg-slate-50 focus:ring-2 focus:ring-blue-200 rounded-lg text-3xl font-bold text-slate-800 transition-all",
                multiProfileMode && profilesCount > 1 && "opacity-60 cursor-not-allowed"
              )}
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
              title={multiProfileMode && profilesCount > 1 ? "Switch to single profile mode to edit bank balance" : ""}
            />
          </div>
          <div
            className={cn(
              "text-xs mt-2 font-medium flex items-center gap-1",
              balanceStatus.isEnough ? "text-green-600" : "text-rose-600"
            )}
          >
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
        <p className="text-3xl font-bold text-slate-800 mt-2">₱{formatCurrency(billTotal)}</p>
      </div>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <p className="text-slate-500 text-sm font-medium">Unpaid Balance</p>
        <p className="text-3xl font-bold text-rose-600 mt-2">₱{formatCurrency(unpaidTotal)}</p>
      </div>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <p className="text-slate-500 text-sm font-medium">Monthly Installments</p>
        <p className="text-3xl font-bold text-blue-600 mt-2">₱{formatCurrency(installmentTotal)}</p>
        <p className="text-xs text-slate-400 mt-1">Included in statements if billed</p>
      </div>
    </div>
  );
}
