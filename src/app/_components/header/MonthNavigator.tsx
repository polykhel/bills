import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthNavigatorProps {
  viewDate: Date;
  onDateChange: (date: Date) => void;
}

export default function MonthNavigator({ viewDate, onDateChange }: MonthNavigatorProps) {
  return (
    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
      <button
        onClick={() => onDateChange(subMonths(viewDate, 1))}
        className="p-1 hover:bg-white hover:shadow-sm rounded-md transition text-slate-500"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-semibold w-28 text-center text-slate-700 select-none">
        {format(viewDate, "MMMM yyyy")}
      </span>
      <button
        onClick={() => onDateChange(addMonths(viewDate, 1))}
        className="p-1 hover:bg-white hover:shadow-sm rounded-md transition text-slate-500"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
