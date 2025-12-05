import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User as AuthUser } from '@supabase/supabase-js';
import { supabase, User } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  authUser: AuthUser | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Build user object directly from auth metadata (NO database query needed!)
  const buildUserFromAuth = useCallback((authUser: AuthUser): User => {
    const metadata = authUser.user_metadata || {};
    return {
      id: authUser.id,
      email: authUser.email || '',
      full_name: metadata.full_name || '',
      role: metadata.role || 'employee',
      city_id: metadata.city_id || null,
      created_at: authUser.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }, []);

  const refreshUser = useCallback(async () => {
    // Refresh session to get latest metadata
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setAuthUser(session.user);
      setUser(buildUserFromAuth(session.user));
    }
  }, [buildUserFromAuth]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      
      // ✅ Build user directly from auth metadata (instant, no database query!)
      if (session?.user) {
        setUser(buildUserFromAuth(session.user));
      }
      
      setLoading(false);
    }).catch((err) => {
      console.error('Error getting session:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setAuthUser(session?.user ?? null);
        
        // ✅ Build user directly from auth metadata (instant!)
        if (session?.user) {
          setUser(buildUserFromAuth(session.user));
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [buildUserFromAuth]);

  const signIn = async (email: string, password: string) => {
    // Don't set global loading state - let the Login component handle its own loading state
    try {
      // Authenticate with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Provide user-friendly error messages
        if (authError.message.toLowerCase().includes('invalid login credentials') ||
            authError.message.toLowerCase().includes('invalid credentials')) {
          return { error: 'Invalid email or password. Please check your credentials and try again.' };
        } else if (authError.message.toLowerCase().includes('email not confirmed')) {
          return { error: 'Please verify your email address before logging in.' };
        } else if (authError.message.toLowerCase().includes('too many requests')) {
          return { error: 'Too many login attempts. Please wait a few minutes and try again.' };
        } else if (authError.message.toLowerCase().includes('network')) {
          return { error: 'Network error. Please check your internet connection and try again.' };
        } else {
          return { error: `Login failed: ${authError.message}` };
        }
      }

      if (!data.user) {
        return { error: 'Authentication failed. Please try again or contact your administrator.' };
      }

      // ✅ Build user directly from auth metadata (instant!)
      const userProfile = buildUserFromAuth(data.user);

      // Set user state
      setUser(userProfile);
      setSession(data.session);
      setAuthUser(data.user);
      return { error: null };
    } catch (err) {
      await supabase.auth.signOut();
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('Login error:', err);
      return { error: `Login failed: ${errorMessage}. Please contact your administrator for assistance.` };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      authUser,
      user,
      loading,
      signIn,
      signOut,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
