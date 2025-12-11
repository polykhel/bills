"use client";

export interface BankBalanceToggleProps {
  bankBalanceTrackingEnabled: boolean;
  setBankBalanceTrackingEnabled: (enabled: boolean) => void;
}

export function BankBalanceToggle({
  bankBalanceTrackingEnabled,
  setBankBalanceTrackingEnabled,
}: BankBalanceToggleProps) {
  if (bankBalanceTrackingEnabled) {
    return null;
  }

  return (
    <button
      onClick={() => setBankBalanceTrackingEnabled(true)}
      className="w-full bg-blue-50 border-2 border-dashed border-blue-200 hover:border-blue-300 hover:bg-blue-100 text-blue-600 px-4 py-3 rounded-xl transition-all text-sm font-medium"
    >
      + Enable Bank Balance Tracking
    </button>
  );
}
