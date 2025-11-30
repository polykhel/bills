import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInCalendarMonths, parseISO, startOfMonth } from 'date-fns';
import type { Installment, InstallmentStatus } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInstallmentStatus = (
  installment: Installment,
  viewDate: Date
): InstallmentStatus => {
  const start = parseISO(installment.startDate);
  const currentMonth = startOfMonth(viewDate);
  const startMonth = startOfMonth(start);

  const diff = differenceInCalendarMonths(currentMonth, startMonth);
  const currentTerm = diff + 1;

  const isActive = currentTerm >= 1 && currentTerm <= installment.terms;
  const isFinished = currentTerm > installment.terms;
  const isUpcoming = currentTerm < 1;

  return {
    currentTerm,
    totalTerms: installment.terms,
    monthlyAmount: installment.monthlyAmortization,
    isActive,
    isFinished,
    isUpcoming,
  };
};

export const formatCurrency = (amount: number) => {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
