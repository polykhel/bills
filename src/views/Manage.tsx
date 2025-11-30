import React from 'react';
import Modal from '../app/_components/ui/Modal';
import SortableHeader from '../app/_components/ui/SortableHeader';
import { Plus, Trash2, Pencil, Users, Upload, Download, List as ListIcon, CreditCard as RawCardIcon } from 'lucide-react';
import { cn, formatCurrency, getInstallmentStatus } from '../lib/utils';
import type { CreditCard, Installment, Statement, SortConfig } from '../lib/types';

// Lucide alias fix for CreditCard icon
const CardIcon = RawCardIcon as any;

interface Props {
  profilesName: string | undefined;
  activeCards: CreditCard[];
  manageCardSort: SortConfig;
  setManageCardSort: (c: SortConfig) => void;
  openAddCard: () => void;
  openEditCard: (card: CreditCard) => void;
  deleteCard: (id: string) => void;

  installments: Installment[];
  viewDate: Date;
  manageInstSort: SortConfig;
  setManageInstSort: (c: SortConfig) => void;
  openAddInst: () => void;
  openEditInst: (inst: Installment) => void;
  deleteInstallment: (id: string) => void;

  handleExportProfile: () => void;
  handleImportProfileClick: () => void;
}

const ManageView: React.FC<Props> = ({ profilesName, activeCards, manageCardSort, setManageCardSort, openAddCard, openEditCard, deleteCard, installments, viewDate, manageInstSort, setManageInstSort, openAddInst, openEditInst, deleteInstallment, handleExportProfile, handleImportProfileClick }) => {
  const sortedManageCards = [...activeCards].sort((a, b) => {
    const dir = manageCardSort.direction === 'asc' ? 1 : -1;
    switch(manageCardSort.key) {
      case 'bankName': return a.bankName.localeCompare(b.bankName) * dir;
      case 'cardName': return a.cardName.localeCompare(b.cardName) * dir;
      case 'dueDay': return (a.dueDay - b.dueDay) * dir;
      case 'cutoffDay': return (a.cutoffDay - b.cutoffDay) * dir;
      default: return 0;
    }
  });

  const sortedManageInstallments = [...installments].sort((a, b) => {
    const dir = manageInstSort.direction === 'asc' ? 1 : -1;
    const cardA = activeCards.find(c => c.id === a.cardId)?.bankName || '';
    const cardB = activeCards.find(c => c.id === b.cardId)?.bankName || '';
    switch(manageInstSort.key) {
      case 'name': return a.name.localeCompare(b.name) * dir;
      case 'card': return cardA.localeCompare(cardB) * dir;
      case 'monthly': return (a.monthlyAmortization - b.monthlyAmortization) * dir;
      case 'progress': 
        const statA = getInstallmentStatus(a, viewDate).currentTerm;
        const statB = getInstallmentStatus(b, viewDate).currentTerm;
        return (statA - statB) * dir;
      default: return 0;
    }
  });

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 text-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Data Management
          </h2>
          <p className="text-slate-400 text-sm mt-1">Backup, restore, or move your profile data.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleImportProfileClick}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Upload className="w-4 h-4" /> Import Profile (JSON)
          </button>
          <button 
            onClick={handleExportProfile}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-900/50"
          >
            <Download className="w-4 h-4" /> Export Profile (JSON)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CardIcon className="w-5 h-5" /> Cards ({profilesName})
            </h2>
            <div className="flex gap-2 text-xs text-slate-500">
              <button onClick={() => setManageCardSort({ key: 'bankName', direction: manageCardSort.key === 'bankName' && manageCardSort.direction === 'asc' ? 'desc' : 'asc' })} className={cn('hover:text-blue-600', manageCardSort.key === 'bankName' && 'text-blue-600 font-bold')}>Name</button>
              <button onClick={() => setManageCardSort({ key: 'dueDay', direction: manageCardSort.key === 'dueDay' && manageCardSort.direction === 'asc' ? 'desc' : 'asc' })} className={cn('hover:text-blue-600', manageCardSort.key === 'dueDay' && 'text-blue-600 font-bold')}>Due Day</button>
            </div>
          </div>
          <button 
            onClick={openAddCard}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
          >
            <Plus className="w-4 h-4" /> Add Card
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedManageCards.map(card => (
            <div key={card.id} className="relative group bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-all">
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => openEditCard(card)} className="text-slate-400 hover:text-blue-500">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteCard(card.id)} className="text-slate-400 hover:text-rose-500">
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
          {activeCards.length === 0 && <p className="col-span-3 text-center text-slate-400 py-4">No cards found for this profile.</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ListIcon className="w-5 h-5" /> All Installments
          </h2>
          <button 
            onClick={openAddInst}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
          >
            <Plus className="w-4 h-4" /> Add Installment
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <SortableHeader label="Item" sortKey="name" currentSort={manageInstSort} onSort={(k) => setManageInstSort({ key: k, direction: manageInstSort.key === k && manageInstSort.direction === 'asc' ? 'desc' : 'asc' })} />
                <SortableHeader label="Card" sortKey="card" currentSort={manageInstSort} onSort={(k) => setManageInstSort({ key: k, direction: manageInstSort.key === k && manageInstSort.direction === 'asc' ? 'desc' : 'asc' })} />
                <SortableHeader label="Progress" sortKey="progress" currentSort={manageInstSort} onSort={(k) => setManageInstSort({ key: k, direction: manageInstSort.key === k && manageInstSort.direction === 'asc' ? 'desc' : 'asc' })} />
                <SortableHeader label="Monthly" sortKey="monthly" currentSort={manageInstSort} onSort={(k) => setManageInstSort({ key: k, direction: manageInstSort.key === k && manageInstSort.direction === 'asc' ? 'desc' : 'asc' })} />
                <th className="p-3 text-right rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedManageInstallments.map(inst => {
                const card = activeCards.find(c => c.id === inst.cardId);
                const status = getInstallmentStatus(inst, viewDate);
                return (
                  <tr key={inst.id} className="hover:bg-slate-50 group">
                    <td className="p-3 font-medium text-slate-800">{inst.name}</td>
                    <td className="p-3 text-slate-600">{card ? `${card.bankName} - ${card.cardName}` : 'Unknown'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono w-12 text-right">{status.currentTerm > inst.terms ? 'Done' : status.currentTerm < 1 ? 'Pending' : `${status.currentTerm}/${inst.terms}`}</span>
                        {status.isActive && (
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${(status.currentTerm / inst.terms) * 100}%`}}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">₱{formatCurrency(inst.monthlyAmortization)}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => openEditInst(inst)} className="text-slate-400 hover:text-blue-500">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteInstallment(inst.id)} className="text-slate-400 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedManageInstallments.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400">No installments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageView;
