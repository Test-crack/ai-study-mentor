import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getUserProfile } from '../services/profile';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  countryCode: string | null;
  phoneNo: string | null;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  Instructor?: {
    id: string;
    bio: string | null;
    specialization: string | null;
    rating: number | null;
    socialLinks: any | null;
  };
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_CACHE_KEY = 'ts_user_profile';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Use a ref to access the current profile in callbacks without creating dependency loops
  const profileRef = useRef<UserProfile | null>(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfile = useCallback(async (force = false) => {
    // If not forced and we already have a cached/stated profile, skip
    if (!force && profileRef.current) return;
    
    setProfileLoading(true);
    try {
      const data = await getUserProfile();
      if (data.user) {
        setProfile(data.user);
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, []); // Truly stable callback

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const verifiedUser = session?.user?.email_confirmed_at ? session.user : null;
        setSession(session);
        setUser(verifiedUser);
        
        if (verifiedUser) {
          // Fire and forget, fetchProfile handles its own skips
          fetchProfile();
        }
      } catch (error) {
        console.error('Error during initAuth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          localStorage.removeItem(PROFILE_CACHE_KEY);
          setSession(session);
          setUser(null);
          setLoading(false);
          return;
        }

        const verifiedUser = session?.user?.email_confirmed_at ? session.user : null;
        setSession(session);
        setUser(verifiedUser);
        
        if (verifiedUser) {
          // If it's a new sign in or update, force a fresh profile fetch
          fetchProfile(event === 'SIGNED_IN' || event === 'USER_UPDATED');
        } else {
          setProfile(null);
          localStorage.removeItem(PROFILE_CACHE_KEY);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    localStorage.removeItem(PROFILE_CACHE_KEY);
    window.location.href = '/auth';
  };

  const refreshProfile = async () => {
    await fetchProfile(true);
  };

  const value = {
    user,
    session,
    loading,
    profile,
    profileLoading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
