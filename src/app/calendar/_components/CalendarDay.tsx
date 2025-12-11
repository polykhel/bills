"use client";

import { isSameDay, getDay, parseISO, isValid } from 'date-fns';
import { cn, formatCurrency } from '../../../lib/utils';

interface CardDueItem {
  cardId: string;
  bankName: string;
  cardName: string;
  amount: number;
  isPaid: boolean;
  profileName?: string;
  multiProfileMode: boolean;
}

interface CashInstallmentDueItem {
  id: string;
  name: string;
  term: number | string;
  amount: number;
  isPaid: boolean;
  bankName: string;
  cardName: string;
  profileName?: string;
  multiProfileMode: boolean;
}

interface CalendarDayProps {
  dayNum: number;
  isToday: boolean;
  cardsDue: CardDueItem[];
  cashInstsDue: CashInstallmentDueItem[];
}

export function CalendarDay({
  dayNum,
  isToday,
  cardsDue,
  cashInstsDue,
}: CalendarDayProps) {
  return (
    <div
      className={cn(
        'aspect-square min-h-[100px] border rounded-xl p-2 flex flex-col gap-1 transition-all hover:border-blue-300 hover:shadow-md',
        isToday ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-100'
      )}
    >
      <span
        className={cn(
          'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1',
          isToday ? 'bg-blue-600 text-white' : 'text-slate-400'
        )}
      >
        {dayNum}
      </span>
      <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
        {cardsDue.map((c) => (
          <div
            key={c.cardId}
            className={cn(
              'text-[10px] px-1.5 py-1 rounded border-l-2 flex flex-col',
              c.isPaid
                ? 'bg-green-50 text-green-700 border-green-500 opacity-60'
                : 'bg-slate-100 text-slate-700 border-slate-500'
            )}
            title={`${c.bankName} - ${c.cardName}${
              c.multiProfileMode && c.profileName ? ` (${c.profileName})` : ''
            }`}
          >
            <span className="font-semibold truncate">{c.bankName}</span>
            <span className="font-mono">{c.amount > 0 ? `₱${formatCurrency(c.amount)}` : '₱-'}</span>
            {c.multiProfileMode && c.profileName && (
              <span className="text-[8px] text-purple-600 font-medium truncate">{c.profileName}</span>
            )}
          </div>
        ))}
        {cashInstsDue.map((ci) => (
          <div
            key={ci.id}
            className={cn(
              'text-[10px] px-1.5 py-1 rounded border-l-2 flex flex-col',
              ci.isPaid
                ? 'bg-green-50 text-green-700 border-green-500 opacity-60'
                : 'bg-amber-50 text-amber-700 border-amber-500'
            )}
            title={`${ci.bankName} - ${ci.name} (${ci.term})${
              ci.multiProfileMode && ci.profileName ? ` (${ci.profileName})` : ''
            }`}
          >
            <span className="font-semibold truncate">{ci.name}</span>
            <span className="font-mono">
              {ci.amount > 0 ? `₱${formatCurrency(ci.amount)}` : '₱-'}
            </span>
            <span className="text-[8px] text-amber-600 font-medium">Cash - Term {ci.term}</span>
            {ci.multiProfileMode && ci.profileName && (
              <span className="text-[8px] text-purple-600 font-medium truncate">
                {ci.profileName}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
