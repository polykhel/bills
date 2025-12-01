import { useState } from "react";
import Modal from "../ui/Modal";
import type { CreditCard } from "../../../lib/types";

interface CardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCard: CreditCard | null;
  activeProfileId: string;
  onSave: (card: Omit<CreditCard, "id"> & { id?: string }) => void;
}

export default function CardFormModal({
  isOpen,
  onClose,
  editingCard,
  activeProfileId,
  onSave,
}: CardFormModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const cardData = {
      id: editingCard?.id,
      profileId: activeProfileId,
      bankName: formData.get("bankName") as string,
      cardName: formData.get("cardName") as string,
      dueDay: parseInt(formData.get("dueDay") as string),
      cutoffDay: parseInt(formData.get("cutoffDay") as string),
      color: formData.get("color") as string,
    };
    
    onSave(cardData);
    form.reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCard ? "Edit Card" : "Add New Card"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Bank Name
            </label>
            <input
              required
              name="bankName"
              defaultValue={editingCard?.bankName}
              placeholder="e.g. BPI"
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Card Name
            </label>
            <input
              required
              name="cardName"
              defaultValue={editingCard?.cardName}
              placeholder="e.g. Gold Rewards"
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Due Day (1-31)
            </label>
            <input
              required
              type="number"
              min="1"
              max="31"
              name="dueDay"
              defaultValue={editingCard?.dueDay ?? ''}
              placeholder="15"
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Cut-off Day
            </label>
            <input
              required
              type="number"
              min="1"
              max="31"
              name="cutoffDay"
              defaultValue={editingCard?.cutoffDay ?? ''}
              placeholder="10"
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Color Identifier
          </label>
          <input
            type="color"
            name="color"
            defaultValue={editingCard?.color || "#334155"}
            className="w-full h-10 p-1 border rounded-lg cursor-pointer"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800"
        >
          {editingCard ? "Update Card" : "Save Card"}
        </button>
      </form>
    </Modal>
  );
}
