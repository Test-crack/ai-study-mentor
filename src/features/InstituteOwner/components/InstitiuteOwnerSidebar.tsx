import {
  LayoutDashboard, BookOpen, Users, UserCheck, ClipboardList,
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
  { id: 'assessments',     icon: ClipboardList,    label: 'Assessments',  path: '/institute-owner/assessments' },
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
        'w-full flex items-center gap-3 rounded-xl transition-colors duration-150 group relative',
        isCollapsed ? 'justify-center p-3' : 'px-4 py-3',
        isActive
          ? 'bg-brand-mint/15 text-brand-mint'
          : 'bg-transparent text-brand-on-ink-mute hover:bg-white/5',
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-brand-mint' : 'text-brand-on-ink-mute')} />
      {!isCollapsed && <span className="font-medium text-sm animate-in fade-in duration-200">{label}</span>}
    </button>
  );
}

function SectionLabel({ label, isCollapsed }: { label: string; isCollapsed: boolean }) {
  if (isCollapsed) return <div className="h-px bg-brand-line-12 my-2 mx-1" />;
  return <p className="font-jetbrains text-[10px] uppercase tracking-[0.16em] text-brand-on-ink-mute font-bold px-4 pt-3 pb-1">{label}</p>;
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
      'fixed left-4 top-4 bottom-4 bg-brand-ink rounded-2xl border border-brand-line-12 shadow-xl overflow-x-hidden flex-col justify-between py-6 z-40 hidden lg:flex transition-all duration-300',
      isCollapsed ? 'w-20 px-2' : 'w-64 px-4',
      className,
    )}>

      {/* Brand */}
      <div className={cn('flex items-center gap-3 mb-6', isCollapsed ? 'justify-center px-0' : 'px-2')}>
        <img src={testcrackLogo} alt="TestCrack" className="h-9 w-9 object-contain shrink-0" />
        {!isCollapsed && (
          <div className="animate-in fade-in duration-300 min-w-0">
            <span className="font-manrope text-base font-black tracking-tight text-brand-bg block truncate">
              TestCrack
            </span>
            <p className="font-jetbrains text-[10px] font-semibold tracking-[0.12em] uppercase text-brand-on-ink-mute leading-none mt-0.5">
              Institute Owner
            </p>
          </div>
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
              'w-full flex items-center gap-3 rounded-xl transition-colors duration-150 group relative',
              isCollapsed ? 'justify-center p-3' : 'px-4 py-3',
              activeTab === item.id
                ? 'bg-white/10 text-brand-on-ink'
                : 'text-brand-on-ink-mute/60 hover:bg-white/5 hover:text-brand-on-ink-mute',
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
            'bg-brand-warm/10 text-brand-warm border border-brand-warm/25',
            'hover:bg-brand-warm/20',
          )}
        >
          <ArrowLeftRight className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="font-semibold text-sm">Admin Portal</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-brand-teal-600 text-white p-1.5 rounded-full shadow-md hover:bg-brand-teal-700 transition-colors z-50 border-2 border-brand-bg"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Logout */}
      <div className="pt-4 border-t border-brand-line-12">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl text-brand-on-ink-mute hover:bg-brand-warm-danger/10 hover:text-brand-warm-danger transition-colors duration-150 group',
            isCollapsed ? 'justify-center p-3' : 'px-4 py-3',
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
};
