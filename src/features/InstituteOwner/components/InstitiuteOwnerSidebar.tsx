import {
  LayoutDashboard, BookOpen, Users, UserCheck,
  BarChart2, ShieldCheck, LogOut,
  ChevronLeft, ChevronRight,
  Lock, ArrowLeftRight, DollarSign, Megaphone, Rocket,
} from 'lucide-react';
import testcrackLogo from '@/assets/testcrack-logo.svg';
import { cn } from '@/shared/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface InstituteOwnerSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  className?: string;
}

const OPERATIONS = [
  { id: 'owner-dashboard', icon: LayoutDashboard, label: 'Overview',     path: '/institute-owner/dashboard' },
  { id: 'batches',         icon: BookOpen,         label: 'Batches',      path: '/institute-owner/insight' },
  { id: 'students',        icon: Users,            label: 'Students',     path: '/institute-owner/students' },
  { id: 'instructors',     icon: UserCheck,        label: 'Instructors',  path: '/institute-owner/instructors' },
];

const INSIGHTS = [
  { id: 'performance',     icon: BarChart2,        label: 'Analytics',    path: '/institute-owner/performance' },
];

const MANAGEMENT = [
  { id: 'admins',          icon: ShieldCheck,      label: 'Manage Admins', path: '/institute-owner/admins' },
];

const COMING_SOON = [
  { id: 'roi',              icon: DollarSign, label: 'Financial',      path: '/institute-owner/roi' },
  { id: 'strategic-reports',icon: Megaphone,  label: 'Marketing',      path: '/institute-owner/strategic' },
  { id: 'calibration',      icon: Rocket,     label: 'Career Launch',  path: '/institute-owner/calibration' },
];

function NavItem({ id, icon: Icon, label, path, activeTab, isCollapsed, onClick }: {
  id: string; icon: any; label: string; path: string;
  activeTab: string; isCollapsed: boolean; onClick: () => void;
}) {
  const isActive = activeTab === id;
  return (
    <button
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative',
        isCollapsed ? 'justify-center p-3' : 'px-4 py-3',
        isActive
          ? 'bg-brand-teal-600 text-white shadow-md shadow-brand-teal-500/20 dark:shadow-brand-teal-900/20'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1A1A24] hover:text-brand-teal-600 dark:hover:text-white',
      )}
    >
      <Icon className={cn('h-5 w-5 transition-transform group-hover:scale-105 shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-teal-600 dark:group-hover:text-white')} />
      {!isCollapsed && <span className="font-medium text-sm animate-in fade-in duration-200">{label}</span>}
    </button>
  );
}

function SectionLabel({ label, isCollapsed }: { label: string; isCollapsed: boolean }) {
  if (isCollapsed) return <div className="h-px bg-slate-100 dark:bg-[#1E1E2A] my-2 mx-1" />;
  return <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600 font-semibold px-4 pt-3 pb-1">{label}</p>;
}

export const InstituteOwnerSidebar = ({
  activeTab = 'owner-dashboard', onTabChange, isCollapsed, toggleCollapse, className,
}: InstituteOwnerSidebarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const go = (path: string, id: string) => {
    navigate(path);
    onTabChange?.(id);
  };

  const handleLogout = async () => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    localStorage.setItem('vite-ui-theme', 'light');
    await signOut();
  };

  return (
    <aside className={cn(
      'fixed left-4 top-4 bottom-4 bg-white dark:bg-[#12121A] rounded-2xl shadow-xl dark:shadow-2xl flex-col justify-between py-6 z-40 hidden lg:flex transition-all duration-300 border border-slate-200 dark:border-[#1E1E2A]',
      isCollapsed ? 'w-20 px-2' : 'w-64 px-4',
      className,
    )}>

      {/* Brand */}
      <div className={cn('flex items-center gap-3 mb-6', isCollapsed ? 'justify-center px-0' : 'px-2')}>
        <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain shrink-0" />
        {!isCollapsed && (
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-wide animate-in fade-in duration-300">
            Institute
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-0.5">
        <SectionLabel label="Operations" isCollapsed={isCollapsed} />
        {OPERATIONS.map(item => (
          <NavItem key={item.id} {...item} activeTab={activeTab} isCollapsed={isCollapsed} onClick={() => go(item.path, item.id)} />
        ))}

        <SectionLabel label="Insights" isCollapsed={isCollapsed} />
        {INSIGHTS.map(item => (
          <NavItem key={item.id} {...item} activeTab={activeTab} isCollapsed={isCollapsed} onClick={() => go(item.path, item.id)} />
        ))}

        <SectionLabel label="Management" isCollapsed={isCollapsed} />
        {MANAGEMENT.map(item => (
          <NavItem key={item.id} {...item} activeTab={activeTab} isCollapsed={isCollapsed} onClick={() => go(item.path, item.id)} />
        ))}

        {/* Coming Soon */}
        <SectionLabel label="Coming Soon" isCollapsed={isCollapsed} />
        {COMING_SOON.map(item => (
          <button
            key={item.id}
            onClick={() => go(item.path, item.id)}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative',
              isCollapsed ? 'justify-center p-3' : 'px-4 py-3',
              activeTab === item.id
                ? 'bg-slate-100 dark:bg-[#1A1A24] text-slate-600 dark:text-slate-300'
                : 'text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-[#1A1A24] hover:text-slate-600 dark:hover:text-slate-400',
            )}
          >
            <item.icon className="h-4 w-4 shrink-0 opacity-60" />
            {!isCollapsed && (
              <span className="font-medium text-sm opacity-70 flex items-center gap-1.5 animate-in fade-in duration-200">
                {item.label}
                <Lock className="h-3 w-3 opacity-50" />
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Switch to Admin Portal */}
      <div className="mt-2 mb-2">
        <button
          onClick={() => navigate('/institute-admin/dashboard')}
          title={isCollapsed ? 'Switch to Admin Portal' : undefined}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl transition-all duration-200 group',
            isCollapsed ? 'justify-center p-3' : 'px-4 py-3',
            'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
            'hover:bg-amber-100 dark:hover:bg-amber-800/30 border border-amber-200 dark:border-amber-700/40',
          )}
        >
          <ArrowLeftRight className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="font-semibold text-sm">Admin Portal</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-brand-teal-600 text-white p-1.5 rounded-full shadow-lg hover:bg-brand-teal-700 transition-colors z-50 border-2 border-slate-50 dark:border-[#09090E]"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Logout */}
      <div className="pt-4 border-t border-slate-200 dark:border-[#1E1E2A]">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group',
            isCollapsed ? 'justify-center p-3' : 'px-4 py-3',
          )}
        >
          <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
