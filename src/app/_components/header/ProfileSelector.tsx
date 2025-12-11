import { User, UserPlus, CheckCircle2, Pencil } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { Profile } from "../../../lib/types";
import { useState } from "react";

interface ProfileSelectorProps {
  profiles: Profile[];
  activeProfileId: string;
  onProfileChange: (profileId: string) => void;
  onCreateProfile: () => void;
  onRenameProfile: (profileId: string, newName: string) => void;
}

export default function ProfileSelector({ 
  profiles, 
  activeProfileId, 
  onProfileChange, 
  onCreateProfile,
  onRenameProfile
}: ProfileSelectorProps) {
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition">
        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <div className="text-left hidden md:block">
          <p className="text-xs text-slate-500 font-medium">Profile</p>
          <p className="text-sm font-bold leading-none text-slate-800">{activeProfile?.name}</p>
        </div>
      </button>
      <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-50">
        <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-1 animate-in fade-in zoom-in-95 duration-100">
        {profiles.map(p => (
          <div key={p.id} className="mb-1">
            {editingProfileId === p.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingName.trim()) {
                    onRenameProfile(p.id, editingName.trim());
                    setEditingProfileId(null);
                    setEditingName("");
                  }
                }}
                className="flex items-center gap-1 px-2 py-1"
              >
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => {
                    setEditingProfileId(null);
                    setEditingName("");
                  }}
                  autoFocus
                  className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </form>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onProfileChange(p.id)}
                  className={cn(
                    "flex-1 text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between",
                    activeProfileId === p.id
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-slate-50 text-slate-700"
                  )}
                >
                  {p.name}
                  {activeProfileId === p.id && <CheckCircle2 className="w-3 h-3" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProfileId(p.id);
                    setEditingName(p.name);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  title="Rename profile"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
        <div className="h-px bg-slate-100 my-1" />
        <button
          onClick={onCreateProfile}
          className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg flex items-center gap-2"
        >
          <UserPlus className="w-3 h-3" /> Create Profile
        </button>
        </div>
      </div>
    </div>
  );
}
