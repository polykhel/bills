"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Header from "./header/Header";
import { useApp } from "../providers";
import CardFormModal from "./modals/CardFormModal";
import InstallmentFormModal from "./modals/InstallmentFormModal";
import { OneTimeBillModal } from "./modals/OneTimeBillModal";
import ProfileFormModal from "./modals/ProfileFormModal";
import TransferCardModal from "./modals/TransferCardModal";
import { getInstallmentStatus } from "../../lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    viewDate,
    setViewDate,
    profiles,
    activeProfileId,
    setActiveProfileId,
    renameProfile,
    multiProfileMode,
    setMultiProfileMode,
    selectedProfileIds,
    toggleProfileSelection,
    showCardModal,
    setShowCardModal,
    showInstModal,
    setShowInstModal,
    showOneTimeBillModal,
    setShowOneTimeBillModal,
    showProfileModal,
    setShowProfileModal,
    showTransferModal,
    setShowTransferModal,
    editingCard,
    setEditingCard,
    editingInst,
    setEditingInst,
    editingOneTimeBill,
    setEditingOneTimeBill,
    transferringCard,
    activeCards,
    handleSaveCard,
    handleSaveInstallment,
    handleSaveOneTimeBill,
    handleSaveProfile,
    handleTransferCard,
    handleImportProfile,
    fileInputRef,
    isLoaded,
  } = useApp();

  const handleToggleMultiProfileMode = () => {
    if (multiProfileMode) {
      // Turning off: clear selections
      setMultiProfileMode(false);
    } else {
      // Turning on: start with current profile selected
      setMultiProfileMode(true);
    }
  };

  // Don't show layout on home page (it's just redirecting)
  if (pathname === "/") {
    return <>{children}</>;
  }

  const tabs = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Calendar", href: "/calendar" },
    { name: "Manage", href: "/manage" },
    { name: "Sync", href: "/sync" },
  ];

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <Header
        viewDate={viewDate}
        onDateChange={setViewDate}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onProfileChange={setActiveProfileId}
        onCreateProfile={() => setShowProfileModal(true)}
        onRenameProfile={renameProfile}
        multiProfileMode={multiProfileMode}
        selectedProfileIds={selectedProfileIds}
        onToggleMultiProfileMode={handleToggleMultiProfileMode}
        onToggleProfileSelection={toggleProfileSelection}
      />

      <div className="max-w-7xl mx-auto px-4 mt-6 mb-6">
        <nav className="flex gap-1 border-b border-slate-200">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                pathname === tab.href
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {children}
      </main>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".json" 
        onChange={handleImportProfile} 
      />

      <CardFormModal
        isOpen={showCardModal}
        onClose={() => { setShowCardModal(false); setEditingCard(null); }}
        editingCard={editingCard}
        activeProfileId={activeProfileId}
        onSave={handleSaveCard}
      />

      <InstallmentFormModal
        isOpen={showInstModal}
        onClose={() => { setShowInstModal(false); setEditingInst(null); }}
        editingInstallment={editingInst}
        activeCards={activeCards}
        viewDate={viewDate}
        currentTerm={editingInst ? getInstallmentStatus(editingInst, viewDate).currentTerm : 1}
        onSave={handleSaveInstallment}
      />

      <OneTimeBillModal
        isOpen={showOneTimeBillModal}
        onClose={() => { setShowOneTimeBillModal(false); setEditingOneTimeBill(null); }}
        editingBill={editingOneTimeBill}
        cards={activeCards}
        onSave={handleSaveOneTimeBill}
      />

      <ProfileFormModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={handleSaveProfile}
      />

      <TransferCardModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        card={transferringCard}
        profiles={profiles}
        currentProfileId={activeProfileId}
        onTransfer={handleTransferCard}
      />
    </div>
  );
}
