'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoogleDriveSync, type DriveConfig } from './google-drive-sync';
import { Storage } from './storage';

interface UseSyncOptions {
  driveConfig?: DriveConfig;
  autoSyncInterval?: number; // in milliseconds
}

interface SyncState {
  isSignedIn: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  error: string | null;
}

export function useSync(options: UseSyncOptions = {}) {
  const [state, setState] = useState<SyncState>({
    isSignedIn: false,
    isSyncing: false,
    lastSyncTime: null,
    error: null,
  });

  const [driveSync, setDriveSync] = useState<GoogleDriveSync | null>(null);

  // Initialize Google Drive sync
  useEffect(() => {
    if (options.driveConfig) {
      const sync = new GoogleDriveSync(options.driveConfig);
      setDriveSync(sync);

      // Check initial sign-in state
      sync.initialize().then(() => {
        setState(prev => ({
          ...prev,
          isSignedIn: sync.isSignedIn(),
        }));
      }).catch(error => {
        setState(prev => ({
          ...prev,
          error: error.message,
        }));
      });
    }
  }, [options.driveConfig]);

  // Auto-sync interval
  useEffect(() => {
    if (!options.autoSyncInterval || !driveSync || !state.isSignedIn) {
      return;
    }

    const interval = setInterval(() => {
      performAutoSync();
    }, options.autoSyncInterval);

    return () => clearInterval(interval);
  }, [options.autoSyncInterval, driveSync, state.isSignedIn]);

  const signIn = useCallback(async () => {
    if (!driveSync) {
      setState(prev => ({ ...prev, error: 'Drive sync not initialized' }));
      return;
    }

    try {
      await driveSync.signIn();
      setState(prev => ({
        ...prev,
        isSignedIn: true,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign in failed',
      }));
    }
  }, [driveSync]);

  const signOut = useCallback(async () => {
    if (!driveSync) return;

    try {
      await driveSync.signOut();
      setState(prev => ({
        ...prev,
        isSignedIn: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign out failed',
      }));
    }
  }, [driveSync]);

  const uploadToCloud = useCallback(async (password: string) => {
    if (!driveSync) {
      setState(prev => ({ ...prev, error: 'Drive sync not initialized' }));
      return;
    }

    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      await driveSync.uploadBackup(password);
      const timestamp = new Date().toISOString();
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: timestamp,
      }));

      // Save sync timestamp locally
      localStorage.setItem('bt_last_sync', timestamp);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
    }
  }, [driveSync]);

  const downloadFromCloud = useCallback(async (password: string) => {
    if (!driveSync) {
      setState(prev => ({ ...prev, error: 'Drive sync not initialized' }));
      return;
    }

    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      await driveSync.downloadBackup(password);
      const timestamp = new Date().toISOString();
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: timestamp,
      }));

      localStorage.setItem('bt_last_sync', timestamp);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Download failed',
      }));
    }
  }, [driveSync]);

  const performAutoSync = useCallback(async () => {
    if (!driveSync || state.isSyncing) return;

    const password = localStorage.getItem('bt_sync_password');
    if (!password) return;

    const lastSync = localStorage.getItem('bt_last_sync') || new Date().toISOString();

    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const result = await driveSync.autoSync(password, lastSync);
      const timestamp = new Date().toISOString();
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: timestamp,
      }));

      localStorage.setItem('bt_last_sync', timestamp);
      
      if (result === 'downloaded') {
        // Notify user that data was updated
        console.log('Data synced from cloud');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Auto-sync failed',
      }));
    }
  }, [driveSync, state.isSyncing]);

  return {
    ...state,
    signIn,
    signOut,
    uploadToCloud,
    downloadFromCloud,
    performAutoSync,
  };
}
