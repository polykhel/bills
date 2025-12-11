"use client";

import React, { createContext, useContext, useState, useMemo, useRef, ReactNode, useEffect } from "react";
import { format, setDate, parseISO, isValid } from "date-fns";
import { getInstallmentStatus } from "../lib/utils";
import { useProfiles, useCards, useStatements, useInstallments, useBankBalances, useCashInstallments, useOneTimeBills } from "../lib/hooks";
import type { CreditCard, Installment, Statement, SortConfig, CashInstallment, OneTimeBill } from "../lib/types";
import { Storage } from "../lib/storage";

interface AppContextType {
  // Date state
  viewDate: Date;
  setViewDate: (date: Date) => void;
  monthKey: string;

  // Data from hooks
  profiles: ReturnType<typeof useProfiles>['profiles'];
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  addProfile: (name: string) => void;
  renameProfile: (profileId: string, newName: string) => void;
  isLoaded: boolean;

  // Multi-profile mode
  multiProfileMode: boolean;
  setMultiProfileMode: (enabled: boolean) => void;
  selectedProfileIds: string[];
  setSelectedProfileIds: (ids: string[]) => void;
  toggleProfileSelection: (profileId: string) => void;

  cards: ReturnType<typeof useCards>['cards'];
  activeCards: ReturnType<typeof useCards>['activeCards'];
  visibleCards: CreditCard[];
  addCard: (card: Omit<CreditCard, "id">) => void;
  updateCard: (id: string, updates: Partial<CreditCard>) => void;
  deleteCard: (id: string) => void;
  transferCard: (cardId: string, targetProfileId: string) => void;

  statements: ReturnType<typeof useStatements>['statements'];
  monthlyStatements: any[];
  updateStatement: (cardId: string, monthStr: string, updates: any) => void;
  togglePaid: (cardId: string, monthStr: string, installmentTotal: number) => void;
  deleteStatementsForCard: (cardId: string) => void;

  installments: ReturnType<typeof useInstallments>['installments'];
  activeInstallments: any[];
  addInstallment: (installment: Omit<Installment, "id">) => void;
  updateInstallment: (id: string, updates: Partial<Installment>) => void;
  deleteInstallment: (id: string) => void;
  deleteInstallmentsForCard: (cardId: string) => void;

  // Cash installments
  cashInstallments: ReturnType<typeof useCashInstallments>['cashInstallments'];
  activeCashInstallments: CashInstallment[];
  addCashInstallment: (cashInst: Omit<CashInstallment, "id">) => void;
  updateCashInstallment: (id: string, updates: Partial<CashInstallment>) => void;
  deleteCashInstallment: (id: string) => void;
  toggleCashInstallmentPaid: (id: string) => void;

  // One-time bills
  oneTimeBills: ReturnType<typeof useOneTimeBills>['oneTimeBills'];
  activeOneTimeBills: OneTimeBill[];
  addOneTimeBill: (bill: Omit<OneTimeBill, "id">) => void;
  updateOneTimeBill: (id: string, updates: Partial<OneTimeBill>) => void;
  deleteOneTimeBill: (id: string) => void;
  toggleOneTimeBillPaid: (id: string) => void;

  // Bank balances
  bankBalanceTrackingEnabled: boolean;
  setBankBalanceTrackingEnabled: (enabled: boolean) => void;
  currentBankBalance: number;
  updateBankBalance: (balance: number) => void;
  balanceStatus: { difference: number; isEnough: boolean };

  // Modal state
  editingCard: CreditCard | null;
  setEditingCard: (card: CreditCard | null) => void;
  editingInst: Installment | null;
  setEditingInst: (inst: Installment | null) => void;
  editingOneTimeBill: OneTimeBill | null;
  setEditingOneTimeBill: (bill: OneTimeBill | null) => void;
  showCardModal: boolean;
  setShowCardModal: (show: boolean) => void;
  showInstModal: boolean;
  setShowInstModal: (show: boolean) => void;
  showOneTimeBillModal: boolean;
  setShowOneTimeBillModal: (show: boolean) => void;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;

