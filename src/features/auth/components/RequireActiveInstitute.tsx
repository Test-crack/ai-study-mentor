import React, { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AlertTriangle, Mail, LogOut } from 'lucide-react';
import { Outlet } from 'react-router-dom';

export const RequireActiveInstitute = ({ children }: { children?: React.ReactNode }) => {
  const { profile, loading, profileLoading, signOut } = useAuth();

  // ✅ THE FIX: Only return null if we are loading AND we don't have the profile yet.
  // If we already have the profile, let it fetch in the background without destroying the UI!
  if ((loading || profileLoading) && !profile) return null;

  const isRelevantRole = profile?.role === 'INSTITUTE_OWNER' || profile?.role === 'INSTITUTE_ADMIN';
  const isDeactivated = isRelevantRole && profile?.instituteIsActive === false;

  return (
    <div className={isDeactivated ? "fixed inset-0 overflow-hidden bg-slate-50 dark:bg-[#0A0A0A]" : "relative min-h-screen"}>
      <div 
        {...(isDeactivated ? { inert: "" } : {})}
        className={isDeactivated ? "pointer-events-none blur-md select-none opacity-40 h-full w-full overflow-hidden" : ""}
      >
        {children || <Outlet />}
      </div>
      
      {isDeactivated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#15141B] border border-red-200 dark:border-red-900/50 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center transform transition-all">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Access Revoked
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm leading-relaxed">
              Your institute has been deactivated by the administration. You can no longer access the dashboard or its contents.
            </p>
            
            <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-4 border border-slate-100 dark:border-[#26252D] mb-6">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-2">
                Please Contact Support
              </p>
              <a 
                href="mailto:blinkgrid@gmail.com" 
                className="flex items-center justify-center gap-2 text-brand-teal-600 dark:text-brand-teal-400 font-semibold hover:underline"
              >
                <Mail className="w-4 h-4" />
                blinkgrid@gmail.com
              </a>
            </div>

            <button 
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black py-3 rounded-xl font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out of account
            </button>
          </div>
        </div>
      )}
    </div>
  );
};