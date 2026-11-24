import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import React from 'react';
import { DocumentationPortal } from './DocumentationPortal';
import { DocsPage } from '../pages/DocsPage';
import App from '../App';
import { quickstartDoc } from '../docs/quickstart';
import { environmentVariablesDoc } from '../docs/environment-variables';
import { cryptographyDoc } from '../docs/cryptography';
import { apiReferenceDoc } from '../docs/api-reference';

describe('Documentation Portal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.location.hash = '';
  });

  describe('Documentation Articles Content', () => {
    it('defines Quickstart documentation with docker compose, Caddy, and onboarding details', () => {
      expect(quickstartDoc.id).toBe('quickstart');
      expect(quickstartDoc.title).toMatch(/Quickstart/i);
      expect(JSON.stringify(quickstartDoc)).toMatch(/docker compose up -d/i);
      expect(JSON.stringify(quickstartDoc)).toMatch(/Caddy/i);
      expect(JSON.stringify(quickstartDoc)).toMatch(/onboarding/i);
    });

    it('defines Environment Variables reference with required flags', () => {
      expect(environmentVariablesDoc.id).toBe('environment-variables');
      expect(environmentVariablesDoc.title).toMatch(/Environment Variables/i);
      const contentStr = JSON.stringify(environmentVariablesDoc);
      expect(contentStr).toMatch(/POSTGRES_/);
      expect(contentStr).toMatch(/VALKEY_/);
      expect(contentStr).toMatch(/MINIO_/);
      expect(contentStr).toMatch(/JWT_SECRET/);
      expect(contentStr).toMatch(/WEBAUTHN_/);
      expect(contentStr).toMatch(/PORT/);
    });

    it('defines Cryptography architecture reference with Argon2id, XChaCha20, and Shamir escrow', () => {
      expect(cryptographyDoc.id).toBe('cryptography');
      expect(cryptographyDoc.title).toMatch(/Cryptography/i);
      const contentStr = JSON.stringify(cryptographyDoc);
      expect(contentStr).toMatch(/Argon2id/i);
      expect(contentStr).toMatch(/64\s*MB/i);
      expect(contentStr).toMatch(/XChaCha20-Poly1305/i);
      expect(contentStr).toMatch(/Shamir/i);
      expect(contentStr).toMatch(/2-of-3/i);
    });

    it('defines API Reference covering Auth, Sync, Realtime SSE, and Domain APIs', () => {
      expect(apiReferenceDoc.id).toBe('api-reference');
      expect(apiReferenceDoc.title).toMatch(/API Reference/i);
      const contentStr = JSON.stringify(apiReferenceDoc);
      expect(contentStr).toMatch(/\/api\/v1\/realtime\/stream/);
      expect(contentStr).toMatch(/Sync/i);
      expect(contentStr).toMatch(/Auth/i);
      expect(contentStr).toMatch(/Daily Ops/i);
      expect(contentStr).toMatch(/Health/i);
      expect(contentStr).toMatch(/Finance/i);
      expect(contentStr).toMatch(/Break-Glass/i);
    });
  });

  describe('Topic Navigation & Switching', () => {
    it('renders sidebar navigation items and switches between topics', () => {
      render(<DocumentationPortal />);

      const topicsNav = screen.getByRole('navigation', { name: /documentation topics/i });

      // Sidebar topic buttons
      expect(within(topicsNav).getByRole('button', { name: /quickstart/i })).toBeDefined();
      expect(within(topicsNav).getByRole('button', { name: /environment variables/i })).toBeDefined();
      expect(within(topicsNav).getByRole('button', { name: /cryptography/i })).toBeDefined();
      expect(within(topicsNav).getByRole('button', { name: /api reference/i })).toBeDefined();

      // Default topic is Quickstart
      expect(screen.getByRole('heading', { level: 1, name: /quickstart/i })).toBeDefined();
      expect(screen.getByText(/docker compose up -d/i)).toBeDefined();

      // Switch to Environment Variables
      fireEvent.click(within(topicsNav).getByRole('button', { name: /environment variables/i }));
      expect(screen.getByRole('heading', { level: 1, name: /environment variables/i })).toBeDefined();
      expect(screen.getAllByText(/POSTGRES_USER/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/JWT_SECRET/i).length).toBeGreaterThan(0);

      // Switch to Cryptography
      fireEvent.click(within(topicsNav).getByRole('button', { name: /cryptography/i }));
      expect(screen.getByRole('heading', { level: 1, name: /cryptography/i })).toBeDefined();
      expect(screen.getAllByText(/XChaCha20-Poly1305/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Argon2id/i).length).toBeGreaterThan(0);

      // Switch to API Reference
      fireEvent.click(within(topicsNav).getByRole('button', { name: /api reference/i }));
      expect(screen.getByRole('heading', { level: 1, name: /api reference/i })).toBeDefined();
      expect(screen.getAllByText(/\/api\/v1\/realtime\/stream/i).length).toBeGreaterThan(0);
    });

    it('navigates sequentially using Next and Previous article buttons', () => {
      render(<DocumentationPortal />);

      // Initially on Quickstart, next article should be Environment Variables
      const nextButton = screen.getByRole('button', { name: /next.*environment variables/i });
      fireEvent.click(nextButton);

      expect(screen.getByRole('heading', { level: 1, name: /environment variables/i })).toBeDefined();

      // On Environment Variables, previous article should be Quickstart
      const prevButton = screen.getByRole('button', { name: /previous.*quickstart/i });
      fireEvent.click(prevButton);

      expect(screen.getByRole('heading', { level: 1, name: /quickstart/i })).toBeDefined();
    });

    it('renders breadcrumbs indicating current topic location', () => {
      render(<DocumentationPortal />);

      const topicsNav = screen.getByRole('navigation', { name: /documentation topics/i });
      const breadcrumbs = screen.getByLabelText(/breadcrumbs/i);

      // Breadcrumb check on Quickstart
      expect(breadcrumbs).toBeDefined();
      expect(within(breadcrumbs).getByText('Docs')).toBeDefined();
      expect(within(breadcrumbs).getByText(/Quickstart/i)).toBeDefined();

      // Switch topic and check updated breadcrumbs
      fireEvent.click(within(topicsNav).getByRole('button', { name: /cryptography/i }));
      expect(within(breadcrumbs).getByText(/Cryptography/i)).toBeDefined();
    });
  });

  describe('Search Filter', () => {
    it('filters topic list based on query keywords', () => {
      render(<DocumentationPortal />);

      const searchInput = screen.getByPlaceholderText(/search documentation/i);
      const topicsNav = screen.getByRole('navigation', { name: /documentation topics/i });

      // Search for "crypto"
      fireEvent.change(searchInput, { target: { value: 'crypto' } });

      // Cryptography should still be present
      expect(within(topicsNav).getByRole('button', { name: /cryptography/i })).toBeDefined();

      // Environment Variables and Quickstart should be filtered out from topic list
      expect(within(topicsNav).queryByRole('button', { name: /environment variables/i })).toBeNull();
      expect(within(topicsNav).queryByRole('button', { name: /quickstart/i })).toBeNull();

      // Search for nonexistent term
      fireEvent.change(searchInput, { target: { value: 'nonexistentterm12345' } });
      expect(screen.getByText(/no documentation topics found/i)).toBeDefined();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(within(topicsNav).getByRole('button', { name: /quickstart/i })).toBeDefined();
      expect(within(topicsNav).getByRole('button', { name: /environment variables/i })).toBeDefined();
    });
  });

  describe('Code Block Rendering & Copy-to-Clipboard', () => {
    it('renders code snippet containers with copy buttons and triggers clipboard API', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        configurable: true,
        writable: true,
      });

      render(<DocumentationPortal />);

      // Look for copy button on code snippets
      const copyButtons = screen.getAllByRole('button', { name: /copy code/i });
      expect(copyButtons.length).toBeGreaterThan(0);

      // Click first copy button
      fireEvent.click(copyButtons[0]);

      expect(writeTextMock).toHaveBeenCalled();

      // Visual feedback shows "Copied"
      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeDefined();
      });
    });
  });

  describe('DocsPage Container', () => {
    it('renders page shell with Navbar, DocumentationPortal, and Footer', () => {
      render(<DocsPage />);

      expect(screen.getByRole('banner')).toBeDefined(); // Navbar
      expect(screen.getByRole('main')).toBeDefined(); // Main content containing portal
      expect(screen.getByRole('contentinfo')).toBeDefined(); // Footer
      expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
    });
  });

  describe('Route Switching in App.tsx', () => {
    it('renders Landing Page by default and switches to Docs view when Docs link is clicked', () => {
      render(<App />);

      // Default view is Landing Page (Hero section headline present)
      expect(
        screen.getByText(/The Sovereign Operating System for Modern Families/i)
      ).toBeDefined();
      expect(screen.queryByRole('heading', { level: 1, name: /quickstart/i })).toBeNull();

      // Click Docs navigation link
      const docsLink = screen.getByRole('link', { name: /^docs$/i });
      fireEvent.click(docsLink);

      // Now Docs view is active
      expect(screen.getByRole('heading', { level: 1, name: /quickstart/i })).toBeDefined();
      expect(
        screen.queryByText(/The Sovereign Operating System for Modern Families/i)
      ).toBeNull();
    });

    it('switches back to Landing Page when brand logo or Home link is clicked', () => {
      render(<App initialView="docs" />);

      // Verify docs view is rendered initially
      expect(screen.getByRole('heading', { level: 1, name: /quickstart/i })).toBeDefined();

      // Find HomeDash brand logo link or Home navigation link
      const homeLink = screen.getByRole('link', { name: /homedash/i });
      fireEvent.click(homeLink);

      // Now Landing Page is visible
      expect(
        screen.getByText(/The Sovereign Operating System for Modern Families/i)
      ).toBeDefined();
    });

    it('syncs route based on window.location.hash change', async () => {
      render(<App />);

      expect(
        screen.getByText(/The Sovereign Operating System for Modern Families/i)
      ).toBeDefined();

      // Trigger hashchange to #docs
      await act(async () => {
        window.location.hash = '#docs';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /quickstart/i })).toBeDefined();
      });

      // Trigger hashchange back to empty or #hero
      await act(async () => {
        window.location.hash = '';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      await waitFor(() => {
        expect(
          screen.getByText(/The Sovereign Operating System for Modern Families/i)
        ).toBeDefined();
      });
    });
  });
});