  // Sorting state
  dashboardSort: SortConfig;
  setDashboardSort: (config: SortConfig) => void;
  manageCardSort: SortConfig;
  setManageCardSort: (config: SortConfig) => void;
  manageInstSort: SortConfig;
  setManageInstSort: (config: SortConfig) => void;
  manageOneTimeBillSort: SortConfig;
  setManageOneTimeBillSort: (config: SortConfig) => void;

  // Computed values
  getCardInstallmentTotal: (cardId: string) => number;
  totals: { billTotal: number; unpaidTotal: number; installmentTotal: number };

  // Handler functions
  handleUpdateStatement: (cardId: string, updates: any) => void;
  handleTogglePaid: (cardId: string) => void;
  handleToggleCashInstallmentPaid: (cashInstallmentId: string) => void;
  handleToggleOneTimeBillPaid: (oneTimeBillId: string) => void;
  handleSaveCard: (cardData: Omit<CreditCard, "id"> & { id?: string }) => void;
  handleSaveInstallment: (instData: Omit<Installment, "id"> & { id?: string }) => void;
  handleSaveOneTimeBill: (billData: Omit<OneTimeBill, "id"> & { id?: string }) => void;
  handleSaveProfile: (name: string) => void;
  handleRenameProfile: (profileId: string, newName: string) => void;
  handleDeleteCard: (id: string) => void;
  handleDeleteInstallment: (id: string) => void;
  handleDeleteOneTimeBill: (id: string) => void;
  handleTransferCard: (cardId: string, targetProfileId: string) => void;
  handleExportProfile: () => void;
  handleImportProfile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportMonthCSV: () => void;

  // Modal actions
  openAddCard: () => void;
  openEditCard: (card: CreditCard) => void;
  openAddInst: () => void;
  openEditInst: (inst: Installment) => void;
  openAddOneTimeBill: () => void;
  openEditOneTimeBill: (bill: OneTimeBill) => void;
  openTransferCard: (card: CreditCard) => void;

  // Transfer modal state
  transferringCard: CreditCard | null;
  showTransferModal: boolean;
  setShowTransferModal: (show: boolean) => void;

  // Ref for file input
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [viewDate, setViewDate] = useState(new Date());

  // Restore saved month on load, and persist changes
  useEffect(() => {
    const saved = Storage.getActiveMonthStr();
    if (saved) {
      const parsed = parseISO(`${saved}-01`);
      if (isValid(parsed)) {
        setViewDate(parsed);
      }
    }
  }, []);

  useEffect(() => {
    const monthStr = format(viewDate, "yyyy-MM");
    Storage.saveActiveMonthStr(monthStr);
  }, [viewDate]);

  // Custom hooks for data management
  const { profiles, activeProfileId, setActiveProfileId, addProfile, renameProfile, isLoaded } = useProfiles();
  const { cards, activeCards, addCard, updateCard, deleteCard: deleteCardBase, transferCard, getCardsForProfiles } = useCards(activeProfileId, isLoaded);
  const { statements, updateStatement, togglePaid, deleteStatementsForCard } = useStatements(isLoaded);
  const { installments, addInstallment, updateInstallment, deleteInstallment: deleteInstallmentBase, deleteInstallmentsForCard } = useInstallments(isLoaded);
  const { 
    cashInstallments, 
    addCashInstallment, 
    updateCashInstallment, 
    deleteCashInstallment, 
    deleteCashInstallmentsForCard,
    deleteCashInstallmentsForInstallment,
    generateCashInstallments,
    toggleCashInstallmentPaid
  } = useCashInstallments(isLoaded);
  const { 
    oneTimeBills, 
    addOneTimeBill, 
    updateOneTimeBill, 
    deleteOneTimeBill, 
    deleteOneTimeBillsForCard,
    toggleOneTimeBillPaid
  } = useOneTimeBills(isLoaded);
  const { bankBalances, updateBankBalance: updateBankBalanceBase, getBankBalance, getBalancesForProfiles } = useBankBalances(isLoaded);

