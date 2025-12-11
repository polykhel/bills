import { useState, useEffect } from "react";
import { Storage } from "./storage";
import type { Profile, CreditCard, Statement, Installment, BankBalance, CashInstallment, OneTimeBill } from "./types";

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let loadedProfiles = Storage.getProfiles();
    let initialProfileId = "";
    
    if (loadedProfiles.length === 0) {
      const defaultProfile = { id: crypto.randomUUID(), name: "My Profile" };
      loadedProfiles = [defaultProfile];
      Storage.saveProfiles(loadedProfiles);
      initialProfileId = defaultProfile.id;
    } else {
      // Try to restore last active profile
      const savedActive = Storage.getActiveProfileId();
      const exists = savedActive && loadedProfiles.some(p => p.id === savedActive);
      initialProfileId = exists ? (savedActive as string) : loadedProfiles[0].id;
    }
    
    setProfiles(loadedProfiles);
    setActiveProfileId(initialProfileId);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      Storage.saveProfiles(profiles);
    }
  }, [profiles, isLoaded]);

  useEffect(() => {
    if (isLoaded && activeProfileId) {
      Storage.saveActiveProfileId(activeProfileId);
    }
  }, [activeProfileId, isLoaded]);

  const addProfile = (name: string) => {
    const newProfile = { id: crypto.randomUUID(), name };
    setProfiles([...profiles, newProfile]);
    setActiveProfileId(newProfile.id);
  };

  const renameProfile = (profileId: string, newName: string) => {
    setProfiles(profiles.map(p => 
      p.id === profileId ? { ...p, name: newName } : p
    ));
  };

  return {
    profiles,
    activeProfileId,
    setActiveProfileId,
    addProfile,
    renameProfile,
    isLoaded,
  };
}

export function useCards(activeProfileId: string, isLoaded: boolean) {
  const [cards, setCards] = useState<CreditCard[]>([]);

  useEffect(() => {
    const loadedCards = Storage.getCards();
    let cardsChanged = false;
    
    const migratedCards = loadedCards.map(c => {
      if (!c.profileId) {
        cardsChanged = true;
        return { ...c, profileId: activeProfileId };
      }
      return c;
    });
    
    if (cardsChanged) Storage.saveCards(migratedCards);
    setCards(migratedCards);
  }, [activeProfileId]);

  useEffect(() => {
    if (isLoaded) {
      Storage.saveCards(cards);
    }
  }, [cards, isLoaded]);

  const addCard = (card: Omit<CreditCard, "id">) => {
    const newCard: CreditCard = { ...card, id: crypto.randomUUID() };
    setCards(prev => [...prev, newCard]);
  };

  const updateCard = (id: string, updates: Partial<CreditCard>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCard = (id: string) => {
    if (confirm("Delete this card and all its history?")) {
      setCards(cards.filter(c => c.id !== id));
      return true;
    }
    return false;
  };

  const transferCard = (cardId: string, targetProfileId: string) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, profileId: targetProfileId } : c));
  };

  const activeCards = cards.filter(c => c.profileId === activeProfileId);

  const getCardsForProfiles = (profileIds: string[]) => {
    return cards.filter(c => profileIds.includes(c.profileId));
  };

  return {
    cards,
    activeCards,
    addCard,
    updateCard,
    deleteCard,
    transferCard,
    getCardsForProfiles,
  };
}

