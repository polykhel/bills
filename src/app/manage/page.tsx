"use client";

import { cn, getInstallmentStatus } from '../../lib/utils';
import { useApp } from "../providers";
import { DataManagement } from './_components/DataManagement';
import { ManageCards } from './_components/ManageCards';
import { ManageInstallments } from './_components/ManageInstallments';

export default function ManagePage() {
  const {
    profiles,
    activeProfileId,
    activeCards,
    visibleCards,
    multiProfileMode,
    manageCardSort,
    setManageCardSort,
    openAddCard,
    openEditCard,
    openTransferCard,
    handleDeleteCard,
    installments,
    viewDate,
    manageInstSort,
    setManageInstSort,
    openAddInst,
    openEditInst,
    handleDeleteInstallment,
    handleExportProfile,
    fileInputRef,
    isLoaded,
  } = useApp();

  if (!isLoaded) {
    return null;
  }

  const profilesName = profiles.find(p => p.id === activeProfileId)?.name;

  const sortedManageCards = [...visibleCards].sort((a, b) => {
    const dir = manageCardSort.direction === 'asc' ? 1 : -1;
    switch (manageCardSort.key) {
      case 'bankName': return a.bankName.localeCompare(b.bankName) * dir;
      case 'cardName': return a.cardName.localeCompare(b.cardName) * dir;
      case 'dueDay': return (a.dueDay - b.dueDay) * dir;
      case 'cutoffDay': return (a.cutoffDay - b.cutoffDay) * dir;
      default: return 0;
    }
  });

  const visibleCardIds = new Set(visibleCards.map(c => c.id));
  const filteredInstallments = installments.filter(inst => visibleCardIds.has(inst.cardId));
  
  const sortedManageInstallments = [...filteredInstallments].sort((a, b) => {
    const dir = manageInstSort.direction === 'asc' ? 1 : -1;
    const cardA = visibleCards.find(c => c.id === a.cardId)?.bankName || '';
    const cardB = visibleCards.find(c => c.id === b.cardId)?.bankName || '';
    switch (manageInstSort.key) {
      case 'name': return a.name.localeCompare(b.name) * dir;
      case 'card': return cardA.localeCompare(cardB) * dir;
      case 'startDate': return a.startDate.localeCompare(b.startDate) * dir;
      case 'monthly': return (a.monthlyAmortization - b.monthlyAmortization) * dir;
      case 'progress':
        const statA = getInstallmentStatus(a, viewDate).currentTerm;
        const statB = getInstallmentStatus(b, viewDate).currentTerm;
        return (statA - statB) * dir;
      default: return 0;
    }
  });

  const handleCardSort = (key: string) => {
    setManageCardSort({
      key,
      direction: manageCardSort.key === key && manageCardSort.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleInstSort = (key: string) => {
    setManageInstSort({
      key,
      direction: manageInstSort.key === key && manageInstSort.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  return (
    <div className="space-y-8">
      <DataManagement
        onImportClick={() => fileInputRef.current?.click()}
        onExportClick={handleExportProfile}
      />

      <ManageCards
        cards={sortedManageCards}
        multiProfileMode={multiProfileMode}
        profileName={profilesName}
        onAddCard={openAddCard}
        onEditCard={openEditCard}
        onTransferCard={openTransferCard}
        onDeleteCard={handleDeleteCard}
        onChangeSort={handleCardSort}
        currentSort={manageCardSort}
      />

      <ManageInstallments
        installments={sortedManageInstallments}
        cards={visibleCards.map(c => ({ id: c.id, bankName: c.bankName, cardName: c.cardName }))}
        viewDate={viewDate}
        currentSort={manageInstSort}
        onSort={handleInstSort}
        onAddInstallment={openAddInst}
        onEditInstallment={openEditInst}
        onDeleteInstallment={handleDeleteInstallment}
      />
    </div>
  );
}
