import Modal from "../ui/Modal";

interface ProfileFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export default function ProfileFormModal({
  isOpen,
  onClose,
  onSave,
}: ProfileFormModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get("profileName") as string;
    onSave(name);
    form.reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Profile Name
          </label>
          <input
            required
            name="profileName"
            placeholder="e.g. Spouse"
            className="w-full p-2 border rounded-lg text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800"
        >
          Create Profile
        </button>
      </form>
    </Modal>
  );
}
