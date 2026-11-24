import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { ExpenseModal } from './ExpenseModal';
import { DoseModal } from './DoseModal';
import { GroceryModal } from './GroceryModal';
import { BreakGlassModal } from './BreakGlassModal';
import { UnsealVaultModal } from './UnsealVaultModal';
import App from '../../App';
import { sealVaultItem, derivePersonalKek } from '@homedash/crypto';
import cryptoVectors from '@homedash/shared/fixtures/crypto-vectors.json';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

class MockEventSource {
  url: string;
  onopen: (() => void) | null = null;
  onerror: ((err: any) => void) | null = null;
  listeners: Record<string, ((ev: any) => void)[]> = {};

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(event: string, handler: (ev: any) => void) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(handler);
  }

  removeEventListener(event: string, handler: (ev: any) => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
    }
  }

  close() {}
}

describe('Quick Action Dialogs & Client-Side Passphrase Unsealing', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('EventSource', MockEventSource);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (typeof url === 'string' && url.includes('/api/v1/sync/telemetry')) {
          return {
            ok: true,
            json: async () => ({
              status: 'connected',
              hlcTimestamp: '1700000000000:0001:client-01',
              peerList: [],
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            sessionToken: 'default-token',
            role: 'admin',
          }),
        };
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ExpenseModal', () => {
    it('does not render when isOpen is false', () => {
      render(<ExpenseModal isOpen={false} onClose={vi.fn()} />);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('renders with dialog role and handles close dismissal', () => {
      const onClose = vi.fn();
      render(<ExpenseModal isOpen={true} onClose={onClose} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeTruthy();
      expect(screen.getByText(/Log Household Expense/i)).toBeTruthy();

      // Click close button
      const closeBtn = screen.getByLabelText(/Close/i);
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);

      // Escape key dismissal
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('validates required inputs and submits parsed expense data', async () => {
      const onSubmit = vi.fn();
      render(<ExpenseModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} />);

      const amountInput = screen.getByTestId('expense-amount-input');
      const categorySelect = screen.getByTestId('expense-category-select');
      const accountSelect = screen.getByTestId('expense-account-select');
      const noteInput = screen.getByTestId('expense-note-input');
      const submitBtn = screen.getByRole('button', { name: /Log Expense/i });

      // Fill in form values: $45.50 = 4550 cents
      fireEvent.change(amountInput, { target: { value: '45.50' } });
      fireEvent.change(categorySelect, { target: { value: 'Groceries' } });
      fireEvent.change(accountSelect, { target: { value: 'Checking' } });
      fireEvent.change(noteInput, { target: { value: 'Weekly produce run' } });

      fireEvent.click(submitBtn);

      expect(onSubmit).toHaveBeenCalledWith({
        amountCents: 4550,
        category: 'Groceries',
        account: 'Checking',
        note: 'Weekly produce run',
      });
    });
  });

  describe('DoseModal', () => {
    it('does not render when isOpen is false', () => {
      render(<DoseModal isOpen={false} onClose={vi.fn()} />);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('renders with dialog role and handles close dismissal', () => {
      const onClose = vi.fn();
      render(<DoseModal isOpen={true} onClose={onClose} />);

      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/Record Medication Intake/i)).toBeTruthy();

      const closeBtn = screen.getByLabelText(/Close/i);
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('validates and submits medication intake data', async () => {
      const onSubmit = vi.fn();
      render(<DoseModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} />);

      const patientSelect = screen.getByTestId('dose-patient-select');
      const medicationInput = screen.getByTestId('dose-medication-input');
      const dosageInput = screen.getByTestId('dose-dosage-input');
      const timeInput = screen.getByTestId('dose-time-input');
      const noteInput = screen.getByTestId('dose-note-input');
      const submitBtn = screen.getByRole('button', { name: /Record Dose/i });

      fireEvent.change(patientSelect, { target: { value: 'Grandma Martha' } });
      fireEvent.change(medicationInput, { target: { value: 'Lisinopril' } });
      fireEvent.change(dosageInput, { target: { value: '10mg' } });
      fireEvent.change(timeInput, { target: { value: '08:00' } });
      fireEvent.change(noteInput, { target: { value: 'Taken with breakfast' } });

      fireEvent.click(submitBtn);

      expect(onSubmit).toHaveBeenCalledWith({
        patient: 'Grandma Martha',
        medication: 'Lisinopril',
        dosage: '10mg',
        time: '08:00',
        note: 'Taken with breakfast',
      });
    });
  });

  describe('GroceryModal', () => {
    it('does not render when isOpen is false', () => {
      render(<GroceryModal isOpen={false} onClose={vi.fn()} />);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('validates and submits new grocery item data', async () => {
      const onSubmit = vi.fn();
      render(<GroceryModal isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} />);

      const nameInput = screen.getByTestId('grocery-name-input');
      const quantityInput = screen.getByTestId('grocery-quantity-input');
      const categorySelect = screen.getByTestId('grocery-category-select');
      const noteInput = screen.getByTestId('grocery-note-input');
      const submitBtn = screen.getByRole('button', { name: /Add to Grocery List/i });

      fireEvent.change(nameInput, { target: { value: 'Oat Milk' } });
      fireEvent.change(quantityInput, { target: { value: '2 cartons' } });
      fireEvent.change(categorySelect, { target: { value: 'Dairy & Eggs' } });
      fireEvent.change(noteInput, { target: { value: 'Unsweetened barista edition' } });

      fireEvent.click(submitBtn);

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Oat Milk',
        quantity: '2 cartons',
        category: 'Dairy & Eggs',
        note: 'Unsweetened barista edition',
      });
    });
  });

  describe('BreakGlassModal', () => {
    it('does not render when isOpen is false', () => {
      render(<BreakGlassModal isOpen={false} onClose={vi.fn()} />);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('requires confirmation checkbox before submitting emergency initiation', () => {
      const onConfirm = vi.fn();
      render(<BreakGlassModal isOpen={true} onClose={vi.fn()} onConfirm={onConfirm} />);

      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/Initiate Break-Glass Protocol/i)).toBeTruthy();

      const reasonInput = screen.getByTestId('break-glass-reason-input');
      const confirmCheckbox = screen.getByTestId('break-glass-confirm-checkbox');
      const submitBtn = screen.getByTestId('break-glass-submit-button');

      // Fill reason
      fireEvent.change(reasonInput, {
        target: { value: 'Immediate medical directive required for attending doctor' },
      });

      // Submit button is initially disabled
      expect((submitBtn as HTMLButtonElement).disabled).toBe(true);

      // Check confirmation checkbox
      fireEvent.click(confirmCheckbox);
      expect((submitBtn as HTMLButtonElement).disabled).toBe(false);

      // Submit
      fireEvent.click(submitBtn);
      expect(onConfirm).toHaveBeenCalledWith('Immediate medical directive required for attending doctor');
    });
  });

  describe('UnsealVaultModal (Client-Side Cryptographic Unsealing)', () => {
    it('unseals encrypted vault payload using in-browser Argon2id KEK derivation and XChaCha20-Poly1305', async () => {
      const testPassphrase = cryptoVectors.argon2id.passphrase;
      const salt = hexToBytes(cryptoVectors.argon2id.saltHex);
      const testParams = cryptoVectors.argon2id.testParams;

      // Derive KEK using test params (fast memory for tests)
      const kek = await derivePersonalKek(testPassphrase, salt, {
        iterations: testParams.iterations,
        memory: testParams.memory,
        parallelism: testParams.parallelism,
      });

      const cleartextPayload = 'Emergency Safe Combination: 49-21-88. Medical Directive in Blue Folder.';
      const sealedItem = sealVaultItem(new TextEncoder().encode(cleartextPayload), kek);

      const onUnsealed = vi.fn();
      render(
        <UnsealVaultModal
          isOpen={true}
          onClose={vi.fn()}
          sealedItem={sealedItem}
          salt={salt}
          argon2Options={{
            iterations: testParams.iterations,
            memory: testParams.memory,
            parallelism: testParams.parallelism,
          }}
          onUnsealed={onUnsealed}
        />
      );

      const passphraseInput = screen.getByTestId('vault-passphrase-input');
      const unsealBtn = screen.getByTestId('vault-unseal-button');

      fireEvent.change(passphraseInput, { target: { value: testPassphrase } });
      fireEvent.click(unsealBtn);

      // Verify unsealed plaintext appears in UI
      await waitFor(() => {
        expect(screen.getByTestId('unsealed-payload-display')).toBeTruthy();
      });

      expect(screen.getByTestId('unsealed-payload-display').textContent).toContain(cleartextPayload);
      expect(onUnsealed).toHaveBeenCalledWith(
        expect.any(Uint8Array),
        cleartextPayload
      );
    });

    it('displays error on incorrect passphrase without leaking plaintext or throwing unhandled errors', async () => {
      const testPassphrase = cryptoVectors.argon2id.passphrase;
      const salt = hexToBytes(cryptoVectors.argon2id.saltHex);
      const testParams = cryptoVectors.argon2id.testParams;

      const kek = await derivePersonalKek(testPassphrase, salt, {
        iterations: testParams.iterations,
        memory: testParams.memory,
        parallelism: testParams.parallelism,
      });

      const cleartextPayload = 'Secret Health Directive';
      const sealedItem = sealVaultItem(new TextEncoder().encode(cleartextPayload), kek);

      render(
        <UnsealVaultModal
          isOpen={true}
          onClose={vi.fn()}
          sealedItem={sealedItem}
          salt={salt}
          argon2Options={{
            iterations: testParams.iterations,
            memory: testParams.memory,
            parallelism: testParams.parallelism,
          }}
        />
      );

      const passphraseInput = screen.getByTestId('vault-passphrase-input');
      const unsealBtn = screen.getByTestId('vault-unseal-button');

      // Enter WRONG passphrase
      fireEvent.change(passphraseInput, { target: { value: 'Wrong-Passphrase-9999' } });
      fireEvent.click(unsealBtn);

      await waitFor(() => {
        expect(screen.getByTestId('unseal-error-message')).toBeTruthy();
      });

      expect(screen.getByTestId('unseal-error-message').textContent).toContain(
        'Failed to unseal vault: Invalid recovery passphrase or corrupted payload.'
      );
      expect(screen.queryByTestId('unsealed-payload-display')).toBeNull();
    });
  });

  describe('Integration in App.tsx', () => {
    it('wires quick action pills and Hero command chips to open dialogs inside AppShell', async () => {
      await act(async () => {
        render(<App />);
      });

      // Initially no modals open
      expect(screen.queryByRole('dialog')).toBeNull();

      // Click + Expense pill in Header
      const expensePill = screen.getByRole('button', { name: /\+ Expense/i });
      fireEvent.click(expensePill);
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/Log Household Expense/i)).toBeTruthy();

      // Close modal
      const closeExpense = screen.getByLabelText(/Close/i);
      fireEvent.click(closeExpense);
      expect(screen.queryByRole('dialog')).toBeNull();

      // Click + Dose pill in Header
      const dosePill = screen.getByRole('button', { name: /\+ Dose/i });
      fireEvent.click(dosePill);
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/Record Medication Intake/i)).toBeTruthy();

      const closeDose = screen.getByLabelText(/Close/i);
      fireEvent.click(closeDose);
      expect(screen.queryByRole('dialog')).toBeNull();

      // Click + Grocery pill in Header
      const groceryPill = screen.getByRole('button', { name: /\+ Grocery/i });
      fireEvent.click(groceryPill);
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/Add Grocery Item/i)).toBeTruthy();

      const closeGrocery = screen.getByLabelText(/Close/i);
      fireEvent.click(closeGrocery);
      expect(screen.queryByRole('dialog')).toBeNull();

      // Click Break-Glass pill in Header
      const breakGlassPill = screen.getByRole('button', { name: /Break-Glass/i });
      fireEvent.click(breakGlassPill);
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText(/Initiate Break-Glass Protocol/i)).toBeTruthy();

      const closeBreakGlass = screen.getByLabelText(/Close/i);
      fireEvent.click(closeBreakGlass);
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
