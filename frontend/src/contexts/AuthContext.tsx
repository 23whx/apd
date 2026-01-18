import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  adminChecked: boolean;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const ensuredUserIdsRef = useRef<Set<string>>(new Set());
  const ensuringUserIdsRef = useRef<Set<string>>(new Set());
  const adminCheckedForUserRef = useRef<string | null>(null);
  const adminCheckInFlightRef = useRef<Set<string>>(new Set());
  const adminCheckAttemptsRef = useRef<Map<string, number>>(new Map());

  const ensureUserProfile = async (_authUser: User) => {
    // Best-effort: ensure a row exists in public.users for the auth user.
    // This prevents admin checks and profile pages from failing when DB trigger is missing.
    try {
      // Avoid repeated calls (can happen on initial session + auth state change)
      if (ensuredUserIdsRef.current.has(_authUser.id)) return;
      // Avoid concurrent calls (React StrictMode/dev double-invokes effects can overlap)
      if (ensuringUserIdsRef.current.has(_authUser.id)) return;
      ensuringUserIdsRef.current.add(_authUser.id);

      const username =
        (_authUser.user_metadata as any)?.username ||
        (_authUser.user_metadata as any)?.display_name ||
        _authUser.email?.split('@')[0] ||
        'User';

      // Some older schemas may require email NOT NULL; others don't even have an email column.
      // We'll try insert with email when available, and gracefully fall back if the column doesn't exist.
      const basePayload: any = {
        id: _authUser.id,
        username,
        display_name: (_authUser.user_metadata as any)?.display_name || username,
        avatar_id: 1,
      };

      // If user has no email (e.g., certain auth providers / phone auth), don't attempt an insert that would violate NOT NULL.
      if (!_authUser.email) {
        ensuredUserIdsRef.current.add(_authUser.id);
        ensuringUserIdsRef.current.delete(_authUser.id);
        return;
      }

      // If profile already exists, skip writes entirely (avoids noisy 409 conflicts)
      const { data: existing, error: existsError } = await supabase
        .from('users')
        .select('id')
        .eq('id', _authUser.id)
        .maybeSingle();

      if (!existsError && existing?.id) {
        ensuredUserIdsRef.current.add(_authUser.id);
        ensuringUserIdsRef.current.delete(_authUser.id);
        return;
      }

      // If we can't verify existence due to network/RLS issues, don't spam writes; retry next time.
      if (existsError) {
        ensuringUserIdsRef.current.delete(_authUser.id);
        return;
      }

      const payloadWithEmail = { ...basePayload, email: _authUser.email };

      // Try insert only (avoid upsert noise). If it fails, stop retrying to prevent repeated 400s in Network.
      let { error: insertError } = await supabase.from('users').insert(payloadWithEmail);

      // If the schema doesn't have `email`, retry without it.
      if (insertError && (insertError as any)?.code === '42703') {
        ({ error: insertError } = await supabase.from('users').insert(basePayload));
      }

      if (insertError) {
        // Duplicate primary key just means the profile row already exists (race / trigger). Treat as success.
        if ((insertError as any)?.code === '23505') {
          ensuredUserIdsRef.current.add(_authUser.id);
          ensuringUserIdsRef.current.delete(_authUser.id);
          return;
        }
        ensuredUserIdsRef.current.add(_authUser.id);
        ensuringUserIdsRef.current.delete(_authUser.id);
        console.warn('[Auth] ensureUserProfile insert failed:', insertError);
        return;
      }

      ensuredUserIdsRef.current.add(_authUser.id);
      ensuringUserIdsRef.current.delete(_authUser.id);
    } catch (e) {
      // Ignore to avoid blocking auth; admin pages will show a clearer message.
      ensuredUserIdsRef.current.add(_authUser.id);
      ensuringUserIdsRef.current.delete(_authUser.id);
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

  // Centralized admin check (cached). All admin pages should use this instead of querying users.role themselves.
  useEffect(() => {
    if (loading) return;

    if (!user) {
      setIsAdmin(false);
      setAdminChecked(true);
      adminCheckedForUserRef.current = null;
      adminCheckAttemptsRef.current.clear();
      return;
    }

    const userId = user.id;
    if (adminCheckedForUserRef.current === userId) {
      return;
    }
    if (adminCheckInFlightRef.current.has(userId)) {
      return;
    }

    adminCheckInFlightRef.current.add(userId);
    setAdminChecked(false);

    (async () => {
      try {
        // Ensure public.users row exists before role lookup to avoid false "no permission"
        await ensureUserProfile(user);

        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        // If row doesn't exist yet (data null) or role missing, retry a few times instead of caching false.
        if (error || !data || !(data as any)?.role) {
          const attempts = (adminCheckAttemptsRef.current.get(userId) ?? 0) + 1;
          adminCheckAttemptsRef.current.set(userId, attempts);

          if (attempts < 4) {
            // brief backoff; keep adminChecked=false so admin pages stay in "Checking permissions..."
            setTimeout(() => {
              adminCheckInFlightRef.current.delete(userId);
              // allow effect to run again (userId not cached)
              adminCheckedForUserRef.current = null;
              // flip checked to force re-render; effect depends on user?.id + loading, but re-render is enough
              setAdminChecked(false);
            }, 600 * attempts);
            return;
          }

          if (error) {
            console.warn('[Auth] admin role check failed:', error);
          } else {
            console.warn('[Auth] admin role missing or users row not found after retries');
          }
          setIsAdmin(false);
          adminCheckedForUserRef.current = userId;
          return;
        }

        const role = (data as any)?.role as string;
        setIsAdmin(role === 'admin' || role === 'mod');
        adminCheckedForUserRef.current = userId;
      } finally {
        adminCheckInFlightRef.current.delete(userId);
        setAdminChecked(true);
      }
    })();
  }, [loading, user?.id]);

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
    <AuthContext.Provider value={{ user, session, loading, isAdmin, adminChecked, signUp, signIn, signOut, signInWithGoogle, signInWithGitHub }}>
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

