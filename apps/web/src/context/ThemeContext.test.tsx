import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-surface');
  });

  it('initializes with default dark theme and glass surface', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('dark');
    expect(result.current.surface).toBe('glass');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-surface')).toBe('glass');
  });

  it('toggles theme between dark and light', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(localStorage.getItem('homedash_theme')).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('homedash_theme')).toBe('dark');
  });

  it('toggles surface styling between glass and solid', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.toggleSurface();
    });

    expect(result.current.surface).toBe('solid');
    expect(document.documentElement.getAttribute('data-surface')).toBe('solid');
    expect(localStorage.getItem('homedash_surface')).toBe('solid');

    act(() => {
      result.current.toggleSurface();
    });

    expect(result.current.surface).toBe('glass');
    expect(document.documentElement.getAttribute('data-surface')).toBe('glass');
    expect(localStorage.getItem('homedash_surface')).toBe('glass');
  });

  it('restores persisted theme and surface from localStorage', () => {
    localStorage.setItem('homedash_theme', 'light');
    localStorage.setItem('homedash_surface', 'solid');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('light');
    expect(result.current.surface).toBe('solid');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.getAttribute('data-surface')).toBe('solid');
  });

  it('throws error when useTheme is used outside ThemeProvider', () => {
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');
  });
});
