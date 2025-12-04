# Sync & Backup Setup Guide

This guide explains how to use the sync and backup features in your Bills Tracker app to keep your data private while syncing across devices.

## Features

### 1. Manual Sync (✅ Ready to Use)
- Export your data as an encrypted JSON file
- Import data on any device
- Cloud-agnostic: works with any cloud storage (Dropbox, iCloud, Google Drive, OneDrive, etc.)
- Strong encryption using Web Crypto API (AES-GCM 256-bit)

### 2. Auto-Sync with Google Drive (🔧 Requires Setup)
- Automatic synchronization every 5 minutes
- Encrypted data stored in Google Drive's app data folder
- Private and secure: only your app can access the data
- Conflict resolution: automatically syncs the latest version

## Manual Sync Setup

No setup required! Just navigate to the **Sync** tab and:

1. **Export Data:**
   - Enter a strong password
   - Click "Export Data"
   - Save the file to your preferred cloud storage

2. **Import Data:**
   - Download the backup file on another device
   - Click "Import Data"
   - Enter the same password
   - Your data will be imported

### Security Notes
- Always use a strong, unique password
- Remember your password - there's no way to recover encrypted data without it
- Store backups securely in your trusted cloud storage

## Google Drive Auto-Sync Setup

To enable Google Drive auto-sync, you need to create a Google Cloud project and obtain API credentials:

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "Bills Tracker Sync")
4. Click "Create"

### Step 2: Enable Google Drive API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on it and press "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: Bills Tracker
   - User support email: your email
   - Developer contact: your email
   - Scopes: No need to add any
   - Test users: Add your Google account email
   - Click "Save and Continue"

4. Back to "Create OAuth client ID":
   - Application type: Web application
   - Name: Bills Tracker Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `http://localhost:3000` (for development)
     - Your production domain
   - Click "Create"

5. Copy the **Client ID** (you'll need this)

### Step 4: Create API Key

1. In "Credentials", click "Create Credentials" → "API key"
2. Copy the API key
3. Click "Restrict Key":
   - Application restrictions: HTTP referrers
   - Website restrictions:
     - `http://localhost:3000/*` (for development)
     - `https://yourdomain.com/*` (for production)
   - API restrictions: Restrict key → Select "Google Drive API"
   - Click "Save"

**Note on OAuth Scopes:**
- The app will request `drive.file` scope (access to files created by the app) for visible folder mode
- For hidden folder mode, it uses `drive.appdata` scope (access to hidden app data folder)
- Users can switch between modes, but may need to sign in again when changing

### Step 5: Install Google API Package

Install the required npm package:

```bash
npm install gapi-script
```

### Step 6: Load Google Identity Services

Add the Google Identity Services script to your `src/app/layout.tsx`:

```tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
        <AppProvider>
          <AppLayout>{children}</AppLayout>
        </AppProvider>
      </body>
    </html>
  );
}
```

### Step 7: Configure Your App

Add these environment variables to your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=your_api_key_here
```

### Step 8: Use the Sync Component

You can now use the `<SyncSettings>` component anywhere in your app:

```tsx
import { SyncSettings } from '@/app/_components/sync-settings';

export default function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <SyncSettings
        driveClientId={process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID}
        driveApiKey={process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY}
      />
    </div>
  );
}
```

## How It Works

### Encryption
- Uses AES-GCM 256-bit encryption
- Password is derived using PBKDF2 with 100,000 iterations
- Random salt and IV for each encryption
- Data is encrypted before uploading to any cloud storage

### Data Structure
Exported data includes:
- Profiles
- Credit cards
- Statements
- Installments
- Active profile and month selections

### Google Drive Storage

You can choose between two storage locations:

**1. Hidden App Folder (Default - Recommended)**
- File stored in Google Drive's hidden app data folder
- Only your app can access this folder
- Not visible in your regular Drive files
- More secure (hidden from other apps)
- Automatically synced across devices
- Cannot be accidentally deleted or modified

**2. Visible Folder**
- File stored in Drive root as `bills-sync.json`
- Visible in your regular Drive interface
- Easy to verify backups exist
- Can manually download/share if needed
- Still encrypted for security

**Note:** Changing storage location requires signing out and signing in again with different permissions.

### Sync Logic
- Compares timestamps between local and cloud data
- Uploads if local is newer
- Downloads if cloud is newer
- Optional auto-sync every 5 minutes

## Troubleshooting

### "Password required for encrypted data"
- Make sure you're using the same password that was used to encrypt the data

### "Drive sync not initialized"
- Check that environment variables are set correctly
- Verify Google API script is loaded
- Check browser console for errors

### "Sign in failed"
- Verify OAuth credentials are correct
- Check authorized domains in Google Cloud Console
- Try clearing cookies and signing in again

### "Upload/Download failed"
- Check internet connection
- Verify Google Drive API is enabled
- Check API quota limits in Google Cloud Console

## Privacy & Security

### What's Private
- All data is encrypted with your password before uploading
- Google cannot read your data
- Data is stored in app-specific folder (hidden from regular Drive)
- No tracking or analytics

### What's Shared
- Your Google account email (for authentication only)
- Encrypted data file (unreadable without your password)

### Best Practices
- Use a strong, unique password (12+ characters)
- Don't share your password
- Enable auto-sync only on trusted devices
- Regularly test your backups by importing on another device
- Keep at least one manual backup in a secure location

## Manual Sync vs Auto-Sync

| Feature | Manual Sync | Auto-Sync |
|---------|------------|-----------|
| Setup Required | ❌ No | ✅ Yes (Google API) |
| Cloud Provider | Any | Google Drive |
| Encryption | ✅ Yes | ✅ Yes |
| Automatic | ❌ No | ✅ Yes |
| Privacy | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Convenience | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## Development vs Production

### Development
- Use `http://localhost:3000` in OAuth settings
- Test with a personal Google account
- Keep app in "Testing" mode in OAuth consent screen

### Production
- Add your production domain to OAuth settings
- Update API key restrictions
- Consider publishing OAuth consent screen (requires verification)
- Monitor API usage in Google Cloud Console

## Support

For issues or questions:
1. Check browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Test manual sync first to isolate issues
4. Check Google Cloud Console for API errors or quota limits

## Future Enhancements

Potential improvements:
- Support for other cloud providers (Dropbox, OneDrive)
- Conflict resolution UI
- Backup history and versioning
- Selective sync (e.g., only profiles or cards)
- Multi-device notifications
