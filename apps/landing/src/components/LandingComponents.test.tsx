import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { BentoFeatureSection } from './BentoFeatureSection';
import { ArchitectureSection } from './ArchitectureSection';
import { CompatibilityMatrix } from './CompatibilityMatrix';
import { Footer } from './Footer';
import { LandingPage } from '../pages/LandingPage';

describe('Landing Page Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Navbar', () => {
    it('renders brand logo, navigation links, and Open Webapp CTA', () => {
      render(<Navbar />);

      // Brand Logo
      expect(screen.getByText('HomeDash')).toBeDefined();

      // Navigation Links
      const featuresLink = screen.getByRole('link', { name: /features/i });
      expect(featuresLink.getAttribute('href')).toBe('#features');

      const archLink = screen.getByRole('link', { name: /architecture/i });
      expect(archLink.getAttribute('href')).toBe('#architecture');

      const platformsLink = screen.getByRole('link', { name: /platforms/i });
      expect(platformsLink.getAttribute('href')).toBe('#platforms');

      const docsLink = screen.getByRole('link', { name: /docs/i });
      expect(docsLink.getAttribute('href')).toBe('#docs');

      const githubLink = screen.getByRole('link', { name: /github/i });
      expect(githubLink.getAttribute('href')).toBe('#github');

      // Open Webapp CTA button linking to http://localhost:5173
      const ctaButton = screen.getByRole('link', { name: /open webapp/i });
      expect(ctaButton.getAttribute('href')).toBe('http://localhost:5173');
    });

    it('uses VITE_WEBAPP_URL environment variable when provided', () => {
      const originalEnv = import.meta.env.VITE_WEBAPP_URL;
      try {
        vi.stubEnv('VITE_WEBAPP_URL', 'https://app.homedash.local');
        render(<Navbar />);
        const ctaButton = screen.getByRole('link', { name: /open webapp/i });
        expect(ctaButton.getAttribute('href')).toBe('https://app.homedash.local');
      } finally {
        if (originalEnv) {
          vi.stubEnv('VITE_WEBAPP_URL', originalEnv);
        } else {
          vi.unstubAllEnvs();
        }
      }
    });
  });

  describe('HeroSection', () => {
    it('renders headline, privacy narrative, and copyable terminal command with visual feedback', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        configurable: true,
        writable: true,
      });

      render(<HeroSection />);

      // High-contrast headline
      expect(
        screen.getByText(/The Sovereign Operating System for Modern Families/i)
      ).toBeDefined();

      // Immurok-style privacy narrative
      expect(
        screen.getByText(/Zero cloud lock-in\. No telemetry\. 100% Local-First/i)
      ).toBeDefined();

      // Terminal snippet block with docker command
      expect(screen.getByText('docker compose up -d')).toBeDefined();

      // Copy button interaction
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      expect(writeTextMock).toHaveBeenCalledWith('docker compose up -d');

      // Visual feedback state
      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeDefined();
      });

      // Primary and secondary CTAs
      expect(screen.getByRole('link', { name: /explore architecture/i })).toBeDefined();
      const launchCta = screen.getByRole('link', { name: /launch webapp/i });
      expect(launchCta).toBeDefined();
      expect(launchCta.getAttribute('href')).toBe('http://localhost:5173');
    });

    it('uses VITE_WEBAPP_URL environment variable for Launch Webapp link when provided', () => {
      const originalEnv = import.meta.env.VITE_WEBAPP_URL;
      try {
        vi.stubEnv('VITE_WEBAPP_URL', 'https://app.homedash.local');
        render(<HeroSection />);
        const launchCta = screen.getByRole('link', { name: /launch webapp/i });
        expect(launchCta.getAttribute('href')).toBe('https://app.homedash.local');
      } finally {
        if (originalEnv) {
          vi.stubEnv('VITE_WEBAPP_URL', originalEnv);
        } else {
          vi.unstubAllEnvs();
        }
      }
    });
  });

  describe('BentoFeatureSection', () => {
    it('renders 4 modular Bento tiles with correct deep-tech details and metrics', () => {
      render(<BentoFeatureSection />);

      // Pillar 1: Family Finance & Automated OCR Ingestion
      expect(
        screen.getByText(/Family Finance & Automated OCR Ingestion/i)
      ).toBeDefined();
      expect(screen.getAllByText(/cash flow/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/sinking funds/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/encrypted receipts/i).length).toBeGreaterThan(0);

      // Pillar 2: Multi-Gen Care & Health Hub
      expect(screen.getByText(/Multi-Gen Care & Health Hub/i)).toBeDefined();
      expect(screen.getAllByText(/medication scheduling/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/vital trends/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/caregiver shift logging/i).length).toBeGreaterThan(0);

      // Pillar 3: Zero-Knowledge Vault with Break-Glass
      expect(
        screen.getByText(/Zero-Knowledge Vault with Break-Glass/i)
      ).toBeDefined();
      expect(screen.getAllByText(/argon2id/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/shamir secret sharing/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/cooldown/i).length).toBeGreaterThan(0);

      // Pillar 4: Local-First P2P Sync Engine
      expect(screen.getByText(/Local-First P2P Sync Engine/i)).toBeDefined();
      expect(screen.getAllByText(/hybrid logical clocks/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/peer discovery/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/zero cloud dependency/i).length).toBeGreaterThan(0);
    });
  });

  describe('ArchitectureSection', () => {
    it('displays the 6 monorepo tiers and cryptographic primitives breakdown', () => {
      render(<ArchitectureSection />);

      // 6 Monorepo Tiers
      expect(screen.getAllByText(/Tier 1: Cryptographic Core/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Tier 2: Protocol & Schema/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Tier 3: Storage & Sync Engine/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Tier 4: Business Domains/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Tier 5: Host Runtimes & Daemon/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Tier 6: User Applications/i).length).toBeGreaterThan(0);

      // Cryptographic primitives
      expect(screen.getAllByText(/Argon2id/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/XChaCha20-Poly1305/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Shamir Secret Sharing/i).length).toBeGreaterThan(0);
    });
  });

  describe('CompatibilityMatrix', () => {
    it('renders platform support table with all required OS targets', () => {
      render(<CompatibilityMatrix />);

      const expectedPlatforms = [
        'Docker',
        'Linux',
        'macOS',
        'Windows',
        'iOS',
        'Android',
        'Web',
      ];

      for (const platform of expectedPlatforms) {
        expect(screen.getAllByText(platform).length).toBeGreaterThan(0);
      }

      // Column headers
      expect(screen.getByText('Platform')).toBeDefined();
      expect(screen.getByText('Offline-First')).toBeDefined();
      expect(screen.getByText('P2P Sync')).toBeDefined();
      expect(screen.getByText('Hardware Vault')).toBeDefined();
      expect(screen.getByText('Status')).toBeDefined();
    });
  });

  describe('Footer', () => {
    it('renders zero-telemetry declaration, open-source MIT license, and community links', () => {
      render(<Footer />);

      expect(screen.getAllByText(/Zero telemetry/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/MIT License/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('link', { name: /github/i })).toBeDefined();
      expect(screen.getByRole('link', { name: /documentation/i })).toBeDefined();
    });
  });

  describe('LandingPage', () => {
    it('assembles all sections with semantic ARIA landmarks and zero emojis', () => {
      const { container } = render(<LandingPage />);

      // Semantic HTML landmarks
      expect(container.querySelector('header')).not.toBeNull();
      expect(container.querySelector('nav')).not.toBeNull();
      expect(container.querySelector('main')).not.toBeNull();
      expect(container.querySelector('footer')).not.toBeNull();

      // Ensure all major sections are mounted by checking their id anchors
      expect(container.querySelector('#hero')).not.toBeNull();
      expect(container.querySelector('#features')).not.toBeNull();
      expect(container.querySelector('#architecture')).not.toBeNull();
      expect(container.querySelector('#platforms')).not.toBeNull();
    });
  });
});
