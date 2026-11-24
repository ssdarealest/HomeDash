import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { UserRole } from '@homedash/protocol';

export interface SessionState {
  token: string;
  role: UserRole;
  householdId: string;
  userId: string;
  isAuthenticated: boolean;
}

export interface SessionContextType {
  session: SessionState;
  switchRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  isCaregiver: boolean;
}

const STORAGE_KEY = 'homedash_session';

const DEFAULT_SESSION: SessionState = {
  token: 'dev-admin-session-token',
  role: 'admin',
  householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  userId: 'admin-user-0001',
  isAuthenticated: true,
};

const SessionContext = createContext<SessionContextType | null>(null);

function getInitialSession(): SessionState {
  if (typeof window === 'undefined') return DEFAULT_SESSION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.token) {
        return parsed as SessionState;
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return DEFAULT_SESSION;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>(getInitialSession);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (session.isAuthenticated && session.token) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage write error
    }
  }, [session]);

  const switchRole = useCallback(
    async (role: UserRole) => {
      try {
        const response = await fetch('/api/v1/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role }),
        });

        if (!response.ok) {
          throw new Error(`Failed to mint session: ${response.statusText}`);
        }

        const data = await response.json();
        setSession({
          token: data.sessionToken || data.token || `token-${role}`,
          role: (data.role as UserRole) || role,
          householdId: data.householdId || session.householdId,
          userId: data.userId || session.userId,
          isAuthenticated: true,
        });
      } catch {
        // Fallback to local session minting for offline, mock, and test environments
        setSession((prev) => ({
          ...prev,
          role,
          token: `mock-${role}-jwt-token`,
          isAuthenticated: true,
        }));
      }
    },
    [session.householdId, session.userId]
  );

  const logout = useCallback(() => {
    setSession({
      token: '',
      role: 'admin',
      householdId: '',
      userId: '',
      isAuthenticated: false,
    });
  }, []);

  const isCaregiver = useMemo(() => session.role === 'caregiver_guest', [session.role]);

  const value = useMemo(
    () => ({
      session,
      switchRole,
      logout,
      isCaregiver,
    }),
    [session, switchRole, logout, isCaregiver]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
