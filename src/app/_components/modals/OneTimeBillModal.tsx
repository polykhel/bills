"use client";

import { useState, useEffect } from "react";
import Modal from "../../_components/ui/Modal";
import { OneTimeBill, CreditCard } from "../../../lib/types";

interface OneTimeBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bill: Omit<OneTimeBill, "id"> & { id?: string }) => void;
  editingBill: OneTimeBill | null;
  cards: CreditCard[];
}

export function OneTimeBillModal({
  isOpen,
  onClose,
  onSave,
  editingBill,
  cards,
}: OneTimeBillModalProps) {
  const [formData, setFormData] = useState({
    cardId: "",
    name: "",
    amount: "",
    dueDate: "",
    isPaid: false,
  });

  useEffect(() => {
    if (editingBill) {
      setFormData({
        cardId: editingBill.cardId,
        name: editingBill.name,
        amount: editingBill.amount.toString(),
        dueDate: editingBill.dueDate,
        isPaid: editingBill.isPaid,
      });
    } else {
      setFormData({
        cardId: "",
        name: "",
        amount: "",
        dueDate: "",
        isPaid: false,
      });
    }
  }, [editingBill, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cardId || !formData.name || !formData.amount || !formData.dueDate) {
      alert("Please fill in all fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    onSave({
      ...(editingBill && { id: editingBill.id }),
      cardId: formData.cardId,
      name: formData.name,
      amount,
      dueDate: formData.dueDate,
      isPaid: formData.isPaid,
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingBill ? "Edit One-Time Bill" : "Add One-Time Bill"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Card *
          </label>
          <select
            value={formData.cardId}
            onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select a card</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.bankName} - {card.cardName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Bill Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Restaurant, Gas"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Amount *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Due Date *
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPaid"
            checked={formData.isPaid}
            onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
          />
          <label htmlFor="isPaid" className="ml-2 block text-sm text-slate-700">
            Mark as Paid
          </label>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            {editingBill ? "Update" : "Add"} Bill
          </button>
        </div>
      </form>
    </Modal>
  );
}
