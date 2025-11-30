"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { format, addMonths, subMonths, setDate, parseISO, isValid } from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle2, User, UserPlus, CreditCard as CardIcon, Calendar, Calculator } from "lucide-react";
import Modal from "../components/Modal";
import Dashboard from "../views/Dashboard";
import CalendarView from "../views/Calendar";
import ManageView from "../views/Manage";
import { cn, getInstallmentStatus } from "../lib/utils";
import { Storage } from "../lib/storage";
import type { Profile, CreditCard, Statement, Installment, SortConfig } from "../lib/types";

export default function BillTrackerApp() {
  const [viewDate, setViewDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"dashboard" | "calendar" | "manage">("dashboard");

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("");
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editingInst, setEditingInst] = useState<Installment | null>(null);

  const [instMode, setInstMode] = useState<'date' | 'term'>('date');
  const [tempCurrentTerm, setTempCurrentTerm] = useState<number>(1);
  const [tempTerms, setTempTerms] = useState<number>(12);

  const [dashboardSort, setDashboardSort] = useState<SortConfig>({ key: 'dueDate', direction: 'asc' });
  const [manageCardSort, setManageCardSort] = useState<SortConfig>({ key: 'bankName', direction: 'asc' });
  const [manageInstSort, setManageInstSort] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCardModal, setShowCardModal] = useState(false);
  const [showInstModal, setShowInstModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
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

    const loadedCards = Storage.getCards();
    let cardsChanged = false;
    const migratedCards = loadedCards.map(c => {
      if (!c.profileId) {
        cardsChanged = true;
        return { ...c, profileId: initialProfileId };
      }
      return c;
    });
    if (cardsChanged) Storage.saveCards(migratedCards);
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

  const activeCards = useMemo(() => cards.filter(c => c.profileId === activeProfileId), [cards, activeProfileId]);
  const monthKey = format(viewDate, "yyyy-MM");
  const monthlyStatements = useMemo(() => statements.filter(s => s.monthStr === monthKey), [statements, monthKey]);
  const activeInstallments = useMemo(() => installments.map(inst => ({ ...inst, status: getInstallmentStatus(inst, viewDate) })).filter(i => i.status.isActive), [installments, viewDate]);

  const getCardInstallmentTotal = (cardId: string) => activeInstallments.filter(i => i.cardId === cardId).reduce((acc, i) => acc + i.monthlyAmortization, 0);

  const totals = useMemo(() => {
    const activeCardIds = new Set(activeCards.map(c => c.id));
    const visibleInstallments = activeInstallments.filter(i => activeCardIds.has(i.cardId));
    const installmentTotal = visibleInstallments.reduce((acc, i) => acc + i.monthlyAmortization, 0);
    let billTotal = 0;
    let unpaidTotal = 0;
    activeCards.forEach(card => {
      const stmt = monthlyStatements.find(s => s.cardId === card.id);
      const cardInstTotal = visibleInstallments.filter(i => i.cardId === card.id).reduce((acc, i) => acc + i.monthlyAmortization, 0);
      const effectiveAmount = stmt ? stmt.amount : cardInstTotal;
      billTotal += effectiveAmount;
      if (!stmt?.isPaid) unpaidTotal += effectiveAmount;
    });
    return { billTotal, unpaidTotal, installmentTotal };
  }, [activeCards, monthlyStatements, activeInstallments]);

  const handleUpdateStatement = (cardId: string, updates: Partial<Statement>) => {
    setStatements(prev => {
      const existing = prev.find(s => s.cardId === cardId && s.monthStr === monthKey);
      if (existing) {
        return prev.map(s => s.id === existing.id ? { ...s, ...updates } : s);
      }
      const cardInstTotal = installments.filter(i => i.cardId === cardId && getInstallmentStatus(i, viewDate).isActive).reduce((acc, i) => acc + i.monthlyAmortization, 0);
      return [...prev, { id: crypto.randomUUID(), cardId, monthStr: monthKey, amount: updates.amount !== undefined ? updates.amount : cardInstTotal, isPaid: false, isUnbilled: true, ...updates }];
    });
  };

  const togglePaid = (cardId: string) => {
    setStatements(prev => {
      const existing = prev.find(s => s.cardId === cardId && s.monthStr === monthKey);
      if (existing) {
        return prev.map(s => s.id === existing.id ? { ...s, isPaid: !s.isPaid } : s);
      }
      const cardInstTotal = installments.filter(i => i.cardId === cardId && getInstallmentStatus(i, viewDate).isActive).reduce((acc, i) => acc + i.monthlyAmortization, 0);
      return [...prev, { id: crypto.randomUUID(), cardId, monthStr: monthKey, amount: cardInstTotal, isPaid: true, isUnbilled: true }];
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
      const newCard: CreditCard = { id: crypto.randomUUID(), profileId: activeProfileId, ...cardData };
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
    let calculatedStartDate = formData.get("startDate") as string;
    if (instMode === 'term') {
      const currentTermInput = parseInt(formData.get("currentTerm") as string) || 1;
      const backDate = subMonths(viewDate, currentTermInput - 1);
      calculatedStartDate = format(backDate, "yyyy-MM-dd");
    }
    const instData = { cardId: formData.get("cardId") as string, name: formData.get("name") as string, totalPrincipal: principal, terms: terms, monthlyAmortization: customMonthly || (principal / terms), startDate: calculatedStartDate };
    if (editingInst) {
      setInstallments(prev => prev.map(i => i.id === editingInst.id ? { ...i, ...instData } : i));
    } else {
      const newInst: Installment = { id: crypto.randomUUID(), ...instData };
      setInstallments(prev => [...prev, newInst]);
    }
    setShowInstModal(false);
    setEditingInst(null);
    form.reset();
  };

  const openAddCard = () => { setEditingCard(null); setShowCardModal(true); };
  const openEditCard = (card: CreditCard) => { setEditingCard(card); setShowCardModal(true); };
  const openAddInst = () => { setEditingInst(null); setInstMode('date'); setTempCurrentTerm(1); setTempTerms(12); setShowInstModal(true); };
  const openEditInst = (inst: Installment) => { setEditingInst(inst); setInstMode('date'); setTempCurrentTerm(getInstallmentStatus(inst, viewDate).currentTerm); setTempTerms(inst.terms); setShowInstModal(true); };

  const addProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const newProfile = { id: crypto.randomUUID(), name: formData.get("profileName") as string };
    setProfiles([...profiles, newProfile]);
    setActiveProfileId(newProfile.id);
    setShowProfileModal(false);
    form.reset();
  };

  const deleteCard = (id: string) => {
    if (confirm("Delete this card and all its history?")) {
      setCards(cards.filter(c => c.id !== id));
      setStatements(statements.filter(s => s.cardId !== id));
      setInstallments(installments.filter(i => i.cardId !== id));
    }
  };

  const deleteInstallment = (id: string) => {
    if (confirm("Delete this installment?")) {
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
    const exportData = { version: 1, type: "profile-backup", profile, cards: exportCards, statements: exportStatements, installments: exportInstallments };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bill-tracker-${profile.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);
        if (!data.profile || !Array.isArray(data.cards)) throw new Error("Invalid file format.");
        const importedProfile = data.profile;
        const existingProfileIndex = profiles.findIndex(p => p.id === importedProfile.id);
        let newProfiles = [...profiles];
        if (existingProfileIndex >= 0) {
          if (!confirm(`Profile \"${importedProfile.name}\" already exists. Overwrite?`)) return;
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
        `\"${card.cardName}\"`,
        `\"${card.bankName}\"`,
        formattedDate,
        displayAmount.toFixed(2),
        status,
        cardInstTotal.toFixed(2)
      ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `bills-${monthKey}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
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
                <span className="text-sm font-semibold w-28 text-center text-slate-700 select-none">{format(viewDate, "MMMM yyyy")}</span>
                <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition text-slate-500">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="relative group">
                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center"><User className="w-4 h-4" /></div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs text-slate-500 font-medium">Profile</p>
                    <p className="text-sm font-bold leading-none text-slate-800">{profiles.find(p => p.id === activeProfileId)?.name}</p>
                  </div>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 hidden group-hover:block p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {profiles.map(p => (
                    <button key={p.id} onClick={() => setActiveProfileId(p.id)} className={cn("w-full text-left px-3 py-2 text-sm rounded-lg mb-1 flex items-center justify-between", activeProfileId === p.id ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700")}>{p.name}{activeProfileId === p.id && <CheckCircle2 className="w-3 h-3" />}</button>
                  ))}
                  <div className="h-px bg-slate-100 my-1" />
                  <button onClick={() => setShowProfileModal(true)} className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg flex items-center gap-2"><UserPlus className="w-3 h-3" /> Create Profile</button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 mt-6 mb-6">
          <div className="flex gap-1 border-b border-slate-200">
            <button onClick={() => setActiveTab("dashboard")} className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === "dashboard" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700")}>Dashboard</button>
            <button onClick={() => setActiveTab("calendar")} className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === "calendar" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700")}>Calendar</button>
            <button onClick={() => setActiveTab("manage")} className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === "manage" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700")}>Manage</button>
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === "dashboard" && (
            <Dashboard
              viewDate={viewDate}
              totals={totals}
              dashboardSort={dashboardSort}
              setDashboardSort={(c) => setDashboardSort(c)}
              activeCards={activeCards}
              activeInstallments={activeInstallments as any}
              monthlyStatements={monthlyStatements}
              getCardInstallmentTotal={getCardInstallmentTotal}
              handleUpdateStatement={handleUpdateStatement}
              togglePaid={togglePaid}
              handleExportMonthCSV={handleExportMonthCSV}
            />
          )}
          {activeTab === "calendar" && (
            <CalendarView
              viewDate={viewDate}
              activeCards={activeCards}
              monthlyStatements={monthlyStatements}
              getCardInstallmentTotal={getCardInstallmentTotal}
            />
          )}
          {activeTab === "manage" && (
            <ManageView
              profilesName={profiles.find(p => p.id === activeProfileId)?.name}
              activeCards={activeCards}
              manageCardSort={manageCardSort}
              setManageCardSort={(c) => setManageCardSort(c)}
              openAddCard={openAddCard}
              openEditCard={openEditCard}
              deleteCard={deleteCard}
              installments={installments}
              viewDate={viewDate}
              manageInstSort={manageInstSort}
              setManageInstSort={(c) => setManageInstSort(c)}
              openAddInst={openAddInst}
              openEditInst={openEditInst}
              deleteInstallment={deleteInstallment}
              handleExportProfile={handleExportProfile}
              handleImportProfileClick={() => fileInputRef.current?.click()}
            />
          )}
        </main>

        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportProfile} />

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
            <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Amortization (Optional Override)</label>
            <input 
              type="number" 
              step="any" 
              name="monthlyAmortization" 
              defaultValue={editingInst?.monthlyAmortization} 
              placeholder="Leave blank to auto-calculate (Principal ÷ Terms)" 
              className="w-full p-2 border rounded-lg text-sm" 
            />
            <p className="text-[10px] text-slate-400 mt-1">Optional: Enter the exact monthly payment amount if it differs from simple division (e.g., includes interest or fees). Leave blank to auto-calculate.</p>
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