"use client";

import ManageView from "../../views/Manage";
import { useApp } from "../providers";

export default function ManagePage() {
  const {
    profiles,
    activeProfileId,
    activeCards,
    manageCardSort,
    setManageCardSort,
    openAddCard,
    openEditCard,
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

  return (
    <ManageView
        profilesName={profiles.find(p => p.id === activeProfileId)?.name}
        activeCards={activeCards}
        manageCardSort={manageCardSort}
        setManageCardSort={setManageCardSort}
        openAddCard={openAddCard}
        openEditCard={openEditCard}
        deleteCard={handleDeleteCard}
        installments={installments}
        viewDate={viewDate}
        manageInstSort={manageInstSort}
        setManageInstSort={setManageInstSort}
        openAddInst={openAddInst}
        openEditInst={openEditInst}
        deleteInstallment={handleDeleteInstallment}
        handleExportProfile={handleExportProfile}
        handleImportProfileClick={() => fileInputRef.current?.click()}
      />
  );
}
