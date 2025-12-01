'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, Cloud, FileDown, Lock, AlertCircle } from 'lucide-react';
import { SyncService } from '@/lib/sync';
import { getPasswordStrength, getDataSize, formatBytes } from '@/lib/sync-utils';

export default function SyncPage() {
  const [password, setPassword] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [dataSize, setDataSize] = useState(0);

  useEffect(() => {
    setDataSize(getDataSize());
  }, []);

  const passwordStrength = password ? getPasswordStrength(password) : null;
  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const handleExport = async () => {
    if (isEncrypted && !password) {
      setMessage('Please enter a password for encryption');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      await SyncService.downloadBackup(isEncrypted, password || undefined);
      setMessage('Backup downloaded successfully!');
    } catch (error) {
      setMessage(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isEncrypted && !password) {
      setMessage('Please enter a password to decrypt');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      await SyncService.loadBackup(file, password || undefined);
      setMessage('Data imported successfully! Refreshing...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Sync & Backup</h1>
          <p className="text-gray-600 mt-2">
            Export and import your data securely across devices
          </p>
        </div>

        {/* Manual Sync Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileDown className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Manual Sync</h2>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Export your data as an encrypted file and import it on another device.
            You can also store it in your preferred cloud storage (Dropbox, iCloud, etc.).
          </p>

          {/* Encryption Toggle */}
          <div className="mb-4 flex items-center gap-3">
            <input
              type="checkbox"
              id="encrypted"
              checked={isEncrypted}
              onChange={(e) => setIsEncrypted(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="encrypted" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Lock className="w-4 h-4" />
              Encrypt data (recommended)
            </label>
          </div>

          {/* Password Input */}
          {isEncrypted && (
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter encryption password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600">Strength:</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${strengthColors[passwordStrength]}`}
                        style={{
                          width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%'
                        }}
                      />
                    </div>
                    <span className={`font-medium ${
                      passwordStrength === 'weak' ? 'text-red-600' :
                      passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {passwordStrength}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Remember this password - you&apos;ll need it to import your data
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>

            <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isProcessing}
                className="hidden"
              />
            </label>
          </div>

          {/* Message */}
          {message && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              message.includes('failed') || message.includes('error')
                ? 'bg-red-50 text-red-800'
                : 'bg-green-50 text-green-800'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Google Drive Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cloud className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Auto-Sync (Coming Soon)</h2>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Automatically sync your data with Google Drive. Your data will be encrypted
            before uploading to ensure privacy.
          </p>

          <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
            <p className="text-sm text-gray-500">
              🔒 Google Drive auto-sync feature is currently in development.
              For now, use manual sync and store your backup file in Google Drive or any cloud storage.
            </p>
          </div>
        </div>

        {/* Data Info */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">Your Data</h3>
              <p className="text-sm text-gray-600">
                Current data size: <span className="font-medium">{formatBytes(dataSize)}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This is the approximate size of your backup file
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">How to sync between devices:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Export your data with a strong password</li>
            <li>Store the backup file in your cloud storage (Dropbox, iCloud, Google Drive, etc.)</li>
            <li>Download the file on your other device</li>
            <li>Import the file using the same password</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
