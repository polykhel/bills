"use client";

import { Plus, Trash2, Pencil, ArrowRightLeft, CreditCard as RawCardIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { CreditCard } from '../../../lib/types';

const CardIcon = RawCardIcon as any;

interface ManageCardsProps {
  cards: CreditCard[];
  multiProfileMode: boolean;
  profileName?: string;
  onAddCard: () => void;
  onEditCard: (card: CreditCard) => void;
  onTransferCard: (card: CreditCard) => void;
  onDeleteCard: (cardId: string) => void;
  onChangeSort: (key: string) => void;
  currentSort: { key: string; direction: string };
}

export function ManageCards({
  cards,
  multiProfileMode,
  profileName,
  onAddCard,
  onEditCard,
  onTransferCard,
  onDeleteCard,
  onChangeSort,
  currentSort,
}: ManageCardsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CardIcon className="w-5 h-5" /> Cards {multiProfileMode ? '(Multi-Profile)' : `(${profileName})`}
          </h2>
          <div className="flex gap-2 text-xs text-slate-500">
            <button
              onClick={() => onChangeSort('bankName')}
              className={cn(
                'hover:text-blue-600',
                currentSort.key === 'bankName' && 'text-blue-600 font-bold'
              )}
            >
              Name
            </button>
            <button
              onClick={() => onChangeSort('dueDay')}
              className={cn(
                'hover:text-blue-600',
                currentSort.key === 'dueDay' && 'text-blue-600 font-bold'
              )}
            >
              Due Day
            </button>
          </div>
        </div>
        <button
          onClick={onAddCard}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
        >
          <Plus className="w-4 h-4" /> Add Card
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="relative group bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-all"
          >
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => onEditCard(card)}
                className="text-slate-400 hover:text-blue-500"
                title="Edit Card"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onTransferCard(card)}
                className="text-slate-400 hover:text-purple-500"
                title="Transfer to Another Profile"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteCard(card.id)}
                className="text-slate-400 hover:text-rose-500"
                title="Delete Card"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-8 rounded-md shadow-sm"
                style={{ backgroundColor: card.color || '#334155' }}
              />
              <div>
                <h3 className="font-bold text-slate-800">{card.bankName}</h3>
                <p className="text-xs text-slate-500">{card.cardName}</p>
              </div>
            </div>
            <div className="flex justify-between text-sm text-slate-600 border-t border-slate-200 pt-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Due Day</span>
                <span className="font-semibold">{card.dueDay}th</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cut-off</span>
                <span className="font-semibold">{card.cutoffDay}th</span>
              </div>
            </div>
          </div>
        ))}
        {cards.length === 0 && (
          <p className="col-span-3 text-center text-slate-400 py-4">
            {multiProfileMode ? 'No cards found. Select profiles to view.' : 'No cards found for this profile.'}
          </p>
        )}
      </div>
    </div>
  );
}
