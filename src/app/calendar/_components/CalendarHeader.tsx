"use client";

interface CalendarHeaderProps {
  days: string[];
}

export function CalendarHeader({ days }: CalendarHeaderProps) {
  return (
    <div className="grid grid-cols-7 gap-2 mb-2">
      {days.map((d) => (
        <div
          key={d}
          className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider"
        >
          {d}
        </div>
      ))}
    </div>
  );
}
