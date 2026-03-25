import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getUserProfile } from '../services/profile';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  countryCode: string | null;
  phoneNo: string | null;
  profileImage: string | null;
  username: string | null;
  role: 'STUDENT' | 'INSTRUCTOR' | 'SUPERADMIN' | 'INSTITUTE_OWNER' | 'INSTITUTE_ADMIN';
  Instructor?: {
    id: string;
    bio: string | null;
    specialization: string | null;
    rating: number | null;
    socialLinks: any | null;
  };
  createdAt: string;
  updatedAt: string;
  instituteIsActive?: boolean;
  isDiagnosed?: boolean;
  recommendationSeeded?: boolean;
  targetBand?: number | null;
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

  const fetchProfile = useCallback(async (force = false, silent = false) => {
    // If not forced and we already have a cached/stated profile, skip
    if (!force && profileRef.current) return;

    // Skip loader toggling during silent background refreshes to avoid unmounting the app router
    if (!silent) setProfileLoading(true);
    try {
      const data = await getUserProfile();
      if (data.user) {
        // Only update state if something actually changed — prevents re-renders on identical data
        if (JSON.stringify(data.user) !== JSON.stringify(profileRef.current)) {
          setProfile(data.user);
          localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data.user));
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      if (!silent) setProfileLoading(false);
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
          // Fire and forget — fetchProfile handles its own skips
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

        // ✅ FIX: Skip TOKEN_REFRESHED entirely — Supabase fires this on every tab
        // switch/window focus. The session data hasn't meaningfully changed, but
        // calling setSession/setUser with new object references would re-render
        // all consumers of useAuth (including dashboards), causing visible reloads.
        if (event === 'TOKEN_REFRESHED') {
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          localStorage.removeItem(PROFILE_CACHE_KEY);
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        const verifiedUser = session?.user?.email_confirmed_at ? session.user : null;

        // ✅ FIX: Only update session/user if the user ID actually changed.
        // Supabase creates a new session object on every event even if the user
        // is identical — new object reference → React re-renders all consumers.
        setSession(prev => prev?.user?.id === session?.user?.id ? prev : session);
        setUser(prev => prev?.id === verifiedUser?.id ? prev : verifiedUser);

        if (verifiedUser) {
          // If it's a new sign in or profile is missing, visibly show a loader.
          // Otherwise, fetch silently in the background.
          const isNewLogin = event === 'SIGNED_IN' || !profileRef.current;
          const silently = !isNewLogin;
          const shouldForceRefresh = event === 'SIGNED_IN' || event === 'USER_UPDATED' || !profileRef.current;

          fetchProfile(shouldForceRefresh, silently);
        } else {
          setProfile(null);
          localStorage.removeItem(PROFILE_CACHE_KEY);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const navigate = useNavigate();

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }

    setProfile(null);
    setSession(null);
    setUser(null);

    // Clear all app-specific keys
    localStorage.removeItem(PROFILE_CACHE_KEY);

    // Clear Supabase keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });

    navigate('/login', { replace: true });
  };

  const refreshProfile = useCallback(async () => {
    await fetchProfile(true);
  }, [fetchProfile]);

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