"use client";

import CalendarView from "../../views/Calendar";
import { useApp } from "../providers";

export default function CalendarPage() {
  const {
    viewDate,
    activeCards,
    monthlyStatements,
    getCardInstallmentTotal,
    isLoaded,
  } = useApp();

  if (!isLoaded) {
    return null;
  }

  return (
    <CalendarView
        viewDate={viewDate}
        activeCards={activeCards}
        monthlyStatements={monthlyStatements}
        getCardInstallmentTotal={getCardInstallmentTotal}
      />
  );
}
