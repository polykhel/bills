"use client";

import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, setDate, parseISO, isValid } from 'date-fns';
import { cn, formatCurrency } from '../../lib/utils';
import { useApp } from "../providers";
import { CalendarHeader } from './_components/CalendarHeader';
import { CalendarDay } from './_components/CalendarDay';

export default function CalendarPage() {
  const {
    viewDate,
    visibleCards,
    profiles,
    multiProfileMode,
    monthlyStatements,
    getCardInstallmentTotal,
    activeCashInstallments,
    activeOneTimeBills,
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
      <CalendarHeader days={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']} />
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
            })
            .map(c => {
              const stmt = monthlyStatements.find(s => s.cardId === c.id);
              const paid = stmt?.isPaid;
              const amount = stmt ? stmt.amount : getCardInstallmentTotal(c.id);
              const profile = profiles.find(p => p.id === c.profileId);
              return {
                cardId: c.id,
                bankName: c.bankName,
                cardName: c.cardName,
                amount,
                isPaid: paid || false,
                profileName: profile?.name,
                multiProfileMode,
              };
            });

          // Cash installments due on this day
          const cashInstsDue = activeCashInstallments
            .filter(ci => {
              const card = visibleCards.find(c => c.id === ci.cardId);
              if (!card?.isCashCard) return false;
              const dueDate = parseISO(ci.dueDate);
              return isValid(dueDate) && isSameDay(dueDate, day);
            })
            .map(ci => {
              const card = visibleCards.find(c => c.id === ci.cardId)!;
              const profile = profiles.find(p => p.id === card.profileId);
              return {
                id: ci.id,
                name: ci.name,
                term: ci.term,
                amount: ci.amount,
                isPaid: ci.isPaid,
                bankName: card.bankName,
                cardName: card.cardName,
                profileName: profile?.name,
                multiProfileMode,
              };
            });

          // One-time bills due on this day
          const billsDue = activeOneTimeBills
            .filter(bill => {
              const card = visibleCards.find(c => c.id === bill.cardId);
              if (!card) return false;
              const dueDate = parseISO(bill.dueDate);
              return isValid(dueDate) && isSameDay(dueDate, day);
            })
            .map(bill => {
              const card = visibleCards.find(c => c.id === bill.cardId)!;
              const profile = profiles.find(p => p.id === card.profileId);
              return {
                id: bill.id,
                name: bill.name,
                amount: bill.amount,
                isPaid: bill.isPaid,
                bankName: card.bankName,
                cardName: card.cardName,
                profileName: profile?.name,
                multiProfileMode,
              };
            });

          return (
            <CalendarDay
              key={day.toISOString()}
              dayNum={dayNum}
              isToday={isToday}
              cardsDue={cardsDue}
              cashInstsDue={cashInstsDue}
              billsDue={billsDue}
            />
          );
        })}
      </div>
    </div>
  );
}
