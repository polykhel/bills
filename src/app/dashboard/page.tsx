"use client";

import Dashboard from "../../views/Dashboard";
import { useApp } from "../providers";

export default function DashboardPage() {
  const {
    viewDate,
    totals,
    dashboardSort,
    setDashboardSort,
    activeCards,
    activeInstallments,
    monthlyStatements,
    getCardInstallmentTotal,
    handleUpdateStatement,
    handleTogglePaid,
    handleExportMonthCSV,
    isLoaded,
  } = useApp();

  if (!isLoaded) {
    return null;
  }

  return (
    <Dashboard
        viewDate={viewDate}
        totals={totals}
        dashboardSort={dashboardSort}
        setDashboardSort={setDashboardSort}
        activeCards={activeCards}
        activeInstallments={activeInstallments as any}
        monthlyStatements={monthlyStatements}
        getCardInstallmentTotal={getCardInstallmentTotal}
        handleUpdateStatement={handleUpdateStatement}
        togglePaid={handleTogglePaid}
        handleExportMonthCSV={handleExportMonthCSV}
      />
  );
}
