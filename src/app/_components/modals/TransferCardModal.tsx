import { useState } from "react";
import Modal from "../ui/Modal";
import type { CreditCard, Profile } from "../../../lib/types";

interface TransferCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | null;
  profiles: Profile[];
  currentProfileId: string;
  onTransfer: (cardId: string, targetProfileId: string) => void;
}

export default function TransferCardModal({
  isOpen,
  onClose,
  card,
  profiles,
  currentProfileId,
  onTransfer,
}: TransferCardModalProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !selectedProfileId) return;
    
    onTransfer(card.id, selectedProfileId);
    setSelectedProfileId("");
    onClose();
  };

  const availableProfiles = profiles.filter(p => p.id !== currentProfileId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Card to Another Profile"
    >
      {card && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Transferring Card:</p>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-7 rounded-md shadow-sm"
                style={{ backgroundColor: card.color || '#334155' }}
              />
              <div>
                <p className="font-semibold text-slate-800">{card.cardName}</p>
                <p className="text-xs text-slate-500">{card.bankName}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Select Target Profile
            </label>
            {availableProfiles.length === 0 ? (
              <p className="text-sm text-slate-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                No other profiles available. Create a new profile first.
              </p>
            ) : (
              <div className="space-y-2">
                {availableProfiles.map(profile => (
                  <label
                    key={profile.id}
                    className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-all"
                    style={{
                      borderColor: selectedProfileId === profile.id ? '#3b82f6' : '#e2e8f0'
                    }}
                  >
                    <input
                      type="radio"
                      name="targetProfile"
                      value={profile.id}
                      checked={selectedProfileId === profile.id}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-800">{profile.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {availableProfiles.length > 0 && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> This will move the card, all its statements, and installments to the selected profile.
                </p>
              </div>

              <button
                type="submit"
                disabled={!selectedProfileId}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                Transfer Card
              </button>
            </>
          )}
        </form>
      )}
    </Modal>
  );
}
