"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  format, addMonths, subMonths, setDate, 
  startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameDay, getDay, differenceInCalendarMonths, parseISO, isValid 
} from "date-fns";
import { 
  ChevronLeft, ChevronRight, Plus, Trash2, Pencil,
  CreditCard as CardIcon, List as ListIcon, 
  CheckCircle2, Circle, Users, UserPlus, User,
  Download, Upload, FileSpreadsheet, ArrowUpDown, Calendar, Calculator
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Types ---

export interface Profile {
  id: string;
  name: string;
}

export interface CreditCard {
  id: string;
  profileId: string;
  bankName: string;
  cardName: string;
  dueDay: number;
  cutoffDay: number;
  color: string;
}

export interface Statement {
  id: string;
  cardId: string;
  monthStr: string;
  amount: number;
  isPaid: boolean;
  customDueDate?: string;
}

export interface Installment {
  id: string;
  cardId: string;
  name: string;
  totalPrincipal: number;
  terms: number;
  monthlyAmortization: number;
  startDate: string;
}

export interface InstallmentStatus {
  currentTerm: number;
  totalTerms: number;
  monthlyAmount: number;
  isActive: boolean;
  isFinished: boolean;
  isUpcoming: boolean;
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

// --- Utilities ---

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const KEYS = {
  PROFILES: "bt_profiles",
  CARDS: "bt_cards",
  STATEMENTS: "bt_statements",
  INSTALLMENTS: "bt_installments",
};

export const loadData = <T,>(key: string): T[] => {
  if (typeof window === "undefined") return [];
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error("Error loading data", e);
    return [];
  }
};

export const saveData = <T,>(key: string, data: T[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
};

export const Storage = {
  getProfiles: () => loadData<Profile>(KEYS.PROFILES),
  saveProfiles: (data: Profile[]) => saveData(KEYS.PROFILES, data),

  getCards: () => loadData<CreditCard>(KEYS.CARDS),
  saveCards: (data: CreditCard[]) => saveData(KEYS.CARDS, data),
  
  getStatements: () => loadData<Statement>(KEYS.STATEMENTS),
  saveStatements: (data: Statement[]) => saveData(KEYS.STATEMENTS, data),
  
  getInstallments: () => loadData<Installment>(KEYS.INSTALLMENTS),
  saveInstallments: (data: Installment[]) => saveData(KEYS.INSTALLMENTS, data),
};

export const getInstallmentStatus = (
  inst: Installment,
  viewDate: Date
): InstallmentStatus => {
  const start = parseISO(inst.startDate);
  const currentMonth = startOfMonth(viewDate);
  const startMonth = startOfMonth(start);

  const diff = differenceInCalendarMonths(currentMonth, startMonth);
  const currentTerm = diff + 1;

  const isActive = currentTerm >= 1 && currentTerm <= inst.terms;
  const isFinished = currentTerm > inst.terms;
  const isUpcoming = currentTerm < 1;

  return {
    currentTerm,
    totalTerms: inst.terms,
    monthlyAmount: inst.monthlyAmortization,
    isActive,
    isFinished,
    isUpcoming,
  };
};

const formatCurrency = (amount: number) => {
  return amount.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

// --- Components ---

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b bg-slate-50 sticky top-0 z-10">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

const SortableHeader = ({ label, sortKey, currentSort, onSort }: { label: string, sortKey: string, currentSort: SortConfig, onSort: (key: string) => void }) => {
  const isActive = currentSort.key === sortKey;
  return (
    <th 
      className="p-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className={cn("w-3 h-3 transition-opacity", isActive ? "opacity-100 text-blue-600" : "opacity-30 group-hover:opacity-60")} />
      </div>
    </th>
  );
};

export default function BillTrackerApp() {
  // --- State ---
  const [viewDate, setViewDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"dashboard" | "calendar" | "manage">("dashboard");
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("");
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Edit State
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editingInst, setEditingInst] = useState<Installment | null>(null);

  // Installment Form State
  const [instMode, setInstMode] = useState<'date' | 'term'>('date');
  // Temporary state for the term calculation inside the modal
  const [tempCurrentTerm, setTempCurrentTerm] = useState<number>(1);
  const [tempTerms, setTempTerms] = useState<number>(12); // Used to calculate max term

  // Sorting State
  const [dashboardSort, setDashboardSort] = useState<SortConfig>({ key: 'dueDate', direction: 'asc' });
  const [manageCardSort, setManageCardSort] = useState<SortConfig>({ key: 'bankName', direction: 'asc' });
  const [manageInstSort, setManageInstSort] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [showCardModal, setShowCardModal] = useState(false);
  const [showInstModal, setShowInstModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // --- Effects ---
  useEffect(() => {
    // 1. Load Profiles
    let loadedProfiles = Storage.getProfiles();
    let initialProfileId = "";

    if (loadedProfiles.length === 0) {
      const defaultProfile = { id: crypto.randomUUID(), name: "My Profile" };
      loadedProfiles = [defaultProfile];
      Storage.saveProfiles(loadedProfiles);
      initialProfileId = defaultProfile.id;
    } else {
      initialProfileId = loadedProfiles[0].id;
    }

    setProfiles(loadedProfiles);
    setActiveProfileId(initialProfileId);

    // 2. Load Data
    const loadedCards = Storage.getCards();
    let cardsChanged = false;
    
    // Migrate old cards
    const migratedCards = loadedCards.map(c => {
      if (!c.profileId) {
        cardsChanged = true;
        return { ...c, profileId: initialProfileId };
      }
      return c;
    });

    if (cardsChanged) {
      Storage.saveCards(migratedCards);
    }

    setCards(migratedCards);
    setStatements(Storage.getStatements());
    setInstallments(Storage.getInstallments());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      Storage.saveProfiles(profiles);
      Storage.saveCards(cards);
      Storage.saveStatements(statements);
      Storage.saveInstallments(installments);
    }
  }, [profiles, cards, statements, installments, isLoaded]);

  // --- Computed Data ---
  
  const activeCards = useMemo(() => {
    return cards.filter(c => c.profileId === activeProfileId);
  }, [cards, activeProfileId]);

  const monthKey = format(viewDate, "yyyy-MM");

  const monthlyStatements = useMemo(() => {
    return statements.filter(s => s.monthStr === monthKey);
  }, [statements, monthKey]);

  const activeInstallments = useMemo(() => {
    return installments.map(inst => ({
      ...inst,
      status: getInstallmentStatus(inst, viewDate)
    })).filter(i => i.status.isActive);
  }, [installments, viewDate]);

  const getCardInstallmentTotal = (cardId: string) => {
    return activeInstallments
      .filter(i => i.cardId === cardId)
      .reduce((acc, i) => acc + i.monthlyAmortization, 0);
  };

  const totals = useMemo(() => {
    const activeCardIds = new Set(activeCards.map(c => c.id));
    const visibleInstallments = activeInstallments.filter(i => activeCardIds.has(i.cardId));
    
    const installmentTotal = visibleInstallments.reduce((acc, i) => acc + i.monthlyAmortization, 0);
    
    let billTotal = 0;
    let unpaidTotal = 0;

    activeCards.forEach(card => {
      const stmt = monthlyStatements.find(s => s.cardId === card.id);
      const cardInstTotal = visibleInstallments
        .filter(i => i.cardId === card.id)
        .reduce((acc, i) => acc + i.monthlyAmortization, 0);
        
      const effectiveAmount = stmt ? stmt.amount : cardInstTotal;
      
      billTotal += effectiveAmount;
      if (!stmt?.isPaid) {
        unpaidTotal += effectiveAmount;
      }
    });

    return { billTotal, unpaidTotal, installmentTotal };
  }, [activeCards, monthlyStatements, activeInstallments]);

  // --- Sorting Logic ---

  const handleSort = (config: SortConfig, setConfig: (c: SortConfig) => void, key: string) => {
    setConfig({
      key,
      direction: config.key === key && config.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortedDashboardData = useMemo(() => {
    const data = activeCards.map(card => {
      const stmt = monthlyStatements.find(s => s.cardId === card.id);
      const defaultDate = setDate(viewDate, card.dueDay);
      const displayDate = stmt?.customDueDate ? parseISO(stmt.customDueDate) : defaultDate;
      const cardInstTotal = getCardInstallmentTotal(card.id);
      const displayAmount = stmt ? stmt.amount : cardInstTotal;
      const isPaid = stmt?.isPaid || false;
      
      return { card, stmt, displayDate, displayAmount, isPaid, cardInstTotal };
    });

    return data.sort((a, b) => {
      const dir = dashboardSort.direction === 'asc' ? 1 : -1;
      switch (dashboardSort.key) {
        case 'bankName': return a.card.bankName.localeCompare(b.card.bankName) * dir;
        case 'dueDate': return (a.displayDate.getTime() - b.displayDate.getTime()) * dir;
        case 'amount': return (a.displayAmount - b.displayAmount) * dir;
        case 'status': return (Number(a.isPaid) - Number(b.isPaid)) * dir;
        default: return 0;
      }
    });
  }, [activeCards, monthlyStatements, viewDate, dashboardSort]);

  const sortedManageCards = useMemo(() => {
    return [...activeCards].sort((a, b) => {
      const dir = manageCardSort.direction === 'asc' ? 1 : -1;
      switch(manageCardSort.key) {
        case 'bankName': return a.bankName.localeCompare(b.bankName) * dir;
        case 'cardName': return a.cardName.localeCompare(b.cardName) * dir;
        case 'dueDay': return (a.dueDay - b.dueDay) * dir;
        case 'cutoffDay': return (a.cutoffDay - b.cutoffDay) * dir;
        default: return 0;
      }
    });
  }, [activeCards, manageCardSort]);

  const sortedManageInstallments = useMemo(() => {
    const profileInstallments = installments.filter(inst => activeCards.find(c => c.id === inst.cardId));
    
    return profileInstallments.sort((a, b) => {
      const dir = manageInstSort.direction === 'asc' ? 1 : -1;
      const cardA = activeCards.find(c => c.id === a.cardId)?.bankName || '';
      const cardB = activeCards.find(c => c.id === b.cardId)?.bankName || '';

      switch(manageInstSort.key) {
        case 'name': return a.name.localeCompare(b.name) * dir;
        case 'card': return cardA.localeCompare(cardB) * dir;
        case 'monthly': return (a.monthlyAmortization - b.monthlyAmortization) * dir;
        case 'progress': 
          const statA = getInstallmentStatus(a, viewDate).currentTerm;
          const statB = getInstallmentStatus(b, viewDate).currentTerm;
          return (statA - statB) * dir;
        default: return 0;
      }
    });
  }, [installments, activeCards, manageInstSort, viewDate]);

  // --- Handlers ---

  const handleUpdateStatement = (cardId: string, updates: Partial<Statement>) => {
    setStatements(prev => {
      const existing = prev.find(s => s.cardId === cardId && s.monthStr === monthKey);
      if (existing) {
        return prev.map(s => s.id === existing.id ? { ...s, ...updates } : s);
      }
      
      const cardInstTotal = installments
        .filter(i => i.cardId === cardId && getInstallmentStatus(i, viewDate).isActive)
        .reduce((acc, i) => acc + i.monthlyAmortization, 0);

      return [...prev, {
        id: crypto.randomUUID(),
        cardId,
        monthStr: monthKey,
        amount: updates.amount !== undefined ? updates.amount : cardInstTotal,
        isPaid: false,
        ...updates
      }];
    });
  };

  const togglePaid = (cardId: string) => {
    setStatements(prev => {
      const existing = prev.find(s => s.cardId === cardId && s.monthStr === monthKey);
      if (existing) {
        return prev.map(s => s.id === existing.id ? { ...s, isPaid: !s.isPaid } : s);
      }
      
      const cardInstTotal = installments
        .filter(i => i.cardId === cardId && getInstallmentStatus(i, viewDate).isActive)
        .reduce((acc, i) => acc + i.monthlyAmortization, 0);

      return [...prev, {
        id: crypto.randomUUID(),
        cardId,
        monthStr: monthKey,
        amount: cardInstTotal,
        isPaid: true
      }];
    });
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const cardData = {
      bankName: formData.get("bankName") as string,
      cardName: formData.get("cardName") as string,
      dueDay: parseInt(formData.get("dueDay") as string),
      cutoffDay: parseInt(formData.get("cutoffDay") as string),
      color: formData.get("color") as string,
    };

    if (editingCard) {
      setCards(prev => prev.map(c => c.id === editingCard.id ? { ...c, ...cardData } : c));
    } else {
      const newCard: CreditCard = {
        id: crypto.randomUUID(),
        profileId: activeProfileId,
        ...cardData
      };
      setCards(prev => [...prev, newCard]);
    }
    setShowCardModal(false);
    setEditingCard(null);
    form.reset();
  };

  const handleSaveInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const principal = parseFloat(formData.get("principal") as string);
    const terms = parseInt(formData.get("terms") as string);
    const customMonthly = parseFloat(formData.get("monthlyAmortization") as string);

    // Calculate Start Date logic
    let calculatedStartDate = formData.get("startDate") as string;
    
    if (instMode === 'term') {
      const currentTermInput = parseInt(formData.get("currentTerm") as string) || 1;
      // Term 1 is the start month. Term 2 is 1 month later.
      // So subtract (currentTerm - 1) months from viewDate
      const backDate = subMonths(viewDate, currentTermInput - 1);
      calculatedStartDate = format(backDate, "yyyy-MM-dd");
    }

    const instData = {
      cardId: formData.get("cardId") as string,
      name: formData.get("name") as string,
      totalPrincipal: principal,
      terms: terms,
      monthlyAmortization: customMonthly || (principal / terms),
      startDate: calculatedStartDate,
    };

    if (editingInst) {
      setInstallments(prev => prev.map(i => i.id === editingInst.id ? { ...i, ...instData } : i));
    } else {
      const newInst: Installment = {
        id: crypto.randomUUID(),
        ...instData
      };
      setInstallments(prev => [...prev, newInst]);
    }
    
    setShowInstModal(false);
    setEditingInst(null);
    form.reset();
  };

  const openAddCard = () => {
    setEditingCard(null);
    setShowCardModal(true);
  };

  const openEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setShowCardModal(true);
  };

  const openAddInst = () => {
    setEditingInst(null);
    setInstMode('date');
    setTempCurrentTerm(1);
    setTempTerms(12);
    setShowInstModal(true);
  };

  const openEditInst = (inst: Installment) => {
    setEditingInst(inst);
    // When editing an existing installment, default to date mode, but pre-fill data.
    setInstMode('date'); 
    setTempCurrentTerm(getInstallmentStatus(inst, viewDate).currentTerm);
    setTempTerms(inst.terms);
    setShowInstModal(true);
  };

  const addProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const newProfile = {
      id: crypto.randomUUID(),
      name: formData.get("profileName") as string,
    };
    setProfiles([...profiles, newProfile]);
    setActiveProfileId(newProfile.id);
    setShowProfileModal(false);
    form.reset();
  };

  const deleteCard = (id: string) => {
    if(confirm("Delete this card and all its history?")) {
      setCards(cards.filter(c => c.id !== id));
      setStatements(statements.filter(s => s.cardId !== id));
      setInstallments(installments.filter(i => i.cardId !== id));
    }
  };

  const deleteInstallment = (id: string) => {
    if(confirm("Delete this installment?")) {
      setInstallments(installments.filter(i => i.id !== id));
    }
  };

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

        if (!data.profile || !Array.isArray(data.cards)) {
          throw new Error("Invalid file format.");
        }

        const importedProfile = data.profile;
        const existingProfileIndex = profiles.findIndex(p => p.id === importedProfile.id);

        let newProfiles = [...profiles];
        if (existingProfileIndex >= 0) {
          if (!confirm(`Profile "${importedProfile.name}" already exists. Overwrite?`)) return;
          newProfiles[existingProfileIndex] = importedProfile;
        } else {
          newProfiles.push(importedProfile);
        }

        const oldCardIds = cards.filter(c => c.profileId === importedProfile.id).map(c => c.id);
        const cleanCards = cards.filter(c => c.profileId !== importedProfile.id);
        const cleanStatements = statements.filter(s => !oldCardIds.includes(s.cardId));
        const cleanInstallments = installments.filter(i => !oldCardIds.includes(i.cardId));

        setProfiles(newProfiles);
        setCards([...cleanCards, ...data.cards]);
        setStatements([...cleanStatements, ...(data.statements || [])]);
        setInstallments([...cleanInstallments, ...(data.installments || [])]);
        setActiveProfileId(importedProfile.id);
        
        alert("Profile imported successfully!");
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
    const headers = ["Card", "Bank", "Due Date", "Amount", "Status", "Installments Included"];
    const rows = activeCards.map(card => {
      const stmt = monthlyStatements.find(s => s.cardId === card.id);
      
      const defaultDate = setDate(viewDate, card.dueDay);
      const displayDate = stmt?.customDueDate ? parseISO(stmt.customDueDate) : defaultDate;
      const formattedDate = isValid(displayDate) ? format(displayDate, "yyyy-MM-dd") : "";

      const cardInstTotal = getCardInstallmentTotal(card.id);
      const displayAmount = stmt ? stmt.amount : cardInstTotal;
      const status = stmt?.isPaid ? "Paid" : "Unpaid";

      return [
        `"${card.cardName}"`,
        `"${card.bankName}"`,
        formattedDate,
        displayAmount.toFixed(2),
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
  };

  // --- Views ---

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Total Statement Balance</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">₱{formatCurrency(totals.billTotal)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Unpaid Balance</p>
          <p className="text-3xl font-bold text-rose-600 mt-2">₱{formatCurrency(totals.unpaidTotal)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Monthly Installments</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">₱{formatCurrency(totals.installmentTotal)}</p>
          <p className="text-xs text-slate-400 mt-1">Included in statements if billed</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-700">Bills for {format(viewDate, "MMMM yyyy")}</h3>
          <button 
            onClick={handleExportMonthCSV}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <SortableHeader label="Card" sortKey="bankName" currentSort={dashboardSort} onSort={(k) => handleSort(dashboardSort, setDashboardSort, k)} />
                <SortableHeader label="Due Date" sortKey="dueDate" currentSort={dashboardSort} onSort={(k) => handleSort(dashboardSort, setDashboardSort, k)} />
                <SortableHeader label="Statement Balance" sortKey="amount" currentSort={dashboardSort} onSort={(k) => handleSort(dashboardSort, setDashboardSort, k)} />
                <th className="p-4 w-1/4">Active Installments</th>
                <SortableHeader label="Status" sortKey="status" currentSort={dashboardSort} onSort={(k) => handleSort(dashboardSort, setDashboardSort, k)} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedDashboardData.map(({ card, stmt, displayDate, displayAmount, cardInstTotal }) => {
                const cardInsts = activeInstallments.filter(i => i.cardId === card.id);
                
                return (
                  <tr key={card.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-7 rounded-md shadow-sm flex items-center justify-center text-[10px] text-white font-bold tracking-wider"
                          style={{ backgroundColor: card.color || '#334155' }}
                        >
                          {card.bankName.substring(0, 3)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{card.cardName}</p>
                          <p className="text-xs text-slate-500">{card.bankName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <input 
                          type="date"
                          className="bg-transparent border-none p-0 text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer w-32"
                          value={isValid(displayDate) ? format(displayDate, "yyyy-MM-dd") : ""}
                          onChange={(e) => handleUpdateStatement(card.id, { customDueDate: e.target.value })}
                        />
                        <span className="text-[10px] text-slate-400">Cut-off: {card.cutoffDay}th</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="relative max-w-[140px]">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₱</span>
                        <input 
                          type="number" 
                          step="0.01"
                          className="w-full pl-6 pr-2 py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg text-sm transition-all font-medium text-slate-800"
                          placeholder="0.00"
                          value={displayAmount || ""}
                          onChange={(e) => handleUpdateStatement(card.id, { amount: parseFloat(e.target.value) || 0 })}
                          onBlur={(e) => {
                             // Optional: format on blur if needed, currently raw input
                          }}
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {cardInsts.map(inst => (
                          <div key={inst.id} className="flex items-center justify-between text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                            <span className="truncate max-w-[100px] font-medium">{inst.name}</span>
                            <span className="opacity-75 font-mono">{inst.status.currentTerm}/{inst.terms}</span>
                          </div>
                        ))}
                        {cardInsts.length === 0 && <span className="text-slate-300 text-xs italic">None</span>}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => togglePaid(card.id)}
                        title="Toggle Paid Status"
                        className={cn(
                          "p-2 rounded-full transition-all duration-200",
                          stmt?.isPaid 
                            ? "text-green-600 bg-green-100 hover:bg-green-200" 
                            : "text-slate-300 bg-slate-100 hover:bg-slate-200 hover:text-slate-500"
                        )}
                      >
                        {stmt?.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {activeCards.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No cards found for this profile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => {
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
            
            const cardsDue = activeCards.filter(c => {
              const stmt = monthlyStatements.find(s => s.cardId === c.id);
              let targetDate = setDate(viewDate, c.dueDay);
              
              if (stmt?.customDueDate) {
                targetDate = parseISO(stmt.customDueDate);
              }
              
              return isSameDay(targetDate, day);
            });
            
            return (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "aspect-square min-h-[100px] border rounded-xl p-2 flex flex-col gap-1 transition-all hover:border-blue-300 hover:shadow-md",
                  isToday ? "bg-blue-50/50 border-blue-200" : "bg-white border-slate-100"
                )}
              >
                <span className={cn(
                  "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1",
                  isToday ? "bg-blue-600 text-white" : "text-slate-400"
                )}>
                  {dayNum}
                </span>
                
                <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
                  {cardsDue.map(c => {
                    const stmt = monthlyStatements.find(s => s.cardId === c.id);
                    const paid = stmt?.isPaid;
                    const amount = stmt ? stmt.amount : getCardInstallmentTotal(c.id);
                    
                    return (
                      <div 
                        key={c.id} 
                        className={cn(
                          "text-[10px] px-1.5 py-1 rounded border-l-2 flex flex-col",
                          paid ? "bg-green-50 text-green-700 border-green-500 opacity-60" : "bg-slate-100 text-slate-700 border-slate-500"
                        )}
                        title={`${c.bankName} - ${c.cardName}`}
                      >
                        <span className="font-semibold truncate">{c.bankName}</span>
                        <span className="font-mono">
                          {amount > 0 ? `₱${formatCurrency(amount)}` : "₱-"}
                        </span>
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
  };

  const renderManage = () => (
    <div className="space-y-8">
      <div className="bg-slate-900 text-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Data Management
          </h2>
          <p className="text-slate-400 text-sm mt-1">Backup, restore, or move your profile data.</p>
        </div>
        <div className="flex items-center gap-3">
           <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".json" 
            onChange={handleImportProfile}
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Upload className="w-4 h-4" /> Import Profile (JSON)
          </button>
          <button 
            onClick={handleExportProfile}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-900/50"
          >
            <Download className="w-4 h-4" /> Export Profile (JSON)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CardIcon className="w-5 h-5" /> Cards ({profiles.find(p => p.id === activeProfileId)?.name})
            </h2>
             <div className="flex gap-2 text-xs text-slate-500">
               <button onClick={() => handleSort(manageCardSort, setManageCardSort, 'bankName')} className={cn("hover:text-blue-600", manageCardSort.key === 'bankName' && "text-blue-600 font-bold")}>Name</button>
               <button onClick={() => handleSort(manageCardSort, setManageCardSort, 'dueDay')} className={cn("hover:text-blue-600", manageCardSort.key === 'dueDay' && "text-blue-600 font-bold")}>Due Day</button>
             </div>
          </div>
         
          <button 
            onClick={openAddCard}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
          >
            <Plus className="w-4 h-4" /> Add Card
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedManageCards.map(card => (
            <div key={card.id} className="relative group bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-all">
               <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                 <button onClick={() => openEditCard(card)} className="text-slate-400 hover:text-blue-500">
                   <Pencil className="w-4 h-4" />
                 </button>
                 <button onClick={() => deleteCard(card.id)} className="text-slate-400 hover:text-rose-500">
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-12 h-8 rounded-md shadow-sm"
                  style={{ backgroundColor: card.color || '#334155' }}
                />
                <div>
                  <h3 className="font-bold text-slate-800">{card.bankName}</h3>
                  <p className="text-xs text-slate-500">{card.cardName}</p>
                </div>
              </div>
              <div className="flex justify-between text-sm text-slate-600 border-t border-slate-200 pt-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Due Day</span>
                  <span className="font-semibold">{card.dueDay}th</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cut-off</span>
                  <span className="font-semibold">{card.cutoffDay}th</span>
                </div>
              </div>
            </div>
          ))}
          {activeCards.length === 0 && <p className="col-span-3 text-center text-slate-400 py-4">No cards found for this profile.</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ListIcon className="w-5 h-5" /> All Installments
          </h2>
          <button 
            onClick={openAddInst}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
          >
            <Plus className="w-4 h-4" /> Add Installment
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <SortableHeader label="Item" sortKey="name" currentSort={manageInstSort} onSort={(k) => handleSort(manageInstSort, setManageInstSort, k)} />
                <SortableHeader label="Card" sortKey="card" currentSort={manageInstSort} onSort={(k) => handleSort(manageInstSort, setManageInstSort, k)} />
                <SortableHeader label="Progress" sortKey="progress" currentSort={manageInstSort} onSort={(k) => handleSort(manageInstSort, setManageInstSort, k)} />
                <SortableHeader label="Monthly" sortKey="monthly" currentSort={manageInstSort} onSort={(k) => handleSort(manageInstSort, setManageInstSort, k)} />
                <th className="p-3 text-right rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedManageInstallments.map(inst => {
                  const card = activeCards.find(c => c.id === inst.cardId);
                  const status = getInstallmentStatus(inst, viewDate);
                  return (
                    <tr key={inst.id} className="hover:bg-slate-50 group">
                      <td className="p-3 font-medium text-slate-800">{inst.name}</td>
                      <td className="p-3 text-slate-600">{card?.bankName}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono w-12 text-right">{status.currentTerm > inst.terms ? "Done" : status.currentTerm < 1 ? "Pending" : `${status.currentTerm}/${inst.terms}`}</span>
                          {status.isActive && (
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full" 
                                style={{ width: `${(status.currentTerm / inst.terms) * 100}%`}}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">₱{formatCurrency(inst.monthlyAmortization)}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                           <button onClick={() => openEditInst(inst)} className="text-slate-400 hover:text-blue-500">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteInstallment(inst.id)} className="text-slate-400 hover:text-rose-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
              })}
              {sortedManageInstallments.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400">No installments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // --- Main Render ---

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <CardIcon className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">BillTracker</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition text-slate-500">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold w-28 text-center text-slate-700 select-none">
                {format(viewDate, "MMMM yyyy")}
              </span>
              <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition text-slate-500">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs text-slate-500 font-medium">Profile</p>
                  <p className="text-sm font-bold leading-none text-slate-800">{profiles.find(p => p.id === activeProfileId)?.name}</p>
                </div>
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 hidden group-hover:block p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                {profiles.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setActiveProfileId(p.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-lg mb-1 flex items-center justify-between",
                      activeProfileId === p.id ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    {p.name}
                    {activeProfileId === p.id && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                ))}
                <div className="h-px bg-slate-100 my-1" />
                <button 
                  onClick={() => setShowProfileModal(true)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                >
                  <UserPlus className="w-3 h-3" /> Create Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 mt-6 mb-6">
        <div className="flex gap-1 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === "dashboard" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700")}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("calendar")}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === "calendar" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700")}
          >
            Calendar
          </button>
          <button 
            onClick={() => setActiveTab("manage")}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === "manage" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700")}
          >
            Manage
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "calendar" && renderCalendar()}
        {activeTab === "manage" && renderManage()}
      </main>

      {/* --- MODALS --- */}

      <Modal isOpen={showCardModal} onClose={() => setShowCardModal(false)} title={editingCard ? "Edit Card" : "Add New Card"}>
        <form onSubmit={handleSaveCard} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bank Name</label>
              <input 
                required 
                name="bankName" 
                defaultValue={editingCard?.bankName} 
                placeholder="e.g. BPI" 
                className="w-full p-2 border rounded-lg text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Card Name</label>
              <input 
                required 
                name="cardName" 
                defaultValue={editingCard?.cardName} 
                placeholder="e.g. Gold Rewards" 
                className="w-full p-2 border rounded-lg text-sm" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Due Day (1-31)</label>
              <input 
                required 
                type="number" 
                min="1" 
                max="31" 
                name="dueDay" 
                defaultValue={editingCard?.dueDay} 
                className="w-full p-2 border rounded-lg text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cut-off Day</label>
              <input 
                required 
                type="number" 
                min="1" 
                max="31" 
                name="cutoffDay" 
                defaultValue={editingCard?.cutoffDay} 
                className="w-full p-2 border rounded-lg text-sm" 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Color Identifier</label>
            <input 
              type="color" 
              name="color" 
              defaultValue={editingCard?.color || "#334155"} 
              className="w-full h-10 p-1 border rounded-lg cursor-pointer" 
            />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800">
            {editingCard ? "Update Card" : "Save Card"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={showInstModal} onClose={() => setShowInstModal(false)} title={editingInst ? "Edit Installment" : "Add Installment"}>
        <form onSubmit={handleSaveInstallment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Item/Purchase Name</label>
            <input 
              required 
              name="name" 
              defaultValue={editingInst?.name} 
              placeholder="e.g. New Laptop" 
              className="w-full p-2 border rounded-lg text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Charge to Card</label>
            <select 
              name="cardId" 
              required 
              defaultValue={editingInst?.cardId} 
              className="w-full p-2 border rounded-lg text-sm bg-white"
            >
              {activeCards.map(c => <option key={c.id} value={c.id}>{c.bankName} - {c.cardName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Principal Amount</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                name="principal" 
                defaultValue={editingInst?.totalPrincipal} 
                className="w-full p-2 border rounded-lg text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Terms (Months)</label>
              <input 
                required 
                type="number" 
                name="terms" 
                min="1"
                defaultValue={editingInst?.terms || tempTerms} 
                onChange={(e) => setTempTerms(parseInt(e.target.value))}
                placeholder="12, 24, 36" 
                className="w-full p-2 border rounded-lg text-sm" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Amortization (Override)</label>
            <input 
              type="number" 
              step="0.01" 
              name="monthlyAmortization" 
              defaultValue={editingInst?.monthlyAmortization} 
              placeholder="Leave blank to auto-calculate" 
              className="w-full p-2 border rounded-lg text-sm" 
            />
            <p className="text-[10px] text-slate-400 mt-1">Enter exact bank amount including interest if different from simple division.</p>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">How to Determine Start Date?</h4>
            <div className="flex space-x-2 mb-4">
              <button 
                type="button"
                onClick={() => setInstMode('date')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm transition-colors",
                  instMode === 'date' ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                <Calendar className="w-4 h-4" /> Set Start Date
              </button>
              <button 
                type="button"
                onClick={() => setInstMode('term')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm transition-colors",
                  instMode === 'term' ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                <Calculator className="w-4 h-4" /> Set Current Term
              </button>
            </div>
          </div>
          
          {instMode === 'date' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Start Date (First Payment Month)</label>
              <input 
                required 
                type="date" 
                name="startDate" 
                defaultValue={editingInst?.startDate} 
                className="w-full p-2 border rounded-lg text-sm" 
              />
            </div>
          )}

          {instMode === 'term' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Current Term (Month # for {format(viewDate, "MMMM yyyy")})</label>
              <input 
                required 
                type="number" 
                min="1"
                max={tempTerms}
                name="currentTerm" 
                value={tempCurrentTerm}
                onChange={(e) => setTempCurrentTerm(parseInt(e.target.value) || 1)}
                placeholder="e.g. 12" 
                className="w-full p-2 border rounded-lg text-sm" 
              />
              <input type="hidden" name="startDate" />
              {tempCurrentTerm > 0 && tempCurrentTerm <= tempTerms && (
                <p className="text-xs text-slate-500 mt-2 p-2 bg-blue-50 rounded-lg">
                  <span className="font-medium">Calculated Start Date:</span> 
                  {format(subMonths(viewDate, tempCurrentTerm - 1), "MMMM yyyy")}
                  <span className="text-slate-400"> (Term 1)</span>
                </p>
              )}
            </div>
          )}

          <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800">
            {editingInst ? "Update Installment" : "Add Installment"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="Create New Profile">
        <form onSubmit={addProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Profile Name</label>
            <input required name="profileName" placeholder="e.g. Spouse" className="w-full p-2 border rounded-lg text-sm" />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800">Create Profile</button>
        </form>
      </Modal>
    </div>
  );
}