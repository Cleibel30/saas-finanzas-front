'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/src/infrastructure/supabase/browser';
import type { User } from '@/src/domain/entities/User';

interface SessionState {
  session: unknown | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const initialState: SessionState = {
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>(initialState);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setState(mapSessionToState(session));
      } else {
        setState({ ...initialState, isLoading: false });
      }
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          setState(mapSessionToState(session));
        } else {
          setState({ ...initialState, isLoading: false });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

function mapSessionToState(session: { user: { id: string; user_metadata?: Record<string, unknown>; email?: string; app_metadata?: Record<string, unknown>; created_at?: string } }): SessionState {
  const u = session.user;
  const role = (u.app_metadata?.role as string) ?? 'USER';
  return {
    session,
    user: {
      id: u.id,
      name: (u.user_metadata?.name as string) ?? (u.email as string) ?? '',
      email: (u.email as string) ?? '',
      role: (role === 'ADMIN' ? 'ADMIN' : 'USER') as 'USER' | 'ADMIN',
      tokenBalance: (u.user_metadata?.tokenBalance as number) ?? 0,
      isSuspended: (u.app_metadata?.isSuspended as boolean) ?? (u.user_metadata?.isSuspended as boolean) ?? false,
      createdAt: u.created_at ?? '',
    },
    isLoading: false,
    isAuthenticated: true,
  };
}
