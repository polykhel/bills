/**
 * Google Drive sync service for automatic backup and sync
 * Uses Google Drive API with OAuth2 authentication (Google Identity Services)
 */

import { gapi } from 'gapi-script';
import { SyncService } from './sync';

// Type declarations for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

const google = typeof window !== 'undefined' ? window.google : undefined;

export interface DriveConfig {
  clientId: string;
  apiKey: string;
  appFolderId?: string;
  useAppDataFolder?: boolean; // true = hidden folder, false = visible folder
}

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
}

export class GoogleDriveSync {
  private static readonly DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  ];
  private static readonly BACKUP_FILENAME = 'bills-sync.json';

  private config: DriveConfig;
  private isInitialized = false;
  private accessToken: string | null = null;
  private tokenClient: any = null;

  constructor(config: DriveConfig) {
    this.config = {
      ...config,
      useAppDataFolder: config.useAppDataFolder ?? true, // Default to hidden folder
    };
  }

  /**
   * Get the appropriate scope based on config
   */
  private getScopes(): string {
    // Use appropriate scope based on storage mode
    return this.config.useAppDataFolder
      ? 'https://www.googleapis.com/auth/drive.appdata'
      : 'https://www.googleapis.com/auth/drive.file';
  }

  /**
   * Initialize Google Drive API with Google Identity Services
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Not in browser environment'));
        return;
      }

      // Load gapi client
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: this.config.apiKey,
            discoveryDocs: GoogleDriveSync.DISCOVERY_DOCS,
          });

          // Initialize Google Identity Services
          if (typeof google !== 'undefined' && google.accounts) {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
              client_id: this.config.clientId,
              scope: this.getScopes(),
              callback: '', // Will be set dynamically
            });
          }

          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Sign in to Google using Google Identity Services
   */
  async signIn(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Reinitialize token client with current scope
    if (typeof google !== 'undefined' && google.accounts) {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.config.clientId,
        scope: this.getScopes(),
        callback: '', // Will be set dynamically
      });
    }

    return new Promise((resolve, reject) => {
      try {
        // Request an access token
        this.tokenClient.callback = (response: TokenResponse) => {
          if (response.error !== undefined) {
            reject(new Error(response.error));
            return;
          }
          this.accessToken = response.access_token;
          gapi.client.setToken({ access_token: response.access_token });
          resolve();
        };

        // Check if already have a valid token
        if (gapi.client.getToken() !== null) {
          resolve();
        } else {
          // Prompt the user to select an account and consent to share data
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    const token = gapi.client.getToken();
    if (token !== null) {
      if (google?.accounts?.oauth2) {
        google.accounts.oauth2.revoke(token.access_token, () => {
          console.log('Token revoked');
        });
      }
      gapi.client.setToken(null);
    }
    this.accessToken = null;
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    if (!this.isInitialized) return false;
    const token = gapi.client.getToken();
    return token !== null && this.accessToken !== null;
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
   * Find the backup file in Drive
   */
  private async findBackupFile(): Promise<DriveFile | null> {
    try {
      const response = await gapi.client.drive.files.list({
        spaces: this.config.useAppDataFolder ? 'appDataFolder' : 'drive',
        fields: 'files(id, name, modifiedTime)',
        q: `name='${GoogleDriveSync.BACKUP_FILENAME}' and trashed=false`,
      });

      const files = response.result.files;
      return files && files.length > 0 ? files[0] : null;
    } catch (error) {
      console.error('Error finding backup file:', error);
      throw error;
    }
  }

  /**
   * Create a new file in Drive (visible or app data folder)
   */
  private async createFile(content: string): Promise<string> {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelim = "\r\n--" + boundary + "--";

    const metadata = {
      name: GoogleDriveSync.BACKUP_FILENAME,
      mimeType: 'application/json',
      parents: this.config.useAppDataFolder ? ['appDataFolder'] : undefined,
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Drive upload error:', errorText);
      throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('File created successfully:', data);
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Drive update error:', errorText);
      throw new Error(`Failed to update file: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('File updated successfully:', data);
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

  /**
   * Get backup file info (for verification)
   */
  async getBackupInfo(): Promise<DriveFile | null> {
    if (!this.isSignedIn()) {
      throw new Error('Not signed in to Google Drive');
    }
    return this.findBackupFile();
  }
}
