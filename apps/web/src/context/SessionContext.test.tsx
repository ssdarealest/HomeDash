import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { SessionProvider, useSession } from './SessionContext';
import type { UserRole } from '@homedash/protocol';

describe('SessionContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default admin session and isCaregiver as false', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current.session.role).toBe('admin');
    expect(result.current.session.isAuthenticated).toBe(true);
    expect(result.current.session.householdId).toBeDefined();
    expect(result.current.session.userId).toBeDefined();
    expect(result.current.session.token).toBeDefined();
    expect(result.current.isCaregiver).toBe(false);
  });

  it('switches role to caregiver_guest and updates isCaregiver to true', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sessionToken: 'mock-caregiver-jwt-token',
        role: 'caregiver_guest',
        householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        userId: 'caregiver-user-123',
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      await result.current.switchRole('caregiver_guest');
    });

    expect(result.current.session.role).toBe('caregiver_guest');
    expect(result.current.session.token).toBe('mock-caregiver-jwt-token');
    expect(result.current.isCaregiver).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/auth/session',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'caregiver_guest' }),
      })
    );
  });

  it('falls back to local session minting if backend fetch fails', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      await result.current.switchRole('senior');
    });

    expect(result.current.session.role).toBe('senior');
    expect(result.current.isCaregiver).toBe(false);
    expect(result.current.session.token).toBeDefined();
  });

  it('resets session on logout', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider>{children}</SessionProvider>
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.session.isAuthenticated).toBe(false);
    expect(result.current.session.token).toBe('');
  });

  it('throws error when useSession is used outside SessionProvider', () => {
    expect(() => {
      renderHook(() => useSession());
    }).toThrow('useSession must be used within a SessionProvider');
  });
});
