# Quick Start: Sync Your Bills Data

## 🚀 Get Started in 2 Minutes

Your Bills Tracker now supports secure data sync across devices!

### Step 1: Open Sync Page
Click the **"Sync"** tab in the navigation bar.

### Step 2: Set Your Password
1. Enter a strong password (at least 8 characters)
2. Remember this password - you'll need it on all devices
3. Check the password strength indicator (aim for "strong")

### Step 3: Export Your Data
1. Click **"Export Data"**
2. Your encrypted backup file downloads automatically
3. File name: `bills-backup-encrypted-[timestamp].json`

### Step 4: Store in Cloud
Upload your backup file to your favorite cloud storage:
- ✅ Dropbox
- ✅ iCloud Drive
- ✅ Google Drive
- ✅ OneDrive
- ✅ Any cloud storage you trust

### Step 5: Import on Another Device
1. Download the backup file from your cloud storage
2. Open Bills Tracker on the new device
3. Go to **Sync** tab
4. Click **"Import Data"**
5. Select your backup file
6. Enter the same password
7. Done! 🎉

## 🔐 Security

Your data is encrypted using military-grade encryption:
- **AES-GCM 256-bit** encryption
- **PBKDF2** key derivation (100,000 iterations)
- Data encrypted **before** leaving your device
- Nobody can read your data without your password
- Not even Google, Dropbox, or us!

## 💡 Tips

### Password Tips
- Use a unique password (not used elsewhere)
- Mix uppercase, lowercase, numbers, and symbols
- Minimum 8 characters, but longer is better
- Store it in a password manager if you forget easily

### Sync Tips
- Export regularly (weekly or after major changes)
- Keep at least one backup in a safe location
- Test import on a second device to verify backup works
- Use the same password across all devices

### Cloud Storage Tips
- Free tier is fine (backups are usually < 100KB)
- Enable 2FA on your cloud storage account
- Don't share your backup file publicly
- Consider having backups in multiple cloud services

## 🤔 FAQ

**Q: What happens if I forget my password?**  
A: Unfortunately, there's no way to recover your data. This is intentional for maximum privacy. Keep your password safe!

**Q: Can I use different passwords on different devices?**  
A: No, you must use the same password to decrypt your data.

**Q: Is my data safe in the cloud?**  
A: Yes! Your data is encrypted before uploading. The cloud only stores encrypted gibberish.

**Q: How often should I backup?**  
A: We recommend weekly, or after adding/changing important data.

**Q: Can I automate this?**  
A: Yes! Check out `SYNC_SETUP.md` for Google Drive auto-sync setup.

**Q: What data is included in the backup?**  
A: Everything:
- All profiles
- All credit cards
- All statements
- All installments
- Your active selections

**Q: Can I have multiple backups?**  
A: Absolutely! Each export creates a timestamped file.

**Q: What if I import old data over new data?**  
A: Import replaces all data. Always export before importing to have a backup of current state.

## 🆘 Troubleshooting

**"Password required for encrypted data"**
- Solution: Make sure you entered the password used during export

**"Failed to import data"**
- Check you selected the correct file
- Verify the password is correct
- Try exporting again if file might be corrupted

**Export button doesn't work**
- Check browser allows downloads
- Try disabling browser extensions
- Check browser console for errors

**Data size shows 0**
- Normal if you haven't added any data yet
- Size updates when you add profiles/cards/statements

## 🚀 Next Steps

### Want Automatic Sync?
See `SYNC_SETUP.md` for Google Drive auto-sync setup:
- Syncs every 5 minutes automatically
- No need to manually export/import
- Still fully encrypted
- Requires Google API setup (free)

### Need Help?
- Check the detailed documentation in `SYNC_SETUP.md`
- Review the implementation details in `IMPLEMENTATION_SUMMARY.md`
- Check browser console for detailed error messages

## ✅ Checklist: First Time Setup

- [ ] Go to Sync tab
- [ ] Create a strong password
- [ ] Export your data
- [ ] Upload to cloud storage
- [ ] Test import on same device (optional but recommended)
- [ ] Import on second device if you have one
- [ ] Save password in password manager
- [ ] Set reminder to backup weekly

---

**You're all set!** Your financial data is now secure and synced across devices. 🎉