export function useStatements(isLoaded: boolean) {
  const [statements, setStatements] = useState<Statement[]>([]);

  useEffect(() => {
    setStatements(Storage.getStatements());
  }, []);

  useEffect(() => {
    if (isLoaded) {
      Storage.saveStatements(statements);
    }
  }, [statements, isLoaded]);

  const updateStatement = (cardId: string, monthStr: string, updates: Partial<Statement>) => {
    setStatements(prev => {
      const existing = prev.find(s => s.cardId === cardId && s.monthStr === monthStr);
      if (existing) {
        return prev.map(s => s.id === existing.id ? { ...s, ...updates } : s);
      }
      return [...prev, { 
        id: crypto.randomUUID(), 
        cardId, 
        monthStr, 
        amount: updates.amount !== undefined ? updates.amount : 0,
        isPaid: false, 
        isUnbilled: true, 
        ...updates 
      }];
    });
  };

  const togglePaid = (cardId: string, monthStr: string, installmentTotal: number) => {
    setStatements(prev => {
      const existing = prev.find(s => s.cardId === cardId && s.monthStr === monthStr);
      if (existing) {
        const newIsPaid = !existing.isPaid;
        const updates = newIsPaid 
          ? { isPaid: newIsPaid, isUnbilled: false } 
          : { isPaid: newIsPaid };
        return prev.map(s => s.id === existing.id ? { ...s, ...updates } : s);
      }
      return [...prev, { 
        id: crypto.randomUUID(), 
        cardId, 
        monthStr, 
        amount: installmentTotal, 
        isPaid: true, 
        isUnbilled: false 
      }];
    });
  };

  const deleteStatementsForCard = (cardId: string) => {
    setStatements(prev => prev.filter(s => s.cardId !== cardId));
  };

  return {
    statements,
    updateStatement,
    togglePaid,
    deleteStatementsForCard,
  };
}

