import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { 
  LayoutDashboard, 
  BarChart3, 
  LogOut, 
  Bell,
  GraduationCap,
  ChevronLeft
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, route: "/courses/admin/dashboard" },
    { id: "analytics", label: "Analytics", icon: BarChart3, route: "/courses/admin/analytics" },
  ];

  const activeTab = navItems.find(item => item.route === location.pathname)?.id || "dashboard";

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Section Title */}
          <div className="flex items-center space-x-10">
            <button
              onClick={() => navigate("/")}
              className="flex flex-col items-start hover:opacity-80 transition-opacity group"
            >
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                TestCrack
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 -mt-1 group-hover:text-indigo-500 transition-colors">
                Instructor
              </span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => navigate(item.route)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === item.id 
                      ? "text-indigo-600 bg-indigo-50/50" 
                      : "text-gray-500 hover:text-indigo-600 hover:bg-gray-50 font-medium"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${activeTab === item.id ? "text-indigo-600" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden lg:flex items-center space-x-2 border-gray-200 text-gray-600 hover:bg-gray-50"
              onClick={() => navigate("/courses")}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Student View</span>
            </Button>

            <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-indigo-600">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </Button>

            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            <div className="flex items-center space-x-3 pl-2">
                <div className="hidden lg:block text-right">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{user?.email?.split('@')[0] || "Instructor"}</p>
                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter mt-0.5">Pro Mentor</p>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 hover:bg-transparent"
                    onClick={() => navigate("/profile")}
                >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md transition-transform hover:scale-105 active:scale-95">
                        {user?.email?.[0].toUpperCase() || "I"}
                    </div>
                </Button>
            </div>

            <Button 
                variant="ghost" 
                size="icon" 
                onClick={signOut}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-xl"
            >
                <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
