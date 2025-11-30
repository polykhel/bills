import type { Profile, CreditCard, Statement, Installment } from './types';

const KEYS = {
  PROFILES: 'bt_profiles',
  CARDS: 'bt_cards',
  STATEMENTS: 'bt_statements',
  INSTALLMENTS: 'bt_installments',
  ACTIVE_PROFILE_ID: 'bt_active_profile_id',
  ACTIVE_MONTH: 'bt_active_month',
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

// Scalar (string) helpers for simple values
export const loadString = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error('Error loading string from key:', key, e);
    return null;
  }
};

export const saveString = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving string to key:', key, e);
  }
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

  // Active selections
  getActiveProfileId: (): string | null => loadString(KEYS.ACTIVE_PROFILE_ID),
  saveActiveProfileId: (id: string) => saveString(KEYS.ACTIVE_PROFILE_ID, id),
  getActiveMonthStr: (): string | null => loadString(KEYS.ACTIVE_MONTH),
  saveActiveMonthStr: (monthStr: string) => saveString(KEYS.ACTIVE_MONTH, monthStr),
};

export { KEYS };