export function useInstallments(isLoaded: boolean) {
  const [installments, setInstallments] = useState<Installment[]>([]);

  useEffect(() => {
    setInstallments(Storage.getInstallments());
  }, []);

  useEffect(() => {
    if (isLoaded) {
      Storage.saveInstallments(installments);
    }
  }, [installments, isLoaded]);

  const addInstallment = (installment: Omit<Installment, "id">) => {
    const newInst: Installment = { ...installment, id: crypto.randomUUID() };
    setInstallments(prev => [...prev, newInst]);
  };

  const updateInstallment = (id: string, updates: Partial<Installment>) => {
    setInstallments(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteInstallment = (id: string) => {
    if (confirm("Delete this installment?")) {
      setInstallments(installments.filter(i => i.id !== id));
      return true;
    }
    return false;
  };

  const deleteInstallmentsForCard = (cardId: string) => {
    setInstallments(prev => prev.filter(i => i.cardId !== cardId));
  };

  return {
    installments,
    addInstallment,
    updateInstallment,
    deleteInstallment,
    deleteInstallmentsForCard,
  };
}

export function useBankBalances(isLoaded: boolean) {
  const [bankBalances, setBankBalances] = useState<BankBalance[]>([]);

  useEffect(() => {
    setBankBalances(Storage.getBankBalances());
  }, []);

  useEffect(() => {
    if (isLoaded) {
      Storage.saveBankBalances(bankBalances);
    }
  }, [bankBalances, isLoaded]);

  const updateBankBalance = (profileId: string, monthStr: string, balance: number) => {
    setBankBalances(prev => {
      const existing = prev.find(b => b.profileId === profileId && b.monthStr === monthStr);
      if (existing) {
        return prev.map(b => b.id === existing.id ? { ...b, balance } : b);
      }
      return [...prev, {
        id: crypto.randomUUID(),
        profileId,
        monthStr,
        balance,
      }];
    });
  };

  const getBankBalance = (profileId: string, monthStr: string): number => {
    const balance = bankBalances.find(b => b.profileId === profileId && b.monthStr === monthStr);
    return balance?.balance ?? 0;
  };

  const getBalancesForProfiles = (profileIds: string[], monthStr: string): number => {
    return bankBalances
      .filter(b => profileIds.includes(b.profileId) && b.monthStr === monthStr)
      .reduce((sum, b) => sum + b.balance, 0);
  };

  return {
    bankBalances,
    updateBankBalance,
    getBankBalance,
    getBalancesForProfiles,
  };
}
export function useCashInstallments(isLoaded: boolean) {
  const [cashInstallments, setCashInstallments] = useState<CashInstallment[]>([]);

  useEffect(() => {
    setCashInstallments(Storage.getCashInstallments());
  }, []);

  useEffect(() => {
    if (isLoaded) {
      Storage.saveCashInstallments(cashInstallments);
    }
  }, [cashInstallments, isLoaded]);

  const addCashInstallment = (cashInst: Omit<CashInstallment, "id">) => {
    const newInst: CashInstallment = { ...cashInst, id: crypto.randomUUID() };
    setCashInstallments(prev => [...prev, newInst]);
  };

  const updateCashInstallment = (id: string, updates: Partial<CashInstallment>) => {
    setCashInstallments(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteCashInstallment = (id: string) => {
    if (confirm("Delete this cash installment?")) {
      setCashInstallments(prev => prev.filter(i => i.id !== id));
      return true;
    }
    return false;
  };

  const deleteCashInstallmentsForCard = (cardId: string) => {
    setCashInstallments(prev => prev.filter(i => i.cardId !== cardId));
  };

  const deleteCashInstallmentsForInstallment = (installmentId: string) => {
    setCashInstallments(prev => prev.filter(i => i.installmentId !== installmentId));
  };

  const generateCashInstallments = (installment: Installment, card: CreditCard) => {
    // Generate cash installments for each term
    const newInstallments: CashInstallment[] = [];
    const startDate = new Date(installment.startDate);
    
    for (let term = 1; term <= installment.terms; term++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + (term - 1));
      
      newInstallments.push({
        id: crypto.randomUUID(),
        installmentId: installment.id,
        cardId: installment.cardId,
        term,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: installment.monthlyAmortization,
        isPaid: false,
        name: installment.name,
      });
    }
    
    setCashInstallments(prev => [...prev, ...newInstallments]);
    return newInstallments;
  };

  const toggleCashInstallmentPaid = (id: string) => {
    setCashInstallments(prev => prev.map(i => 
      i.id === id ? { ...i, isPaid: !i.isPaid } : i
    ));
  };

  return {
    cashInstallments,
    addCashInstallment,
    updateCashInstallment,
    deleteCashInstallment,
    deleteCashInstallmentsForCard,
    deleteCashInstallmentsForInstallment,
    generateCashInstallments,
    toggleCashInstallmentPaid,
  };
}

export function useOneTimeBills(isLoaded: boolean) {
  const [oneTimeBills, setOneTimeBills] = useState<OneTimeBill[]>([]);

  useEffect(() => {
    setOneTimeBills(Storage.getOneTimeBills());
  }, []);

  useEffect(() => {
    if (isLoaded) {
      Storage.saveOneTimeBills(oneTimeBills);
    }
  }, [oneTimeBills, isLoaded]);

  const addOneTimeBill = (bill: Omit<OneTimeBill, "id">) => {
    const newBill: OneTimeBill = { ...bill, id: crypto.randomUUID() };
    setOneTimeBills(prev => [...prev, newBill]);
  };

  const updateOneTimeBill = (id: string, updates: Partial<OneTimeBill>) => {
    setOneTimeBills(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteOneTimeBill = (id: string) => {
    if (confirm("Delete this one-time bill?")) {
      setOneTimeBills(prev => prev.filter(b => b.id !== id));
      return true;
    }
    return false;
  };

  const deleteOneTimeBillsForCard = (cardId: string) => {
    setOneTimeBills(prev => prev.filter(b => b.cardId !== cardId));
  };

  const toggleOneTimeBillPaid = (id: string) => {
    setOneTimeBills(prev => prev.map(b => 
      b.id === id ? { ...b, isPaid: !b.isPaid } : b
    ));
  };

  return {
    oneTimeBills,
    addOneTimeBill,
    updateOneTimeBill,
    deleteOneTimeBill,
    deleteOneTimeBillsForCard,
    toggleOneTimeBillPaid,
  };
}