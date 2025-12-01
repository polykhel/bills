/**
 * Google Drive sync service for automatic backup and sync
 * Uses Google Drive API with OAuth2 authentication
 */

import { SyncService } from './sync';

export interface DriveConfig {
  clientId: string;
  apiKey: string;
  appFolderId?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

export class GoogleDriveSync {
  private static readonly DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  ];
  private static readonly SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
  private static readonly BACKUP_FILENAME = 'bills-sync.json';

  private config: DriveConfig;
  private isInitialized = false;
  private accessToken: string | null = null;

  constructor(config: DriveConfig) {
    this.config = config;
  }

  /**
   * Initialize Google Drive API
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Load Google API client
      if (typeof window === 'undefined' || !window.gapi) {
        reject(new Error('Google API not loaded'));
        return;
      }

      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client.init({
            apiKey: this.config.apiKey,
            clientId: this.config.clientId,
            discoveryDocs: GoogleDriveSync.DISCOVERY_DOCS,
            scope: GoogleDriveSync.SCOPES,
          });

          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Sign in to Google
   */
  async signIn(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const auth = window.gapi.auth2.getAuthInstance();
    await auth.signIn();
    this.accessToken = auth.currentUser.get().getAuthResponse().access_token;
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    const auth = window.gapi.auth2.getAuthInstance();
    await auth.signOut();
    this.accessToken = null;
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    if (!this.isInitialized) return false;
    const auth = window.gapi.auth2.getAuthInstance();
    return auth.isSignedIn.get();
  }

  /**
   * Upload backup to Google Drive
   */
  async uploadBackup(password: string): Promise<string> {
    if (!this.isSignedIn()) {
      throw new Error('Not signed in to Google Drive');
    }

    const content = await SyncService.exportEncrypted(password);
    
    // Check if file already exists
    const existingFile = await this.findBackupFile();

    if (existingFile) {
      // Update existing file
      return this.updateFile(existingFile.id, content);
    } else {
      // Create new file in app data folder
      return this.createFile(content);
    }
  }

  /**
   * Download backup from Google Drive
   */
  async downloadBackup(password: string): Promise<void> {
    if (!this.isSignedIn()) {
      throw new Error('Not signed in to Google Drive');
    }

    const file = await this.findBackupFile();
    if (!file) {
      throw new Error('No backup found on Google Drive');
    }

    const content = await this.getFileContent(file.id);
    await SyncService.importData(content, password);
  }

  /**
   * Find the backup file in app data folder
   */
  private async findBackupFile(): Promise<DriveFile | null> {
    const response = await window.gapi.client.drive.files.list({
      spaces: 'appDataFolder',
      fields: 'files(id, name, modifiedTime)',
      q: `name='${GoogleDriveSync.BACKUP_FILENAME}' and trashed=false`,
    });

    const files = response.result.files;
    return files && files.length > 0 ? files[0] : null;
  }

  /**
   * Create a new file in app data folder
   */
  private async createFile(content: string): Promise<string> {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelim = "\r\n--" + boundary + "--";

    const metadata = {
      name: GoogleDriveSync.BACKUP_FILENAME,
      mimeType: 'application/json',
      parents: ['appDataFolder'],
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      content +
      closeDelim;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        body: multipartRequestBody,
      }
    );

    const data = await response.json();
    return data.id;
  }

  /**
   * Update an existing file
   */
  private async updateFile(fileId: string, content: string): Promise<string> {
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: content,
      }
    );

    const data = await response.json();
    return data.id;
  }

  /**
   * Get file content
   */
  private async getFileContent(fileId: string): Promise<string> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    return response.text();
  }

  /**
   * Check if there's a newer version on the cloud
   */
  async hasNewerVersion(localTimestamp: string): Promise<boolean> {
    const file = await this.findBackupFile();
    if (!file) return false;

    const cloudTime = new Date(file.modifiedTime).getTime();
    const localTime = new Date(localTimestamp).getTime();

    return cloudTime > localTime;
  }

  /**
   * Auto-sync: upload if local is newer, download if cloud is newer
   */
  async autoSync(password: string, localTimestamp: string): Promise<'uploaded' | 'downloaded' | 'synced'> {
    if (!this.isSignedIn()) {
      throw new Error('Not signed in to Google Drive');
    }

    const file = await this.findBackupFile();

    if (!file) {
      // No cloud backup, upload current data
      await this.uploadBackup(password);
      return 'uploaded';
    }

    const cloudTime = new Date(file.modifiedTime).getTime();
    const localTime = new Date(localTimestamp).getTime();

    if (cloudTime > localTime) {
      // Cloud is newer, download
      await this.downloadBackup(password);
      return 'downloaded';
    } else if (localTime > cloudTime) {
      // Local is newer, upload
      await this.uploadBackup(password);
      return 'uploaded';
    }

    return 'synced';
  }
}

// Type augmentation for gapi
declare global {
  interface Window {
    gapi: any;
  }
}
