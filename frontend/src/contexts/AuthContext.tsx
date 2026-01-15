import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
  signInWithGitHub: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const ensuredUserIdsRef = useRef<Set<string>>(new Set());

  const ensureUserProfile = async (_authUser: User) => {
    // Best-effort: ensure a row exists in public.users for the auth user.
    // This prevents admin checks and profile pages from failing when DB trigger is missing.
    try {
      // Avoid repeated calls (can happen on initial session + auth state change)
      if (ensuredUserIdsRef.current.has(_authUser.id)) return;

      // First check if row already exists; if yes, don't write (prevents noisy /users upsert calls)
      const { data: existing, error: existsError } = await supabase
        .from('users')
        .select('id')
        .eq('id', _authUser.id)
        .maybeSingle();

      if (!existsError && existing?.id) {
        ensuredUserIdsRef.current.add(_authUser.id);
        return;
      }

      const username =
        (_authUser.user_metadata as any)?.username ||
        (_authUser.user_metadata as any)?.display_name ||
        _authUser.email?.split('@')[0] ||
        'User';

      // Try insert only (avoid upsert noise). If it fails, stop retrying to prevent repeated 400s in Network.
      const { error: insertError } = await supabase.from('users').insert({
        id: _authUser.id,
        username,
        display_name: (_authUser.user_metadata as any)?.display_name || username,
        avatar_id: 1,
      });

      if (insertError) {
        ensuredUserIdsRef.current.add(_authUser.id);
        console.warn('[Auth] ensureUserProfile insert failed:', insertError);
        return;
      }

      ensuredUserIdsRef.current.add(_authUser.id);
    } catch (e) {
      // Ignore to avoid blocking auth; admin pages will show a clearer message.
      ensuredUserIdsRef.current.add(_authUser.id);
      console.warn('[Auth] ensureUserProfile failed (check users table + RLS + trigger):', e);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

       if (session?.user) {
         // 确保 users 表中存在对应记录，避免权限检查时查不到用户
         ensureUserProfile(session.user);
       }

      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

       if (session?.user) {
         ensureUserProfile(session.user);
       }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: username,
        },
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  const signInWithGitHub = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, signInWithGoogle, signInWithGitHub }}>
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

