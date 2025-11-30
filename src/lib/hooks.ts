import { useState, useEffect } from "react";
import { Storage } from "./storage";
import type { Profile, CreditCard, Statement, Installment } from "./types";

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
      initialProfileId = loadedProfiles[0].id;
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

  const addProfile = (name: string) => {
    const newProfile = { id: crypto.randomUUID(), name };
    setProfiles([...profiles, newProfile]);
    setActiveProfileId(newProfile.id);
  };

  return {
    profiles,
    activeProfileId,
    setActiveProfileId,
    addProfile,
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
    const newCard: CreditCard = { id: crypto.randomUUID(), ...card };
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

  const activeCards = cards.filter(c => c.profileId === activeProfileId);

  return {
    cards,
    activeCards,
    addCard,
    updateCard,
    deleteCard,
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
    const newInst: Installment = { id: crypto.randomUUID(), ...installment };
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
