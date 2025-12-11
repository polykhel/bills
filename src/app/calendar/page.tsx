"use client";

import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, setDate, parseISO, isValid } from 'date-fns';
import { cn, formatCurrency } from '../../lib/utils';
import { useApp } from "../providers";

export default function CalendarPage() {
  const {
    viewDate,
    visibleCards,
    profiles,
    multiProfileMode,
    monthlyStatements,
    getCardInstallmentTotal,
    activeCashInstallments,
    isLoaded,
  } = useApp();

  if (!isLoaded) {
    return null;
  }

  const start = startOfMonth(viewDate);
  const end = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start, end });
  const startDayIndex = getDay(start);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {days.map(day => {
          const dayNum = day.getDate();
          const isToday = isSameDay(day, new Date());
          
          // Regular cards due on this day
          const cardsDue = visibleCards
            .filter(c => !c.isCashCard)
            .filter(c => {
              const stmt = monthlyStatements.find(s => s.cardId === c.id);
              let targetDate = setDate(viewDate, c.dueDay);
              if (stmt?.customDueDate) targetDate = parseISO(stmt.customDueDate);
              return isSameDay(targetDate, day);
            });
          
          // Cash installments due on this day
          const cashInstsDue = activeCashInstallments.filter(ci => {
            const card = visibleCards.find(c => c.id === ci.cardId);
            if (!card?.isCashCard) return false;
            const dueDate = parseISO(ci.dueDate);
            return isValid(dueDate) && isSameDay(dueDate, day);
          });
          
          return (
            <div 
              key={day.toISOString()} 
              className={cn(
                'aspect-square min-h-[100px] border rounded-xl p-2 flex flex-col gap-1 transition-all hover:border-blue-300 hover:shadow-md',
                isToday ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-100'
              )}
            >
              <span className={cn(
                'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1',
                isToday ? 'bg-blue-600 text-white' : 'text-slate-400'
              )}>{dayNum}</span>
              <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
                {cardsDue.map(c => {
                  const stmt = monthlyStatements.find(s => s.cardId === c.id);
                  const paid = stmt?.isPaid;
                  const amount = stmt ? stmt.amount : getCardInstallmentTotal(c.id);
                  const profile = profiles.find(p => p.id === c.profileId);
                  return (
                    <div 
                      key={c.id} 
                      className={cn(
                        'text-[10px] px-1.5 py-1 rounded border-l-2 flex flex-col',
                        paid ? 'bg-green-50 text-green-700 border-green-500 opacity-60' : 'bg-slate-100 text-slate-700 border-slate-500'
                      )}
                      title={`${c.bankName} - ${c.cardName}${multiProfileMode && profile ? ` (${profile.name})` : ''}`}
                    >
                      <span className="font-semibold truncate">{c.bankName}</span>
                      <span className="font-mono">{amount > 0 ? `₱${formatCurrency(amount)}` : '₱-'}</span>
                      {multiProfileMode && profile && (
                        <span className="text-[8px] text-purple-600 font-medium truncate">{profile.name}</span>
                      )}
                    </div>
                  );
                })}
                {cashInstsDue.map(ci => {
                  const card = visibleCards.find(c => c.id === ci.cardId)!;
                  const profile = profiles.find(p => p.id === card.profileId);
                  return (
                    <div 
                      key={ci.id} 
                      className={cn(
                        'text-[10px] px-1.5 py-1 rounded border-l-2 flex flex-col',
                        ci.isPaid ? 'bg-green-50 text-green-700 border-green-500 opacity-60' : 'bg-amber-50 text-amber-700 border-amber-500'
                      )}
                      title={`${card.bankName} - ${ci.name} (${ci.term})${multiProfileMode && profile ? ` (${profile.name})` : ''}`}
                    >
                      <span className="font-semibold truncate">{ci.name}</span>
                      <span className="font-mono">{ci.amount > 0 ? `₱${formatCurrency(ci.amount)}` : '₱-'}</span>
                      <span className="text-[8px] text-amber-600 font-medium">Cash - Term {ci.term}</span>
                      {multiProfileMode && profile && (
                        <span className="text-[8px] text-purple-600 font-medium truncate">{profile.name}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
