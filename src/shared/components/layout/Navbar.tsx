import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  LogOut, Menu, X, Home, FileText, Video, BookMarked,
  TrendingUp, User, GraduationCap, Zap
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/shared/utils";

interface NavbarProps {
  showNavItems?: boolean;
  showUpgradeButton?: boolean;
  onUpgradeClick?: () => void;
}

export function Navbar({
  showNavItems = true,
  showUpgradeButton = true,
  onUpgradeClick,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isInstructor = profile?.role === "INSTRUCTOR" || profile?.role === "ADMIN";
  const isHomePage = location.pathname === "/";
  const isLoggedIn = !!profile;

  // These paths match the /dashboard/:tab pattern in App.tsx
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
    { id: "courses", label: "Courses", icon: GraduationCap, path: "/courses" },
    { id: "notes", label: "Notes", icon: FileText, path: "/dashboard/notes" },
    { id: "youtube", label: "Videos", icon: Video, path: "/dashboard/youtube" },
    { id: "guides", label: "Study Guides", icon: BookMarked, path: "/dashboard/guides" },
    { id: "progress", label: "Progress", icon: TrendingUp, path: "/dashboard/progress" },
  ];

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const handleUpgradeClick = () => {
    setMobileMenuOpen(false);
    // If already on dashboard, trigger the modal immediately
    if (location.pathname.startsWith('/dashboard')) {
      onUpgradeClick?.();
    } else {
      // If elsewhere, navigate to dashboard and pass state to trigger modal
      navigate("/dashboard", { state: { openUpgrade: true } });
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-xl border-b border-indigo-50/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-6">
            {showNavItems && (
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            )}

            <button onClick={() => {
              if (isLoggedIn) {
                 if (profile?.role === 'INSTRUCTOR' || profile?.role === 'ADMIN') {
                   navigate('/instructor/dashboard');
                 } else {
                   navigate('/student/dashboard');
                 }
              } else {
                navigate('/');
              }
            }}
             className="flex items-center gap-3 active:scale-95 transition-transform">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-xl shadow-lg">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 hidden sm:block">
                TestCrack
              </span>
            </button>

            {showNavItems && !isHomePage && (
              <div className="hidden lg:flex items-center space-x-1 ml-4">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.path)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-200",
                        isActive 
                          ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isHomePage ? (
              <div className="flex items-center gap-2">
                {isInstructor && (
                  <Button onClick={() => navigate("/instructor/dashboard")} variant="outline" className="hidden sm:flex rounded-full">
                    Instructor
                  </Button>
                )}
                {showUpgradeButton && (
                  <Button onClick={handleUpgradeClick} variant="ghost" size="icon" className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full h-10 w-10">
                    <Zap className="fill-current h-5 w-5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} className="rounded-full h-10 w-10 text-slate-500"><User className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" onClick={signOut} className="text-slate-400 hover:text-red-600 rounded-full h-10 w-10 transition-colors"><LogOut className="h-5 w-5" /></Button>
              </div>
            ) : (
              <Button onClick={() => {
                if (isLoggedIn) {
                   if (profile?.role === 'INSTRUCTOR' || profile?.role === 'ADMIN') {
                     navigate('/instructor/dashboard');
                   } else {
                     navigate('/student/dashboard');
                   }
                } else {
                  navigate('/auth');
                }
              }} className="bg-indigo-600 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all">
                {isLoggedIn ? "Dashboard" : "Login"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed top-[80px] inset-x-0 bg-white border-b p-6 space-y-3 lg:hidden z-50 rounded-b-3xl shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl border text-sm font-medium transition-all",
                  location.pathname === item.path 
                    ? "bg-indigo-50 border-indigo-100 text-indigo-700" 
                    : "bg-white border-slate-100 text-slate-600"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
            {!isHomePage && showUpgradeButton && (
              <button onClick={handleUpgradeClick} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-amber-50 text-amber-700 font-bold border border-amber-100 active:scale-95 transition-transform">
                <Zap className="fill-current h-5 w-5" /> Upgrade to Premium
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}