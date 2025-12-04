'use client';

import { useState, useEffect } from 'react';
import { Cloud, CloudOff, Upload, Download, Settings, RefreshCw } from 'lucide-react';
import { useSync } from '@/lib/use-sync';
import ConfirmDialog from './ui/ConfirmDialog';

interface SyncSettingsProps {
  driveClientId?: string;
  driveApiKey?: string;
}

export function SyncSettings({ driveClientId, driveApiKey }: SyncSettingsProps) {
  const [password, setPassword] = useState('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [useHiddenFolder, setUseHiddenFolder] = useState(true);
  const [showStorageConfirm, setShowStorageConfirm] = useState(false);
  const [pendingStorageValue, setPendingStorageValue] = useState(false);

  const driveConfig = driveClientId && driveApiKey
    ? { clientId: driveClientId, apiKey: driveApiKey, useAppDataFolder: useHiddenFolder }
    : undefined;

  const {
    isSignedIn,
    isSyncing,
    lastSyncTime,
    error,
    signIn,
    signOut,
    uploadToCloud,
    downloadFromCloud,
    performAutoSync,
  } = useSync({
    driveConfig,
    autoSyncInterval: autoSyncEnabled ? 5 * 60 * 1000 : undefined, // 5 minutes
  });

  // Load saved password from localStorage (in production, consider more secure storage)
  useEffect(() => {
    const loadSavedSettings = () => {
      const savedPassword = localStorage.getItem('bt_sync_password');
      if (savedPassword) {
        setPassword(savedPassword);
      }

      const autoSync = localStorage.getItem('bt_auto_sync') === 'true';
      setAutoSyncEnabled(autoSync);

      const savedHiddenFolder = localStorage.getItem('bt_hidden_folder');
      const hiddenFolder = savedHiddenFolder !== null ? savedHiddenFolder === 'true' : true;
      setUseHiddenFolder(hiddenFolder);
    };

    loadSavedSettings();
  }, []);

  const handleSignIn = async () => {
    await signIn();
  };

  const handleSignOut = async () => {
    await signOut();
    setAutoSyncEnabled(false);
    localStorage.removeItem('bt_sync_password');
    localStorage.removeItem('bt_auto_sync');
  };

  const handleUpload = async () => {
    if (!password) {
      alert('Please enter your encryption password');
      return;
    }
    
    localStorage.setItem('bt_sync_password', password);
    await uploadToCloud(password);
    
    // Show success message after upload
    if (!error) {
      const location = useHiddenFolder 
        ? 'in your Google Drive hidden app folder (not visible in regular Drive)'
        : 'in your Google Drive root folder as "bills-sync.json"';
      alert(`✓ Data uploaded successfully to Google Drive!\n\nNote: The file is stored ${location}`);
    }
  };

  const handleDownload = async () => {
    if (!password) {
      alert('Please enter your encryption password');
      return;
    }

    if (confirm('This will replace your local data with cloud data. Continue?')) {
      await downloadFromCloud(password);
      window.location.reload();
    }
  };

  const toggleAutoSync = () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    localStorage.setItem('bt_auto_sync', String(newValue));

    if (newValue && password) {
      localStorage.setItem('bt_sync_password', password);
    }
  };

  const toggleStorageLocation = () => {
    const newValue = !useHiddenFolder;
    
    if (isSignedIn) {
      // Show confirmation dialog when signed in
      setPendingStorageValue(newValue);
      setShowStorageConfirm(true);
    } else {
      // Directly change when not signed in
      setUseHiddenFolder(newValue);
      localStorage.setItem('bt_hidden_folder', String(newValue));
    }
  };

  const handleStorageConfirm = async () => {
    // Sign out first
    await signOut();
    
    // Apply the change
    setUseHiddenFolder(pendingStorageValue);
    localStorage.setItem('bt_hidden_folder', String(pendingStorageValue));
    
    // Disable auto-sync since we're signing out
    setAutoSyncEnabled(false);
    localStorage.removeItem('bt_sync_password');
    localStorage.removeItem('bt_auto_sync');
  };

  if (!driveConfig) {
    return (
      <div className="text-sm text-gray-500">
        Google Drive sync not configured
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Cloud Sync</h3>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Settings className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Sign In/Out */}
      {!isSignedIn ? (
        <button
          onClick={handleSignIn}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Cloud className="w-4 h-4" />
          Sign in with Google Drive
        </button>
      ) : (
        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <span className="flex items-center gap-1 text-green-600">
              <Cloud className="w-4 h-4" />
              Connected
            </span>
          </div>

          {lastSyncTime && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last sync:</span>
              <span className="text-gray-900">
                {new Date(lastSyncTime).toLocaleString()}
              </span>
            </div>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <div className="space-y-3 pt-3 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Encryption Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoSync"
                    checked={autoSyncEnabled}
                    onChange={toggleAutoSync}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="autoSync" className="text-sm text-gray-700">
                    Enable auto-sync (every 5 minutes)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hiddenFolder"
                    checked={useHiddenFolder}
                    onChange={toggleStorageLocation}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="hiddenFolder" className="text-sm text-gray-700">
                    Use hidden folder (recommended)
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  {useHiddenFolder 
                    ? "Files stored in hidden app folder (not visible in Drive)" 
                    : "Files stored in Drive root folder (visible as bills-sync.json)"}
                  {isSignedIn && " • Changing requires re-authentication"}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={isSyncing || !password}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition-colors"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload
            </button>

            <button
              onClick={handleDownload}
              disabled={isSyncing || !password}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition-colors"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download
            </button>

            <button
              onClick={performAutoSync}
              disabled={isSyncing || !password}
              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition-colors"
              title="Sync now"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm transition-colors"
          >
            <CloudOff className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}

      {/* Storage Location Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showStorageConfirm}
        onClose={() => setShowStorageConfirm(false)}
        onConfirm={handleStorageConfirm}
        title="Change Storage Location"
        message={`Changing to ${pendingStorageValue ? 'hidden folder' : 'visible folder'} will sign you out and require signing in again with different permissions. Your current sync session will end.`}
        confirmText="Sign Out & Change"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
}
