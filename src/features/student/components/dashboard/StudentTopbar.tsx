import { Search, Bell, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface StudentTopbarProps {
  onUpgradeClick: () => void;
}

export const StudentTopbar = ({ onUpgradeClick }: StudentTopbarProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // Get initials or name safely
  const displayName = profile?.name || user?.email?.split('@')[0] || "Student";

  return (
    <header className="flex items-center justify-between py-4 px-6 gap-8 bg-white/80 backdrop-blur-sm sticky top-0 z-30 lg:rounded-2xl lg:mx-4 lg:mt-4 lg:shadow-sm border-b lg:border-none border-slate-100">
      {/* Search Input - Professional & Minimal */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search courses, assignments, or topics..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Upgrade Button */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={onUpgradeClick}
          className="hidden sm:flex items-center gap-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-colors rounded-full px-4"
        >
          <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
          <span className="font-semibold text-xs uppercase tracking-wide">Upgrade Plan</span>
        </Button>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-700 leading-none">{displayName}</p>
            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">Student</p>
          </div>
          <Avatar 
            className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-100 cursor-pointer hover:ring-indigo-100 transition-all"
            onClick={() => navigate('/student/profile')}
          >
            <AvatarImage src={profile?.profileImage || ""} />
            <AvatarFallback className="bg-indigo-600 text-white font-bold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};
