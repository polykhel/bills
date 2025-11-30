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
  isUnbilled?: boolean;
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

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}
