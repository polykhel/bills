"use client";

import React, { createContext, useContext, useState, useMemo, useRef, ReactNode, useEffect } from "react";
import { format, setDate, parseISO, isValid } from "date-fns";
import { getInstallmentStatus } from "../lib/utils";
import { useProfiles, useCards, useStatements, useInstallments } from "../lib/hooks";
import type { CreditCard, Installment, Statement, SortConfig } from "../lib/types";
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

  // Modal state
  editingCard: CreditCard | null;
  setEditingCard: (card: CreditCard | null) => void;
  editingInst: Installment | null;
  setEditingInst: (inst: Installment | null) => void;
  showCardModal: boolean;
  setShowCardModal: (show: boolean) => void;
  showInstModal: boolean;
  setShowInstModal: (show: boolean) => void;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;

  // Sorting state
  dashboardSort: SortConfig;
  setDashboardSort: (config: SortConfig) => void;
  manageCardSort: SortConfig;
  setManageCardSort: (config: SortConfig) => void;
  manageInstSort: SortConfig;
  setManageInstSort: (config: SortConfig) => void;

  // Computed values
  getCardInstallmentTotal: (cardId: string) => number;
  totals: { billTotal: number; unpaidTotal: number; installmentTotal: number };

  // Handler functions
  handleUpdateStatement: (cardId: string, updates: any) => void;
  handleTogglePaid: (cardId: string) => void;
  handleSaveCard: (cardData: Omit<CreditCard, "id"> & { id?: string }) => void;
  handleSaveInstallment: (instData: Omit<Installment, "id"> & { id?: string }) => void;
  handleSaveProfile: (name: string) => void;
  handleDeleteCard: (id: string) => void;
  handleDeleteInstallment: (id: string) => void;
  handleTransferCard: (cardId: string, targetProfileId: string) => void;
  handleExportProfile: () => void;
  handleImportProfile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportMonthCSV: () => void;

  // Modal actions
  openAddCard: () => void;
  openEditCard: (card: CreditCard) => void;
  openAddInst: () => void;
  openEditInst: (inst: Installment) => void;
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
  const { profiles, activeProfileId, setActiveProfileId, addProfile, isLoaded } = useProfiles();
  const { cards, activeCards, addCard, updateCard, deleteCard: deleteCardBase, transferCard, getCardsForProfiles } = useCards(activeProfileId, isLoaded);
  const { statements, updateStatement, togglePaid, deleteStatementsForCard } = useStatements(isLoaded);
  const { installments, addInstallment, updateInstallment, deleteInstallment: deleteInstallmentBase, deleteInstallmentsForCard } = useInstallments(isLoaded);

  // Multi-profile mode state
  const [multiProfileMode, setMultiProfileMode] = useState(false);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);

  // Load multi-profile settings on mount
  useEffect(() => {
    const savedMode = Storage.getMultiProfileMode();
    const savedIds = Storage.getSelectedProfileIds();
    setMultiProfileMode(savedMode);
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

  // Modal state
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editingInst, setEditingInst] = useState<Installment | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showInstModal, setShowInstModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [transferringCard, setTransferringCard] = useState<CreditCard | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Sorting state
  const [dashboardSort, setDashboardSort] = useState<SortConfig>({ key: 'dueDate', direction: 'asc' });
  const [manageCardSort, setManageCardSort] = useState<SortConfig>({ key: 'bankName', direction: 'asc' });
  const [manageInstSort, setManageInstSort] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed values
  const monthKey = format(viewDate, "yyyy-MM");
  const monthlyStatements = useMemo(() => statements.filter(s => s.monthStr === monthKey), [statements, monthKey]);
  const activeInstallments = useMemo(() => installments.map(inst => ({ ...inst, status: getInstallmentStatus(inst, viewDate) })).filter(i => i.status.isActive), [installments, viewDate]);

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
    return { billTotal, unpaidTotal, installmentTotal };
  }, [visibleCards, monthlyStatements, activeInstallments]);

  // Handler functions
  const handleUpdateStatement = (cardId: string, updates: any) => {
    updateStatement(cardId, monthKey, updates);
  };

  const handleTogglePaid = (cardId: string) => {
    const cardInstTotal = getCardInstallmentTotal(cardId);
    togglePaid(cardId, monthKey, cardInstTotal);
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
    if (instData.id) {
      updateInstallment(instData.id, instData);
    } else {
      addInstallment(instData);
    }
    setShowInstModal(false);
    setEditingInst(null);
  };

  const handleSaveProfile = (name: string) => {
    addProfile(name);
    setShowProfileModal(false);
  };

  const openAddCard = () => { setEditingCard(null); setShowCardModal(true); };
  const openEditCard = (card: CreditCard) => { setEditingCard(card); setShowCardModal(true); };
  const openAddInst = () => { setEditingInst(null); setShowInstModal(true); };
  const openEditInst = (inst: Installment) => { setEditingInst(inst); setShowInstModal(true); };

  const handleDeleteCard = (id: string) => {
    if (deleteCardBase(id)) {
      deleteStatementsForCard(id);
      deleteInstallmentsForCard(id);
    }
  };

  const handleDeleteInstallment = (id: string) => {
    deleteInstallmentBase(id);
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
    editingCard,
    setEditingCard,
    editingInst,
    setEditingInst,
    showCardModal,
    setShowCardModal,
    showInstModal,
    setShowInstModal,
    showProfileModal,
    setShowProfileModal,
    dashboardSort,
    setDashboardSort,
    manageCardSort,
    setManageCardSort,
    manageInstSort,
    setManageInstSort,
    getCardInstallmentTotal,
    totals,
    handleUpdateStatement,
    handleTogglePaid,
    handleSaveCard,
    handleSaveInstallment,
    handleSaveProfile,
    handleDeleteCard,
    handleDeleteInstallment,
    handleTransferCard,
    handleExportProfile,
    handleImportProfile,
    handleExportMonthCSV,
    openAddCard,
    openEditCard,
    openAddInst,
    openEditInst,
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
