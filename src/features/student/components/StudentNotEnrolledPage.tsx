import React from 'react';
import { Building2, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function StudentNotEnrolledPage() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#15141B] border border-slate-200 dark:border-[#26252D] rounded-2xl p-8 max-w-md w-full shadow-xl text-center">

        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          No Institute Access
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
          Your account isn't linked to any institute yet. Ask your institute admin to enroll you — once they do, you'll have full access.
        </p>

        <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-4 border border-slate-100 dark:border-[#26252D] mb-6">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Need help?
          </p>
          <a
            href="mailto:blinkgrid@gmail.com"
            className="flex items-center justify-center gap-2 text-brand-teal-600 dark:text-brand-teal-400 font-semibold text-sm hover:underline"
          >
            <Mail className="w-4 h-4" />
            blinkgrid@gmail.com
          </a>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
