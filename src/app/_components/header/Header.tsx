import { CreditCard as CardIcon } from "lucide-react";
import MonthNavigator from "./MonthNavigator";
import ProfileSelector from "./ProfileSelector";
import type { Profile } from "../../../lib/types";

interface HeaderProps {
  viewDate: Date;
  onDateChange: (date: Date) => void;
  profiles: Profile[];
  activeProfileId: string;
  onProfileChange: (profileId: string) => void;
  onCreateProfile: () => void;
}

export default function Header({
  viewDate,
  onDateChange,
  profiles,
  activeProfileId,
  onProfileChange,
  onCreateProfile,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <CardIcon className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">
            BillTracker
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <MonthNavigator viewDate={viewDate} onDateChange={onDateChange} />
          <ProfileSelector
            profiles={profiles}
            activeProfileId={activeProfileId}
            onProfileChange={onProfileChange}
            onCreateProfile={onCreateProfile}
          />
        </div>
      </div>
    </header>
  );
}
