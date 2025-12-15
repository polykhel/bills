"use client";

import { format, setDate, parseISO, isValid } from 'date-fns';
import { cn, formatCurrency } from '../../lib/utils';
import { useApp } from "../providers";
import { useState } from 'react';
import { StatsCards } from './_components/StatsCards';
import { BankBalanceToggle } from './_components/BankBalanceToggle';
import { BillsTableHeader } from './_components/BillsTableHeader';
import { BillsTable } from './_components/BillsTable';

export default function DashboardPage() {
  const {
    viewDate,
    totals,
    dashboardSort,
    setDashboardSort,
    visibleCards,
    profiles,
    activeProfileId,
    multiProfileMode,
    activeInstallments,
    activeCashInstallments,
    activeOneTimeBills,
    monthlyStatements,
    getCardInstallmentTotal,
    handleUpdateStatement,
    handleTogglePaid,
    handleToggleCashInstallmentPaid,
    handleToggleOneTimeBillPaid,
    handleExportMonthCSV,
    bankBalanceTrackingEnabled,
    setBankBalanceTrackingEnabled,
    currentBankBalance,
    updateBankBalance,
    balanceStatus,
    isLoaded,
    updateCashInstallment,
    updateOneTimeBill,
  } = useApp();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [batchCopied, setBatchCopied] = useState(false);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);

  const copyCardInfo = async (cardName: string, bankName: string, amountDue: number) => {
    const text = `${bankName} ${cardName}\t${formatCurrency(amountDue)}`;
    await navigator.clipboard.writeText(text);
    return text;
  };

  const toggleCardSelection = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const toggleAllCards = () => {
    if (selectedCards.size === visibleCards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(visibleCards.map(c => c.id)));
    }
  };

  const copySelectedCards = async () => {
    const sortedData = sortedDashboardData.filter(d => selectedCards.has(d.card.id));
    const lines = sortedData.map((data) => {
      if (data.type === 'card') {
        const { card, stmt, displayAmount } = data;
        const amountDue = stmt?.adjustedAmount ?? displayAmount;
        return `${card.bankName} ${card.cardName}\t ${formatCurrency(amountDue)}`;
      } else if (data.type === 'cashInstallment') {
        const { card, displayAmount } = data;
        const cashInstallment = data.cashInstallment;
        return `${card.bankName} ${card.cardName} - ${cashInstallment.name} (${cashInstallment.term}/${cashInstallment.term})\t ${formatCurrency(displayAmount)}`;
      } else {
        const { card, displayAmount } = data;
        const bill = data.oneTimeBill;
        return `${card.bankName} ${card.cardName} - ${bill.name}\t ${formatCurrency(displayAmount)}`;
      }
    });
    await navigator.clipboard.writeText(lines.join('\n'));
    setBatchCopied(true);
    setTimeout(() => setBatchCopied(false), 2000);
  };

  if (!isLoaded) {
    return null;
  }

  // Create dashboard data for regular cards
  const regularCardsData = visibleCards
    .filter(card => !card.isCashCard)
    .map(card => {
      const stmt = monthlyStatements.find(s => s.cardId === card.id);
      const defaultDate = setDate(viewDate, card.dueDay);
      const displayDate = stmt?.customDueDate ? parseISO(stmt.customDueDate) : defaultDate;
      const cardInstTotal = getCardInstallmentTotal(card.id);
      const displayAmount = stmt ? stmt.amount : cardInstTotal;
      const isPaid = stmt?.isPaid || false;
      const profile = profiles.find(p => p.id === card.profileId);
      return { 
        type: 'card' as const,
        card, 
        stmt, 
        displayDate, 
        displayAmount, 
        isPaid, 
        cardInstTotal, 
        profile 
      };
    });

  // Create dashboard data for cash installments
  const cashInstallmentsData = activeCashInstallments
    .filter(ci => {
      const card = visibleCards.find(c => c.id === ci.cardId);
      return card?.isCashCard;
    })
    .map(ci => {
      const card = visibleCards.find(c => c.id === ci.cardId)!;
      const displayDate = parseISO(ci.dueDate);
      const profile = profiles.find(p => p.id === card.profileId);
      return {
        type: 'cashInstallment' as const,
        card,
        cashInstallment: ci,
        displayDate,
        displayAmount: ci.amount,
        isPaid: ci.isPaid,
        profile
      };
    });

  // Create dashboard data for one-time bills
  const oneTimeBillsData = activeOneTimeBills
    .filter(bill => {
      const card = visibleCards.find(c => c.id === bill.cardId);
      return !!card;
    })
    .map(bill => {
      const card = visibleCards.find(c => c.id === bill.cardId)!;
      const displayDate = parseISO(bill.dueDate);
      const profile = profiles.find(p => p.id === card.profileId);
      return {
        type: 'oneTimeBill' as const,
        card,
        oneTimeBill: bill,
        displayDate,
        displayAmount: bill.amount,
        isPaid: bill.isPaid,
        profile
      };
    });

  // Combine and sort all data
  const sortedDashboardData = [...regularCardsData, ...cashInstallmentsData, ...oneTimeBillsData].sort((a, b) => {
    const dir = dashboardSort.direction === 'asc' ? 1 : -1;
    switch (dashboardSort.key) {
      case 'bankName': return a.card.bankName.localeCompare(b.card.bankName) * dir;
      case 'dueDate': return (a.displayDate.getTime() - b.displayDate.getTime()) * dir;
      case 'amount': return (a.displayAmount - b.displayAmount) * dir;
      case 'status': return (Number(a.isPaid) - Number(b.isPaid)) * dir;
      default: return 0;
    }
  });

  const handleSort = (key: string) => {
    setDashboardSort({
      key,
      direction: dashboardSort.key === key && dashboardSort.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  return (
    <div className="space-y-6">
      <StatsCards
        bankBalanceTrackingEnabled={bankBalanceTrackingEnabled}
        setBankBalanceTrackingEnabled={setBankBalanceTrackingEnabled}
        currentBankBalance={currentBankBalance}
        updateBankBalance={updateBankBalance}
        balanceStatus={balanceStatus}
        billTotal={totals.billTotal}
        unpaidTotal={totals.unpaidTotal}
        installmentTotal={totals.installmentTotal}
        multiProfileMode={multiProfileMode}
        profilesCount={profiles.length}
      />

      <BankBalanceToggle
        bankBalanceTrackingEnabled={bankBalanceTrackingEnabled}
        setBankBalanceTrackingEnabled={setBankBalanceTrackingEnabled}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <BillsTableHeader
          viewDate={viewDate}
          bulkSelectMode={bulkSelectMode}
          setBulkSelectMode={setBulkSelectMode}
          selectedCardsCount={selectedCards.size}
          batchCopied={batchCopied}
          onCopySelected={copySelectedCards}
          onExportCSV={handleExportMonthCSV}
        />
        <BillsTable
          sortedData={sortedDashboardData}
          bulkSelectMode={bulkSelectMode}
          selectedCards={selectedCards}
          dashboardSort={dashboardSort as any}
          onSort={handleSort}
          onToggleCardSelection={toggleCardSelection}
          onToggleAllCards={toggleAllCards}
          onCopyCardInfo={copyCardInfo}
          onTogglePaid={handleTogglePaid}
          onToggleCashInstallmentPaid={handleToggleCashInstallmentPaid}
          onToggleOneTimeBillPaid={handleToggleOneTimeBillPaid}
          onUpdateStatement={handleUpdateStatement}
          onUpdateCashInstallment={updateCashInstallment}
          onUpdateOneTimeBill={updateOneTimeBill}
          copiedId={copiedId}
          setCopiedId={setCopiedId}
          activeInstallments={activeInstallments}
          multiProfileMode={multiProfileMode}
          activeProfileId={activeProfileId}
        />
      </div>
    </div>
  );
}
