'use client';

import { Cloud, Info } from 'lucide-react';
import Link from 'next/link';

/**
 * A simple info banner that can be added to any page to inform users about sync
 */
export function SyncInfoBanner() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Cloud className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-1">
            Sync Your Data Across Devices
          </h3>
          <p className="text-sm text-blue-800 mb-2">
            Keep your bills in sync across all your devices with encrypted backup.
            Your data is encrypted before uploading - only you can read it.
          </p>
          <Link
            href="/sync"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900 underline"
          >
            Go to Sync Settings →
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * A compact sync status indicator for headers or toolbars
 */
export function SyncStatusIndicator({ lastSyncTime }: { lastSyncTime?: string | null }) {
  if (!lastSyncTime) {
    return (
      <Link
        href="/sync"
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm transition-colors"
      >
        <Cloud className="w-4 h-4" />
        <span>Not synced</span>
      </Link>
    );
  }

  const syncDate = new Date(lastSyncTime);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60));
  
  let timeText = '';
  if (diffMinutes < 1) {
    timeText = 'Just now';
  } else if (diffMinutes < 60) {
    timeText = `${diffMinutes}m ago`;
  } else if (diffMinutes < 1440) {
    timeText = `${Math.floor(diffMinutes / 60)}h ago`;
  } else {
    timeText = `${Math.floor(diffMinutes / 1440)}d ago`;
  }

  return (
    <Link
      href="/sync"
      className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-sm transition-colors"
      title={`Last synced: ${syncDate.toLocaleString()}`}
    >
      <Cloud className="w-4 h-4" />
      <span>{timeText}</span>
    </Link>
  );
}

/**
 * A help tooltip for the sync feature
 */
export function SyncHelp() {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-2 mb-2">
        <Info className="w-4 h-4 text-gray-600 mt-0.5" />
        <h4 className="font-medium text-gray-900">About Sync</h4>
      </div>
      <ul className="text-sm text-gray-600 space-y-1 ml-6 list-disc">
        <li>All data is encrypted with your password before uploading</li>
        <li>Manual sync works with any cloud storage (Dropbox, iCloud, etc.)</li>
        <li>Auto-sync requires Google Drive setup (optional)</li>
        <li>Only you can decrypt your data - keep your password safe</li>
      </ul>
    </div>
  );
}
