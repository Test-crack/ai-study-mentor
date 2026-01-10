import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // For password recovery, allow the session even if email isn't confirmed yet
        // This is needed because the recovery flow creates a temporary session
        if (event === 'PASSWORD_RECOVERY') {
          setSession(session);
          setUser(session?.user || null);
          setLoading(false);
          return;
        }
        
        // Only set user if email is confirmed for normal auth flows
        const verifiedUser = session?.user?.email_confirmed_at ? session.user : null;
        setSession(session);
        setUser(verifiedUser);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Only set user if email is confirmed
      const verifiedUser = session?.user?.email_confirmed_at ? session.user : null;
      setSession(session);
      setUser(verifiedUser);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Redirect to login page after signing out
    window.location.href = '/auth';
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};