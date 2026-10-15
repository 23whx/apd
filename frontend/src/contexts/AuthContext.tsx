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
  // Which user the current isAdmin value belongs to; avoids exposing a stale result after login/account switch.
  const [adminCheckedUserId, setAdminCheckedUserId] = useState<string | null>(null);
  const ensuredUserIdsRef = useRef<Set<string>>(new Set());
  const ensuringUserIdsRef = useRef<Set<string>>(new Set());

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

  // Centralized admin check (cached per user). All admin pages should use this instead of querying users.role themselves.
  useEffect(() => {
    if (loading) return;

    if (!user) {
      setIsAdmin(false);
      setAdminCheckedUserId(null);
      return;
    }

    const authUser = user;
    let cancelled = false;

    (async () => {
      // Ensure public.users row exists before role lookup to avoid false "no permission"
      await ensureUserProfile(authUser);

      // The profile row may be created slightly later (trigger / concurrent insert), so retry a few times.
      for (let attempt = 1; attempt <= 4 && !cancelled; attempt++) {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .maybeSingle();

        if (cancelled) return;

        const role = (data as { role?: string } | null)?.role;
        if (!error && role) {
          setIsAdmin(role === 'admin' || role === 'mod');
          setAdminCheckedUserId(authUser.id);
          return;
        }

        if (attempt === 4) {
          console.warn('[Auth] admin role check failed or role missing after retries:', error);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
      }

      if (!cancelled) {
        setIsAdmin(false);
        setAdminCheckedUserId(authUser.id);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const adminChecked = !loading && (user ? adminCheckedUserId === user.id : true);
  const effectiveIsAdmin = adminChecked && !!user && isAdmin;

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin: effectiveIsAdmin, adminChecked, signUp, signIn, signOut, signInWithGoogle, signInWithGitHub }}>
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

