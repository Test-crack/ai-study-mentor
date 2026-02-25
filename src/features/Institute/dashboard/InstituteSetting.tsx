import React, { useState } from 'react';
import { Building2, Palette, Bell, Check } from 'lucide-react';
import { InstituteSidebar } from '../components/InstituteSidebar';
import { InstituteTopbar } from '../components/InstituteTopbar';

export default function InstituteSettings() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Form States
  const [profile, setProfile] = useState({
    name: 'Ace English Academy',
    email: 'admin@ace-english.edu',
    phone: '+91 9876543210',
    address: '123 Education Street, Mumbai',
  });

  const [branding, setBranding] = useState({
    domain: 'learn.ace-english.edu',
    logo: 'https://...',
  });

  const [notifications, setNotifications] = useState({
    studentEnrollment: true,
    tutorApplication: false,
    batchCapacity: true,
    monthlyReport: true,
  });

  // Toast State
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Toast Helper
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: '', visible: false });
    }, 3000);
  };

  // Handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile updated');
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Branding saved');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Preferences saved');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0A10] font-sans text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="hidden lg:block">
        <InstituteSidebar 
          activeTab="settings" 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>

      <div className={`transition-all duration-300 flex flex-col min-h-screen ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Topbar */}
        <InstituteTopbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[900px] mx-auto space-y-6">
            
            {/* Institute Profile Card */}
            <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm transition-colors overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-[#2D1F4D] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-indigo-600 dark:text-[#A67CFF]" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Institute Profile</h2>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Institute Name</label>
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] transition-colors text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Contact Email</label>
                      <input 
                        type="email" 
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] transition-colors text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Phone</label>
                      <input 
                        type="text" 
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] transition-colors text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Address</label>
                      <input 
                        type="text" 
                        value={profile.address}
                        onChange={(e) => setProfile({...profile, address: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] transition-colors text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            </div>

            {/* Branding Card */}
            <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm transition-colors overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#1F3A4D] flex items-center justify-center shrink-0">
                    <Palette className="w-4 h-4 text-blue-600 dark:text-[#7CBAFF]" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Branding</h2>
                </div>

                <form onSubmit={handleSaveBranding} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Custom Domain</label>
                      <input 
                        type="text" 
                        value={branding.domain}
                        onChange={(e) => setBranding({...branding, domain: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] transition-colors text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500 dark:text-gray-400">Logo URL</label>
                      <input 
                        type="text" 
                        value={branding.logo}
                        onChange={(e) => setBranding({...branding, logo: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[#0A0A0B] border border-slate-200 dark:border-[#26252D] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-[#8B5CF6] transition-colors text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-[#26252D] dark:hover:bg-[#2E2D38] dark:text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Update Branding
                  </button>
                </form>
              </div>
            </div>

            {/* Notification Preferences Card */}
            <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-xl shadow-sm transition-colors overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-[#4D1F2D] flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-rose-600 dark:text-[#FF7C9C]" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notification Preferences</h2>
                </div>

                <form onSubmit={handleSaveNotifications} className="space-y-6">
                  <div className="flex flex-col gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={notifications.studentEnrollment}
                        onChange={(e) => setNotifications({...notifications, studentEnrollment: e.target.checked})}
                        className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-rose-600 dark:text-rose-500 focus:ring-rose-500/50 bg-transparent transition-colors cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-gray-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        New student enrollment
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={notifications.tutorApplication}
                        onChange={(e) => setNotifications({...notifications, tutorApplication: e.target.checked})}
                        className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-rose-600 dark:text-rose-500 focus:ring-rose-500/50 bg-transparent transition-colors cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-gray-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        Tutor application
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={notifications.batchCapacity}
                        onChange={(e) => setNotifications({...notifications, batchCapacity: e.target.checked})}
                        className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-rose-600 dark:text-rose-500 focus:ring-rose-500/50 bg-transparent transition-colors cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-gray-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        Batch capacity alert
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={notifications.monthlyReport}
                        onChange={(e) => setNotifications({...notifications, monthlyReport: e.target.checked})}
                        className="w-4 h-4 rounded border-slate-300 dark:border-gray-600 text-rose-600 dark:text-rose-500 focus:ring-rose-500/50 bg-transparent transition-colors cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-gray-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        Monthly report ready
                      </span>
                    </label>
                  </div>
                  
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-[#26252D] dark:hover:bg-[#2E2D38] dark:text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Save Preferences
                  </button>
                </form>
              </div>
            </div>

          </div>
        </main>

        {/* Toast Notification */}
        {toast.visible && (
          <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in-up z-50">
            <div className="bg-emerald-500/20 dark:bg-emerald-100 rounded-full p-1">
              <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            </div>
            <p className="text-sm font-medium pr-2">{toast.message}</p>
          </div>
        )}

      </div>
    </div>
  );
}