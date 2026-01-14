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
  Users,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { StepIndicator } from "@/features/speed-assessment/components/StepIndicator";

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
  // Step indicator props
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "courses", label: "Courses", icon: GraduationCap, route: "/courses" },
    { id: "notes", label: "Notes", icon: FileText },
    { id: "youtube", label: "Videos", icon: Video },
    { id: "guides", label: "Study Guides", icon: BookMarked },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "admin", label: "Instructor", icon: Users, route: "/courses/admin/dashboard" },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    // If item has a route, navigate to it
    if (item.route) {
      navigate(item.route);
    } else if (location.pathname === "/" && onTabChange) {
      // If we're on the home page and have onTabChange, use tab navigation
      onTabChange(item.id);
    } else {
      // Otherwise navigate to home page
      navigate("/");
    }
    setMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (location.pathname === "/" && onTabChange) {
      onTabChange("dashboard");
    } else {
      navigate("/");
    }
  };

  const handleDashboardClick = () => {
    if (location.pathname === "/" && onTabChange) {
      onTabChange("dashboard");
    } else {
      navigate("/");
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              {/* Mobile Menu Button */}
              {showNavItems && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden p-2"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              )}

              <button
                onClick={handleLogoClick}
                className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent whitespace-nowrap hover:opacity-80 transition-opacity"
              >
                TestCrack
              </button>

              {/* Desktop Navigation */}
              {showNavItems && (
                <div className="hidden lg:flex space-x-2 xl:space-x-4">
                  {navItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "default" : "ghost"}
                      onClick={() => handleNavClick(item)}
                      className="text-xs xl:text-sm"
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Profile Button */}
              <Button
                variant="ghost"
                onClick={handleProfileClick}
                className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 p-2"
                size="sm"
              >
                <User className="h-4 w-4" />
              </Button>

              {/* Logout Button */}
              <Button
                variant="ghost"
                onClick={signOut}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                size="sm"
              >
                <LogOut className="h-4 w-4" />
              </Button>

              {/* Upgrade Button */}
              {showUpgradeButton && (
                <Button
                  onClick={onUpgradeClick}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:text-white px-2 sm:px-3"
                  size="sm"
                >
                  <Star className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline text-xs">Upgrade</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {showNavItems && mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-14 left-0 right-0 bg-white/95 backdrop-blur-md border-b shadow-lg z-40 lg:hidden animate-in slide-in-from-top duration-300">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    onClick={() => handleNavClick(item)}
                    className="w-full justify-start text-base py-6"
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Button>
                ))}

                {/* Mobile User Info - Removed */}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Step Indicator */}
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
