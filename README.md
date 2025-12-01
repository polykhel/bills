BillTracker

BillTracker is a modern, privacy-focused React application designed to help you manage credit card bills, track installments, and visualize due dates. Built with a "local-first" approach, all data is stored securely in your browser's local storage.

Features

📊 Dashboard

Financial Overview: Instantly see your Total Statement Balance, Unpaid Balance, and total Monthly Amortizations.

Monthly Bill List: A detailed table of all cards due for the selected month.

Interactive Tracking: * Input actual statement amounts when SOAs arrive.

Toggle "Paid" status.

Override due dates for specific months (useful for weekends/holidays).

CSV Export: Download your monthly bill summary for use in Excel or Google Sheets.

📅 Calendar View

Visual Schedule: View your bills on a monthly calendar to plan cash flow.

Smart Indicators: See bank names, amounts due, and payment status directly on the calendar grid.

💳 Management

Profile System: Manage finances for multiple people (e.g., Self, Spouse, Family) without cluttering a single view.

Credit Card Manager: Add cards with specific details like Bank Name, Cut-off dates, Due dates, and custom color identifiers.

Installment Tracker: * Track long-term installment plans (e.g., "New Laptop", "Appliances").

Amortization Override: Calculate monthly payments automatically (Principal / Terms) or input the exact bank amount to account for interest.

Progress Tracking: See how many terms are paid vs. total terms.

💾 Data Management

Import/Export (JSON): Backup your profile data to a JSON file or transfer it to another device.

Local Storage: Data persists across sessions without requiring a login or backend server.

🔄 Sync & Backup (New!)

Manual Sync: Export encrypted backups and sync via any cloud storage (Dropbox, iCloud, Google Drive, etc.)

Auto-Sync: Optional Google Drive integration for automatic backup every 5 minutes

End-to-End Encryption: All data is encrypted with your password before uploading (AES-GCM 256-bit)

Privacy-First: Data is stored in encrypted format - no one can read it without your password

See [SYNC_SETUP.md](./SYNC_SETUP.md) for detailed setup instructions.

Tech Stack

Framework: React (Next.js App Router structure)

Styling: Tailwind CSS

Icons: Lucide React

Date Handling: date-fns

State Management: React Hooks (useState, useEffect, useMemo)

Getting Started

This is a single-file component designed to run within a Next.js application.

Install Dependencies:
Make sure you have the necessary packages installed in your project:

npm install date-fns lucide-react clsx tailwind-merge


Integration:
Place the page.tsx file into your Next.js app directory (e.g., app/page.tsx).

Run Development Server:

npm run dev


Usage Guide

Create a Profile: On first load, a default "My Profile" is created. You can rename this or add new profiles (e.g., "Spouse") via the user icon in the top right.

Add Cards: Go to the Manage tab and add your credit cards. Set the "Due Day" to your usual due date.

Add Installments: If you have ongoing installments, add them in the Manage tab. Link them to a specific card.

Tracking: * Go to the Dashboard.

If a Statement of Account (SOA) hasn't arrived, the app estimates the amount based on your active installments.

Once the SOA arrives, type the actual amount in the "Statement Balance" field.

Click the circle icon to mark a bill as Paid.

License

This project is open-source and available for personal use.