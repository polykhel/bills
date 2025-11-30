import { useState } from "react";
import { format, subMonths } from "date-fns";
import { Calendar, Calculator } from "lucide-react";
import Modal from "../ui/Modal";
import { cn } from "../../../lib/utils";
import type { CreditCard, Installment } from "../../../lib/types";

interface InstallmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingInstallment: Installment | null;
  activeCards: CreditCard[];
  viewDate: Date;
  currentTerm: number;
  onSave: (data: Omit<Installment, "id"> & { id?: string }) => void;
}

export default function InstallmentFormModal({
  isOpen,
  onClose,
  editingInstallment,
  activeCards,
  viewDate,
  currentTerm,
  onSave,
}: InstallmentFormModalProps) {
  const [instMode, setInstMode] = useState<'date' | 'term'>('date');
  const [tempCurrentTerm, setTempCurrentTerm] = useState<number>(currentTerm);
  const [tempTerms, setTempTerms] = useState<number>(editingInstallment?.terms || 12);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const principal = parseFloat(formData.get("principal") as string);
    const terms = parseInt(formData.get("terms") as string);
    const customMonthly = parseFloat(formData.get("monthlyAmortization") as string);
    
    let calculatedStartDate = formData.get("startDate") as string;
    if (instMode === 'term') {
      const currentTermInput = parseInt(formData.get("currentTerm") as string) || 1;
      const backDate = subMonths(viewDate, currentTermInput - 1);
      calculatedStartDate = format(backDate, "yyyy-MM-dd");
    }
    
    const instData = {
      id: editingInstallment?.id,
      cardId: formData.get("cardId") as string,
      name: formData.get("name") as string,
      totalPrincipal: principal,
      terms: terms,
      monthlyAmortization: customMonthly || (principal / terms),
      startDate: calculatedStartDate,
    };
    
    onSave(instData);
    form.reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingInstallment ? "Edit Installment" : "Add Installment"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Item/Purchase Name
          </label>
          <input
            required
            name="name"
            defaultValue={editingInstallment?.name}
            placeholder="e.g. New Laptop"
            className="w-full p-2 border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Charge to Card
          </label>
          <select
            name="cardId"
            required
            defaultValue={editingInstallment?.cardId}
            className="w-full p-2 border rounded-lg text-sm bg-white"
          >
            {activeCards.map(c => (
              <option key={c.id} value={c.id}>
                {c.bankName} - {c.cardName}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Principal Amount
            </label>
            <input
              required
              type="number"
              step="0.01"
              name="principal"
              defaultValue={editingInstallment?.totalPrincipal}
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Terms (Months)
            </label>
            <input
              required
              type="number"
              name="terms"
              min="1"
              defaultValue={editingInstallment?.terms || tempTerms}
              onChange={(e) => setTempTerms(parseInt(e.target.value))}
              placeholder="12, 24, 36"
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Monthly Amortization (Optional Override)
          </label>
          <input
            type="number"
            step="any"
            name="monthlyAmortization"
            defaultValue={editingInstallment?.monthlyAmortization}
            placeholder="Leave blank to auto-calculate (Principal ÷ Terms)"
            className="w-full p-2 border rounded-lg text-sm"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Optional: Enter the exact monthly payment amount if it differs from simple division
            (e.g., includes interest or fees). Leave blank to auto-calculate.
          </p>
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">
            How to Determine Start Date?
          </h4>
          <div className="flex space-x-2 mb-4">
            <button
              type="button"
              onClick={() => setInstMode('date')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm transition-colors",
                instMode === 'date'
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              <Calendar className="w-4 h-4" /> Set Start Date
            </button>
            <button
              type="button"
              onClick={() => setInstMode('term')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm transition-colors",
                instMode === 'term'
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              <Calculator className="w-4 h-4" /> Set Current Term
            </button>
          </div>
        </div>

        {instMode === 'date' && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Start Date (First Payment Month)
            </label>
            <input
              required
              type="date"
              name="startDate"
              defaultValue={editingInstallment?.startDate}
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
        )}

        {instMode === 'term' && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Current Term (Month # for {format(viewDate, "MMMM yyyy")})
            </label>
            <input
              required
              type="number"
              min="1"
              max={tempTerms}
              name="currentTerm"
              value={tempCurrentTerm}
              onChange={(e) => setTempCurrentTerm(parseInt(e.target.value) || 1)}
              placeholder="e.g. 12"
              className="w-full p-2 border rounded-lg text-sm"
            />
            <input type="hidden" name="startDate" />
            {tempCurrentTerm > 0 && tempCurrentTerm <= tempTerms && (
              <p className="text-xs text-slate-500 mt-2 p-2 bg-blue-50 rounded-lg">
                <span className="font-medium">Calculated Start Date:</span>{" "}
                {format(subMonths(viewDate, tempCurrentTerm - 1), "MMMM yyyy")}
                <span className="text-slate-400"> (Term 1)</span>
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800"
        >
          {editingInstallment ? "Update Installment" : "Add Installment"}
        </button>
      </form>
    </Modal>
  );
}
