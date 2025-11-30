import type { Profile, CreditCard, Statement, Installment } from './types';

const KEYS = {
  PROFILES: 'bt_profiles',
  CARDS: 'bt_cards',
  STATEMENTS: 'bt_statements',
  INSTALLMENTS: 'bt_installments',
};

export const loadData = <T,>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error('Error loading data from key:', key, e);
    return [];
  }
};

export const saveData = <T,>(key: string, data: T[]) => {
  if (typeof window === 'undefined') return;
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

export { KEYS };
