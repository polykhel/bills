/**
 * Utility functions for sync operations
 */

import { Storage } from './storage';

/**
 * Get a timestamp of the last local data modification
 * This is used to determine if local or cloud data is newer
 */
export function getLastModifiedTimestamp(): string {
  const lastSync = localStorage.getItem('bt_last_sync');
  if (lastSync) {
    return lastSync;
  }

  // If no sync timestamp, use current time
  const now = new Date().toISOString();
  localStorage.setItem('bt_last_sync', now);
  return now;
}

/**
 * Update the last sync timestamp
 */
export function updateLastSyncTimestamp(): void {
  localStorage.setItem('bt_last_sync', new Date().toISOString());
}

/**
 * Check if data exists (for first-time setup detection)
 */
export function hasLocalData(): boolean {
  const profiles = Storage.getProfiles();
  const cards = Storage.getCards();
  const statements = Storage.getStatements();
  const installments = Storage.getInstallments();
  const cashInstallments = Storage.getCashInstallments();
  const oneTimeBills = Storage.getOneTimeBills();

  return (
    profiles.length > 0 ||
    cards.length > 0 ||
    statements.length > 0 ||
    installments.length > 0 ||
    cashInstallments.length > 0 ||
    oneTimeBills.length > 0
  );
}

/**
 * Get data size in bytes (approximate)
 */
export function getDataSize(): number {
  const data = {
    profiles: Storage.getProfiles(),
    cards: Storage.getCards(),
    statements: Storage.getStatements(),
    installments: Storage.getInstallments(),
    cashInstallments: Storage.getCashInstallments(),
    oneTimeBills: Storage.getOneTimeBills(),
  };

  return new Blob([JSON.stringify(data)]).size;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate password strength
 * Returns array of validation messages
 */
export function validatePassword(password: string): string[] {
  const issues: string[] = [];

  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('Password should contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    issues.push('Password should contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    issues.push('Password should contain at least one number');
  }

  return issues;
}

/**
 * Get password strength level
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  const issues = validatePassword(password);

  if (issues.length >= 3) return 'weak';
  if (issues.length >= 1) return 'medium';
  return 'strong';
}

/**
 * Generate a random password
 */
export function generatePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  return password;
}

/**
 * Clear all sync-related data
 */
export function clearSyncData(): void {
  localStorage.removeItem('bt_last_sync');
  localStorage.removeItem('bt_sync_password');
  localStorage.removeItem('bt_auto_sync');
}
