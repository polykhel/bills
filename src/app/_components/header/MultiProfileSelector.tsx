import { Users, CheckCircle2, Circle } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { Profile } from "../../../lib/types";

interface MultiProfileSelectorProps {
  profiles: Profile[];
  multiProfileMode: boolean;
  selectedProfileIds: string[];
  onToggleMode: () => void;
  onToggleProfile: (profileId: string) => void;
}

export default function MultiProfileSelector({ 
  profiles, 
  multiProfileMode,
  selectedProfileIds,
  onToggleMode,
  onToggleProfile
}: MultiProfileSelectorProps) {
  const selectedCount = selectedProfileIds.length;

  return (
    <div className="relative group">
      <button 
        onClick={onToggleMode}
        className={cn(
          "flex items-center gap-2 p-1.5 rounded-lg transition",
          multiProfileMode ? "bg-blue-100" : "hover:bg-slate-100"
        )}
        title={multiProfileMode ? "Multi-profile mode active" : "Enable multi-profile view"}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          multiProfileMode ? "bg-blue-600 text-white" : "bg-slate-800 text-white"
        )}>
          <Users className="w-4 h-4" />
        </div>
        <div className="text-left hidden md:block">
          <p className="text-xs text-slate-500 font-medium">View Mode</p>
          <p className="text-sm font-bold leading-none text-slate-800">
            {multiProfileMode ? `${selectedCount} Profile${selectedCount !== 1 ? 's' : ''}` : 'Single'}
          </p>
        </div>
      </button>
      
      {multiProfileMode && (
        <div className="absolute right-0 top-full pt-2 w-64 hidden group-hover:block z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-3 animate-in fade-in zoom-in-95 duration-100">
            <div className="mb-2 pb-2 border-b border-slate-200">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Select Profiles to View
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Toggle profiles to combine in view
              </p>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {profiles.map(profile => {
                const isSelected = selectedProfileIds.includes(profile.id);
                return (
                  <button
                    key={profile.id}
                    onClick={() => onToggleProfile(profile.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors",
                      isSelected
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <span className="font-medium">{profile.name}</span>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200">
              <button
                onClick={onToggleMode}
                className="w-full text-center px-3 py-2 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors font-medium"
              >
                Exit Multi-Profile Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
