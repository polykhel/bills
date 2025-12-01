import { Encryption } from './encryption';
import { Storage, KEYS } from './storage';
import type { Profile, CreditCard, Statement, Installment } from './types';

export interface SyncData {
  version: string;
  timestamp: string;
  profiles: Profile[];
  cards: CreditCard[];
  statements: Statement[];
  installments: Installment[];
  activeProfileId: string | null;
  activeMonth: string | null;
}

export interface SyncOptions {
  password?: string;
  encrypted?: boolean;
}

export class SyncService {
  private static readonly VERSION = '1.0.0';

  /**
   * Export all data to a JSON string
   */
  static exportData(options: SyncOptions = {}): string {
    const data: SyncData = {
      version: this.VERSION,
      timestamp: new Date().toISOString(),
      profiles: Storage.getProfiles(),
      cards: Storage.getCards(),
      statements: Storage.getStatements(),
      installments: Storage.getInstallments(),
      activeProfileId: Storage.getActiveProfileId(),
      activeMonth: Storage.getActiveMonthStr(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Export encrypted data
   */
  static async exportEncrypted(password: string): Promise<string> {
    const jsonData = this.exportData();
    const encrypted = await Encryption.encrypt(jsonData, password);
    
    return JSON.stringify({
      encrypted: true,
      version: this.VERSION,
      timestamp: new Date().toISOString(),
      data: encrypted,
    }, null, 2);
  }

  /**
   * Import data from JSON string
   */
  static async importData(jsonString: string, password?: string): Promise<void> {
    let data: SyncData;

    try {
      const parsed = JSON.parse(jsonString);

      // Check if data is encrypted
      if (parsed.encrypted) {
        if (!password) {
          throw new Error('Password required for encrypted data');
        }
        const decrypted = await Encryption.decrypt(parsed.data, password);
        data = JSON.parse(decrypted);
      } else {
        data = parsed;
      }

      // Validate version
      if (!data.version || data.version !== this.VERSION) {
        console.warn('Data version mismatch. Attempting import anyway.');
      }

      // Import all data
      if (data.profiles) Storage.saveProfiles(data.profiles);
      if (data.cards) Storage.saveCards(data.cards);
      if (data.statements) Storage.saveStatements(data.statements);
      if (data.installments) Storage.saveInstallments(data.installments);
      if (data.activeProfileId) Storage.saveActiveProfileId(data.activeProfileId);
      if (data.activeMonth) Storage.saveActiveMonthStr(data.activeMonth);

    } catch (error) {
      console.error('Import failed:', error);
      throw new Error('Failed to import data. Please check the file and password.');
    }
  }

  /**
   * Download data as a file
   */
  static async downloadBackup(encrypted: boolean = true, password?: string): Promise<void> {
    let content: string;
    let filename: string;

    if (encrypted && password) {
      content = await this.exportEncrypted(password);
      filename = `bills-backup-encrypted-${Date.now()}.json`;
    } else {
      content = this.exportData();
      filename = `bills-backup-${Date.now()}.json`;
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Load data from a file
   */
  static async loadBackup(file: File, password?: string): Promise<void> {
    const content = await file.text();
    await this.importData(content, password);
  }

  /**
   * Merge imported data with existing data
   * Uses timestamps and IDs to determine conflicts
   */
  static async mergeData(jsonString: string, password?: string): Promise<void> {
    let importedData: SyncData;

    try {
      const parsed = JSON.parse(jsonString);
      
      if (parsed.encrypted) {
        if (!password) {
          throw new Error('Password required for encrypted data');
        }
        const decrypted = await Encryption.decrypt(parsed.data, password);
        importedData = JSON.parse(decrypted);
      } else {
        importedData = parsed;
      }

      // Merge profiles (keep both, user can delete duplicates)
      const existingProfiles = Storage.getProfiles();
      const newProfiles = [...existingProfiles];
      for (const profile of importedData.profiles) {
        if (!existingProfiles.find(p => p.id === profile.id)) {
          newProfiles.push(profile);
        }
      }
      Storage.saveProfiles(newProfiles);

      // Merge cards
      const existingCards = Storage.getCards();
      const newCards = [...existingCards];
      for (const card of importedData.cards) {
        if (!existingCards.find(c => c.id === card.id)) {
          newCards.push(card);
        }
      }
      Storage.saveCards(newCards);

      // Merge statements
      const existingStatements = Storage.getStatements();
      const newStatements = [...existingStatements];
      for (const statement of importedData.statements) {
        const existingIndex = existingStatements.findIndex(
          s => s.id === statement.id
        );
        if (existingIndex === -1) {
          newStatements.push(statement);
        }
      }
      Storage.saveStatements(newStatements);

      // Merge installments
      const existingInstallments = Storage.getInstallments();
      const newInstallments = [...existingInstallments];
      for (const installment of importedData.installments) {
        if (!existingInstallments.find(i => i.id === installment.id)) {
          newInstallments.push(installment);
        }
      }
      Storage.saveInstallments(newInstallments);

    } catch (error) {
      console.error('Merge failed:', error);
      throw new Error('Failed to merge data. Please check the file and password.');
    }
  }
}