  // Multi-profile mode state
  const [multiProfileMode, setMultiProfileMode] = useState(false);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);

  // Bank balance tracking state
  const [bankBalanceTrackingEnabled, setBankBalanceTrackingEnabled] = useState(false);

  // Load multi-profile settings on mount
  useEffect(() => {
    const savedMode = Storage.getMultiProfileMode();
    const savedIds = Storage.getSelectedProfileIds();
    const savedBankBalanceTracking = Storage.getBankBalanceTrackingEnabled();
    setMultiProfileMode(savedMode);
    setBankBalanceTrackingEnabled(savedBankBalanceTracking);
    if (savedIds.length > 0) {
      setSelectedProfileIds(savedIds);
    }
  }, []);

  // Save multi-profile settings when changed
  useEffect(() => {
    Storage.saveMultiProfileMode(multiProfileMode);
  }, [multiProfileMode]);

  useEffect(() => {
    Storage.saveSelectedProfileIds(selectedProfileIds);
  }, [selectedProfileIds]);

  useEffect(() => {
    Storage.saveBankBalanceTrackingEnabled(bankBalanceTrackingEnabled);
  }, [bankBalanceTrackingEnabled]);

  // Modal state
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editingInst, setEditingInst] = useState<Installment | null>(null);
  const [editingOneTimeBill, setEditingOneTimeBill] = useState<OneTimeBill | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showInstModal, setShowInstModal] = useState(false);
  const [showOneTimeBillModal, setShowOneTimeBillModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [transferringCard, setTransferringCard] = useState<CreditCard | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Sorting state
  const [dashboardSort, setDashboardSort] = useState<SortConfig>({ key: 'dueDate', direction: 'asc' });
  const [manageCardSort, setManageCardSort] = useState<SortConfig>({ key: 'bankName', direction: 'asc' });
  const [manageInstSort, setManageInstSort] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [manageOneTimeBillSort, setManageOneTimeBillSort] = useState<SortConfig>({ key: 'dueDate', direction: 'asc' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed values
  const monthKey = format(viewDate, "yyyy-MM");
  const monthlyStatements = useMemo(() => statements.filter(s => s.monthStr === monthKey), [statements, monthKey]);
  const activeInstallments = useMemo(() => installments.map(inst => ({ ...inst, status: getInstallmentStatus(inst, viewDate) })).filter(i => i.status.isActive), [installments, viewDate]);
  
  // Filter cash installments for the current month
  const activeCashInstallments = useMemo(() => {
    return cashInstallments.filter(ci => {
      const dueDate = parseISO(ci.dueDate);
      if (!isValid(dueDate)) return false;
      return format(dueDate, "yyyy-MM") === monthKey;
    });
  }, [cashInstallments, monthKey]);

  // Filter one-time bills for the current month
  const activeOneTimeBills = useMemo(() => {
    return oneTimeBills.filter(bill => {
      const dueDate = parseISO(bill.dueDate);
      if (!isValid(dueDate)) return false;
      return format(dueDate, "yyyy-MM") === monthKey;
    });
  }, [oneTimeBills, monthKey]);

  // Determine visible cards based on mode
  const visibleCards = useMemo(() => {
    if (multiProfileMode && selectedProfileIds.length > 0) {
      return getCardsForProfiles(selectedProfileIds);
    }
    return activeCards;
  }, [multiProfileMode, selectedProfileIds, activeCards, getCardsForProfiles]);

  const getCardInstallmentTotal = (cardId: string) => 
    activeInstallments.filter(i => i.cardId === cardId).reduce((acc, i) => acc + i.monthlyAmortization, 0);

  const totals = useMemo(() => {
    const visibleCardIds = new Set(visibleCards.map(c => c.id));
    const visibleInstallments = activeInstallments.filter(i => visibleCardIds.has(i.cardId));
    const installmentTotal = visibleInstallments.reduce((acc, i) => acc + i.monthlyAmortization, 0);
    let billTotal = 0;
    let unpaidTotal = 0;
    visibleCards.forEach(card => {
      const stmt = monthlyStatements.find(s => s.cardId === card.id);
      const cardInstTotal = visibleInstallments.filter(i => i.cardId === card.id).reduce((acc, i) => acc + i.monthlyAmortization, 0);
      const effectiveAmount = stmt ? stmt.amount : cardInstTotal;
      const amountDue = stmt?.adjustedAmount !== undefined ? stmt.adjustedAmount : effectiveAmount;
      billTotal += effectiveAmount;
      if (!stmt?.isPaid) unpaidTotal += amountDue;
    });
    
    // Add cash installments to totals
    const visibleCashInstallments = activeCashInstallments.filter(ci => visibleCardIds.has(ci.cardId));
    const totalCashAmount = visibleCashInstallments.reduce((acc, ci) => acc + ci.amount, 0);
    const unpaidCashTotal = visibleCashInstallments
      .filter(ci => !ci.isPaid)
      .reduce((acc, ci) => acc + ci.amount, 0);
    billTotal += totalCashAmount;
    unpaidTotal += unpaidCashTotal;

    // Add one-time bills to totals
    const visibleOneTimeBills = activeOneTimeBills.filter(bill => visibleCardIds.has(bill.cardId));
    const totalOneTimeBillAmount = visibleOneTimeBills.reduce((acc, bill) => acc + bill.amount, 0);
    const unpaidOneTimeBillTotal = visibleOneTimeBills
      .filter(bill => !bill.isPaid)
      .reduce((acc, bill) => acc + bill.amount, 0);
    billTotal += totalOneTimeBillAmount;
    unpaidTotal += unpaidOneTimeBillTotal;
    
    // Add cash installments to installment total
    const cashInstallmentTotal = totalCashAmount;
    
    return { billTotal, unpaidTotal, installmentTotal: installmentTotal + cashInstallmentTotal };
  }, [visibleCards, monthlyStatements, activeInstallments, activeCashInstallments, activeOneTimeBills]);

  // Bank balance calculations
  const currentBankBalance = useMemo(() => {
    if (multiProfileMode && selectedProfileIds.length > 0) {
      return getBalancesForProfiles(selectedProfileIds, monthKey);
    }
    return getBankBalance(activeProfileId, monthKey);
  }, [multiProfileMode, selectedProfileIds, activeProfileId, monthKey, getBankBalance, getBalancesForProfiles, bankBalances]);

  const balanceStatus = useMemo(() => {
    const difference = currentBankBalance - totals.unpaidTotal;
    return {
      difference,
      isEnough: difference >= 0,
    };
  }, [currentBankBalance, totals.unpaidTotal]);

  const handleUpdateBankBalance = (balance: number) => {
    if (multiProfileMode && selectedProfileIds.length > 0) {
      // In multi-profile mode, update the first selected profile's balance
      // You may want to show a warning or handle this differently
      if (selectedProfileIds.length > 0) {
        updateBankBalanceBase(selectedProfileIds[0], monthKey, balance);
      }
    } else {
      updateBankBalanceBase(activeProfileId, monthKey, balance);
    }
  };

  // Handler functions
  const handleUpdateStatement = (cardId: string, updates: any) => {
    updateStatement(cardId, monthKey, updates);
  };

  const handleTogglePaid = (cardId: string) => {
    const cardInstTotal = getCardInstallmentTotal(cardId);
    const stmt = monthlyStatements.find(s => s.cardId === cardId);
    const effectiveAmount = stmt ? stmt.amount : cardInstTotal;
    const amountDue = stmt?.adjustedAmount !== undefined ? stmt.adjustedAmount : effectiveAmount;
    const wasPaid = stmt?.isPaid || false;
    
    // If bank balance tracking is enabled, update the balance
    if (bankBalanceTrackingEnabled) {
      if (!wasPaid) {
        // Marking as paid: subtract from balance
        const newBalance = currentBankBalance - amountDue;
        handleUpdateBankBalance(newBalance);
      } else {
        // Unmarking as paid: add back to balance
        const newBalance = currentBankBalance + amountDue;
        handleUpdateBankBalance(newBalance);
      }
    }
    
    togglePaid(cardId, monthKey, cardInstTotal);
  };

  const handleToggleCashInstallmentPaid = (cashInstallmentId: string) => {
    const cashInst = cashInstallments.find(ci => ci.id === cashInstallmentId);
    if (!cashInst) return;
    
    const wasPaid = cashInst.isPaid;
    
    // If bank balance tracking is enabled, update the balance
    if (bankBalanceTrackingEnabled) {
      if (!wasPaid) {
        // Marking as paid: subtract from balance
        const newBalance = currentBankBalance - cashInst.amount;
        handleUpdateBankBalance(newBalance);
      } else {
        // Unmarking as paid: add back to balance
        const newBalance = currentBankBalance + cashInst.amount;
        handleUpdateBankBalance(newBalance);
      }
    }
    
    toggleCashInstallmentPaid(cashInstallmentId);
  };

  const handleToggleOneTimeBillPaid = (oneTimeBillId: string) => {
    const bill = oneTimeBills.find(b => b.id === oneTimeBillId);
    if (!bill) return;
    
    const wasPaid = bill.isPaid;
    
    // If bank balance tracking is enabled, update the balance
    if (bankBalanceTrackingEnabled) {
      if (!wasPaid) {
        // Marking as paid: subtract from balance
        const newBalance = currentBankBalance - bill.amount;
        handleUpdateBankBalance(newBalance);
      } else {
        // Unmarking as paid: add back to balance
        const newBalance = currentBankBalance + bill.amount;
        handleUpdateBankBalance(newBalance);
      }
    }
    
    toggleOneTimeBillPaid(oneTimeBillId);
  };

  const handleSaveCard = (cardData: Omit<CreditCard, "id"> & { id?: string }) => {
    if (cardData.id) {
      updateCard(cardData.id, cardData);
    } else {
      addCard(cardData);
    }
    setShowCardModal(false);
    setEditingCard(null);
  };

  const handleSaveInstallment = (instData: Omit<Installment, "id"> & { id?: string }) => {
    const card = cards.find(c => c.id === instData.cardId);
    
    if (instData.id) {
      updateInstallment(instData.id, instData);
      // If updating and card is cash card, regenerate cash installments
      if (card?.isCashCard) {
        deleteCashInstallmentsForInstallment(instData.id);
        generateCashInstallments(instData as Installment, card);
      }
    } else {
      const newInst = { ...instData, id: crypto.randomUUID() };
      addInstallment(newInst);
      // If card is cash card, generate cash installments
      if (card?.isCashCard) {
        generateCashInstallments(newInst, card);
      }
    }
    setShowInstModal(false);
    setEditingInst(null);
  };

  const handleSaveOneTimeBill = (billData: Omit<OneTimeBill, "id"> & { id?: string }) => {
    if (billData.id) {
      updateOneTimeBill(billData.id, billData);
    } else {
      addOneTimeBill(billData);
    }
    setShowOneTimeBillModal(false);
    setEditingOneTimeBill(null);
  };

  const handleSaveProfile = (name: string) => {
    addProfile(name);
    setShowProfileModal(false);
  };

  const handleRenameProfile = (profileId: string, newName: string) => {
    renameProfile(profileId, newName);
  };

  const openAddCard = () => { setEditingCard(null); setShowCardModal(true); };
  const openEditCard = (card: CreditCard) => { setEditingCard(card); setShowCardModal(true); };
  const openAddInst = () => { setEditingInst(null); setShowInstModal(true); };
  const openEditInst = (inst: Installment) => { setEditingInst(inst); setShowInstModal(true); };
  const openAddOneTimeBill = () => { setEditingOneTimeBill(null); setShowOneTimeBillModal(true); };
  const openEditOneTimeBill = (bill: OneTimeBill) => { setEditingOneTimeBill(bill); setShowOneTimeBillModal(true); };

  const handleDeleteCard = (id: string) => {
    if (deleteCardBase(id)) {
      deleteStatementsForCard(id);
      deleteInstallmentsForCard(id);
      deleteCashInstallmentsForCard(id);
      deleteOneTimeBillsForCard(id);
    }
  };

  const handleDeleteInstallment = (id: string) => {
    if (deleteInstallmentBase(id)) {
      deleteCashInstallmentsForInstallment(id);
    }
  };

  const handleDeleteOneTimeBill = (id: string) => {
    deleteOneTimeBill(id);
  };

  const handleTransferCard = (cardId: string, targetProfileId: string) => {
    transferCard(cardId, targetProfileId);
    setShowTransferModal(false);
    setTransferringCard(null);
  };

  const toggleProfileSelection = (profileId: string) => {
    setSelectedProfileIds(prev => {
      if (prev.includes(profileId)) {
        return prev.filter(id => id !== profileId);
      } else {
        return [...prev, profileId];
      }
    });
  };

  const openTransferCard = (card: CreditCard) => {
    setTransferringCard(card);
    setShowTransferModal(true);
  };

  // Import/Export functions
  const handleExportProfile = () => {
    const profile = profiles.find(p => p.id === activeProfileId);
    if (!profile) return;
    const exportCards = activeCards;
    const exportCardIds = new Set(exportCards.map(c => c.id));
    const exportStatements = statements.filter(s => exportCardIds.has(s.cardId));
    const exportInstallments = installments.filter(i => exportCardIds.has(i.cardId));
    const exportData = { 
      version: 1, 
      type: "profile-backup", 
      profile, 
      cards: exportCards, 
      statements: exportStatements, 
      installments: exportInstallments 
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-tracker-${profile.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);
        
        // Validate file format
        if (!data.profile || !Array.isArray(data.cards)) {
          throw new Error("Invalid file format. Expected profile and cards array.");
        }
        
        // Check if profile name already exists
        const existingProfile = profiles.find(p => p.name === data.profile.name);
        if (existingProfile) {
          throw new Error(`Profile "${data.profile.name}" already exists. Please rename it before importing.`);
        }
        
        // Create new profile with new ID
        const newProfileId = crypto.randomUUID();
        const newProfile = { id: newProfileId, name: data.profile.name };
        addProfile(newProfile.name);
        
        // Import cards with new profile ID and generate new IDs
        const cardIdMap = new Map<string, string>(); // old ID -> new ID
        data.cards.forEach((card: CreditCard) => {
          const oldCardId = card.id;
          const newCardId = crypto.randomUUID();
          cardIdMap.set(oldCardId, newCardId);
          
          addCard({
            ...card,
            profileId: newProfileId,
          });
        });
        
        // Import statements with new card IDs
        if (Array.isArray(data.statements)) {
          data.statements.forEach((stmt: Statement) => {
            const newCardId = cardIdMap.get(stmt.cardId);
            if (newCardId) {
              updateStatement(newCardId, stmt.monthStr, {
                amount: stmt.amount,
                isPaid: stmt.isPaid,
                isUnbilled: stmt.isUnbilled,
                customDueDate: stmt.customDueDate,
              });
            }
          });
        }
        
        // Import installments with new card IDs
        if (Array.isArray(data.installments)) {
          data.installments.forEach((inst: Installment) => {
            const newCardId = cardIdMap.get(inst.cardId);
            if (newCardId) {
              addInstallment({
                ...inst,
                cardId: newCardId,
              });
            }
          });
        }
        
        alert(`Profile "${data.profile.name}" imported successfully with ${data.cards.length} card(s).`);
      } catch (err: any) {
        console.error(err);
        alert("Failed to import: " + err.message);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleExportMonthCSV = () => {
    const headers = ["Card", "Bank", "Due Date", "Statement Balance", "Amount Due", "Status", "Installments Included"];
    const rows = activeCards.map(card => {
      const stmt = monthlyStatements.find(s => s.cardId === card.id);
      const defaultDate = setDate(viewDate, card.dueDay);
      const displayDate = stmt?.customDueDate ? parseISO(stmt.customDueDate) : defaultDate;
      const formattedDate = isValid(displayDate) ? format(displayDate, "yyyy-MM-dd") : "";
      const cardInstTotal = getCardInstallmentTotal(card.id);
      const displayAmount = stmt ? stmt.amount : cardInstTotal;
      const amountDue = stmt?.adjustedAmount !== undefined ? stmt.adjustedAmount : displayAmount;
      const status = stmt?.isPaid ? "Paid" : "Unpaid";
      return [
        `\"${card.cardName}\"`,
        `\"${card.bankName}\"`,
        formattedDate,
        displayAmount.toFixed(2),
        amountDue.toFixed(2),
        status,
        cardInstTotal.toFixed(2)
      ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills-${monthKey}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const value: AppContextType = {
    viewDate,
    setViewDate,
    monthKey,
    profiles,
    activeProfileId,
    setActiveProfileId,
    addProfile,
    renameProfile,
    isLoaded,
    multiProfileMode,
    setMultiProfileMode,
    selectedProfileIds,
    setSelectedProfileIds,
    toggleProfileSelection,
    cards,
    activeCards,
    visibleCards,
    addCard,
    updateCard,
    deleteCard: deleteCardBase,
    transferCard,
    statements,
    monthlyStatements,
    updateStatement,
    togglePaid,
    deleteStatementsForCard,
    installments,
    activeInstallments,
    addInstallment,
    updateInstallment,
    deleteInstallment: deleteInstallmentBase,
    deleteInstallmentsForCard,
    cashInstallments,
    activeCashInstallments,
    addCashInstallment,
    updateCashInstallment,
    deleteCashInstallment,
    toggleCashInstallmentPaid,
    oneTimeBills,
    activeOneTimeBills,
    addOneTimeBill,
    updateOneTimeBill,
    deleteOneTimeBill,
    toggleOneTimeBillPaid,
    bankBalanceTrackingEnabled,
    setBankBalanceTrackingEnabled,
    currentBankBalance,
    updateBankBalance: handleUpdateBankBalance,
    balanceStatus,
    editingCard,
    setEditingCard,
    editingInst,
    setEditingInst,
    editingOneTimeBill,
    setEditingOneTimeBill,
    showCardModal,
    setShowCardModal,
    showInstModal,
    setShowInstModal,
    showOneTimeBillModal,
    setShowOneTimeBillModal,
    showProfileModal,
    setShowProfileModal,
    dashboardSort,
    setDashboardSort,
    manageCardSort,
    setManageCardSort,
    manageInstSort,
    setManageInstSort,
    manageOneTimeBillSort,
    setManageOneTimeBillSort,
    getCardInstallmentTotal,
    totals,
    handleUpdateStatement,
    handleTogglePaid,
    handleToggleCashInstallmentPaid,
    handleToggleOneTimeBillPaid,
    handleSaveCard,
    handleSaveInstallment,
    handleSaveOneTimeBill,
    handleSaveProfile,
    handleRenameProfile,
    handleDeleteCard,
    handleDeleteInstallment,
    handleDeleteOneTimeBill,
    handleTransferCard,
    handleExportProfile,
    handleImportProfile,
    handleExportMonthCSV,
    openAddCard,
    openEditCard,
    openAddInst,
    openEditInst,
    openAddOneTimeBill,
    openEditOneTimeBill,
    openTransferCard,
    transferringCard,
    showTransferModal,
    setShowTransferModal,
    fileInputRef,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
