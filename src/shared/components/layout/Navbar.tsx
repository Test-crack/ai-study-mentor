import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  LogOut,
  Menu,
  X,
  Home,
  FileText,
  Video,
  BookMarked,
  TrendingUp,
  Star,
  User,
  GraduationCap,
  LayoutDashboard,
  Sparkles,
  LogIn,
  Zap,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { StepIndicator } from "@/features/speed-assessment/components/StepIndicator";
import { cn } from "@/shared/utils";
import { PremiumModal } from "@/features/payment";
interface Step {
  id: string;
  label: string;
  shortLabel?: string;
}

interface NavbarProps {
  showNavItems?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  showUpgradeButton?: boolean;
  onUpgradeClick?: () => void;
  showStepIndicator?: boolean;
  currentStep?: string;
  steps?: Step[];
  onStepClick?: (stepId: string) => void;
  allowStepNavigation?: boolean;
}

export function Navbar({
  showNavItems = true,
  activeTab,
  onTabChange,
  showUpgradeButton = true,
  onUpgradeClick,
  showStepIndicator = false,
  currentStep,
  steps = [],
  onStepClick,
  allowStepNavigation = false,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isInstructor = profile?.role === "INSTRUCTOR" || profile?.role === "ADMIN";
  const isHomePage = location.pathname === "/";
  const isLoggedIn = !!profile;

  const defaultNavItems = [
    { id: "dashboard", label: "Dashboard", icon: Home , },
    { id: "courses", label: "Courses", icon: GraduationCap, route: "/courses" },
    { id: "notes", label: "Notes", icon: FileText,route:"/notes" },
    { id: "youtube", label: "Videos", icon: Video ,route:"/youtube-ana"},
    { id: "guides", label: "Study Guides", icon: BookMarked  , route:"/study"},
    { id: "progress", label: "Progress", icon: TrendingUp,route:"/progress" },
    { id: "upgrage", label: "Upgrade", icon: Zap,route:"/pricing" },
  ];

  // On Home Page, we might want a simplified list or no center list, 
  // but let's strictly follow the "Buttons like courses, dash, login" request.
  // We'll treat these as the main "nav items" for the mobile menu interaction as well.
  const homeNavItems = [
    { id: "courses", label: "Courses", icon: GraduationCap, route: "/courses" },
  ];

  const displayedNavItems = isHomePage ? homeNavItems : defaultNavItems;

  const handleNavClick = (item: typeof defaultNavItems[0]) => {
    if (item.route) {
      navigate(item.route);
    } else if (location.pathname === "/" && onTabChange) {
      onTabChange(item.id);
    } else {
      navigate("/");
    }
    setMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
     if (isLoggedIn) {
         navigate("/dashboard");
     } else {
         navigate("/");
     }
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-xl border-b border-indigo-50/50 sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20"> 
            
            {/* Left Section: Logo & Mobile Menu */}
            <div className="flex items-center gap-6">
              {showNavItems && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              )}

              {/* Brand Logo */}
              <button
                onClick={handleLogoClick}
                className="group flex items-center gap-3 transition-transform active:scale-95"
              >
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-all duration-300">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight hidden sm:block">
                  TestCrack
                </span>
              </button>

              {/* Desktop Navigation */}
              {showNavItems && !isHomePage && (
                <div className="hidden lg:flex items-center space-x-1 ml-4">
                  {displayedNavItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
                          isActive
                            ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center gap-3">
              
              {/* HOME PAGE SPECIFIC ACTIONS */}
              {isHomePage ? (
                <>
                   <Button
                      onClick={() => navigate("/courses")}
                      variant="ghost"
                      className="hidden sm:flex text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-medium"
                   >
                     Courses
                   </Button>

                  {isLoggedIn ? (
                    <>
                       <Button
                          onClick={() => navigate("/dashboard")}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 rounded-full px-5 transition-all active:scale-95"
                       >
                         <LayoutDashboard className="h-4 w-4 mr-2" />
                         Dashboard
                       </Button>
                        {/* Simplified User Menu for Home Home Page */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleProfileClick}
                            className="rounded-full h-10 w-10 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                         >
                            <User className="h-5 w-5" />
                         </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => navigate("/auth")}
                      className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 rounded-full px-6 transition-all active:scale-95"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  )}
                </>
              ) : (
                /* DEFAULT APP ACTIONS */
                <>
                   

                  {isInstructor && (
                    <Button
                      onClick={() => navigate("/courses/admin/dashboard")}
                      variant="outline"
                      className="hidden sm:flex border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 rounded-full px-4"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Instructor
                    </Button>
                  )}

                  <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleProfileClick}
                      className="rounded-full h-10 w-10 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <User className="h-5 w-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={signOut}
                      className="rounded-full h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {showNavItems && mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed top-[80px] left-0 right-0 bg-white border-b shadow-xl z-40 lg:hidden animate-in slide-in-from-top-5 duration-300 rounded-b-3xl">
            <div className="max-w-7xl mx-auto px-6 py-6 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {displayedNavItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl text-sm font-medium transition-all duration-200 border",
                        isActive
                          ? "bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm"
                          : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", isActive ? "text-indigo-600" : "text-slate-400")} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              
              {/* Additional Mobile Actions for Home Page */}
              {isHomePage && (
                  !isLoggedIn ? (
                    <button
                        onClick={() => {
                            navigate("/auth");
                            setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-900 text-white font-bold shadow-lg shadow-slate-200 active:scale-95 transition-transform"
                    >
                      <LogIn className="h-5 w-5" />
                      Login
                    </button>
                  ) : (
                    <button
                        onClick={() => {
                            navigate("/dashboard");
                            setMobileMenuOpen(false);
                        }}
                         className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        Go to Dashboard
                    </button>
                  )
              )}


              {!isHomePage && isInstructor && (
                 <button
                   onClick={() => {
                     navigate("/courses/admin/dashboard");
                     setMobileMenuOpen(false);
                   }}
                   className="w-full flex items-center justify-center gap-2 p-4 mt-2 rounded-2xl bg-slate-900 text-white font-medium active:scale-95 transition-transform"
                 >
                   <LayoutDashboard className="h-5 w-5" />
                   Instructor Dashboard
                 </button>
              )}
              
               {(
                <button
                  onClick={onUpgradeClick}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
                >
                  <Sparkles className="h-5 w-5 text-yellow-200" />
                  Upgrade to Pro
                </button>
               )}
            </div>
          </div>
        </>
      )}

      {showStepIndicator && currentStep && steps.length > 0 && (
        <StepIndicator
          currentStep={currentStep}
          steps={steps}
          onStepClick={onStepClick}
          allowNavigation={allowStepNavigation}
        />
      )}
    </>
  );
}