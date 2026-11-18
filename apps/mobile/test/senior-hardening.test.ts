import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Senior Code Review Hardening & Parity Suite', () => {
  it('should enforce strict canonical schema parity in tables.dart matching packages/client-schema', () => {
    const tablesPath = path.resolve(__dirname, '../lib/data/database/tables.dart');
    const content = fs.readFileSync(tablesPath, 'utf8');

    // Universal sync tracking column
    expect(content).toContain('IntColumn get syncState => integer().withDefault(const Constant(1))();');

    // LocalChores canonical columns
    expect(content).toContain('assignedMemberId');
    expect(content).toContain('rewardPoints');
    expect(content).toContain('recurrenceRule');
    expect(content).toContain('allowanceCents');
    expect(content).toContain('isCompleted');

    // LocalMedications canonical columns
    expect(content).toContain('patientMemberId');
    expect(content).toContain('scheduleCron');
    expect(content).toContain('remainingPills');
    expect(content).toContain('refillThreshold');
    expect(content).toContain('isActive');

    // LocalVaultItems canonical columns
    expect(content).toContain('encryptedPayload');
    expect(content).toContain('payloadNonce');
    expect(content).toContain('encryptedDek');
    expect(content).toContain('dekNonce');
    expect(content).toContain('keyVersion');
  });

  it('should secure VaultCrypto against insecure XOR masking and use Random.secure()', () => {
    const cryptoPath = path.resolve(__dirname, '../lib/core/crypto/vault_crypto.dart');
    const content = fs.readFileSync(cryptoPath, 'utf8');

    expect(content).toContain('Random.secure()');
    expect(content).not.toContain('^ kek['); // No XOR masking
    expect(content).toContain('encryptedPayload');
    expect(content).toContain('keyVersion');
  });

  it('should prevent SSE socket and zombie stream leaks in sync_coordinator.dart', () => {
    const coordPath = path.resolve(__dirname, '../lib/data/sync/sync_coordinator.dart');
    const content = fs.readFileSync(coordPath, 'utf8');

    expect(content).toContain('bool _isDisposed = false;');
    expect(content).toContain('_sseClient?.close();');
    expect(content).toContain('if (_isDisposed)');
  });

  it('should wire MultiProvider, SessionState, AppTheme, and AppRouter in main.dart', () => {
    const mainPath = path.resolve(__dirname, '../lib/main.dart');
    const content = fs.readFileSync(mainPath, 'utf8');

    expect(content).toContain('MultiProvider');
    expect(content).toContain('SessionState');
    expect(content).toContain('AppRouter');
    expect(content).toContain('AppTheme');
  });

  it('should quarantine CashFlowCard from caregiver_guest in Bento dashboard', () => {
    const bentoPath = path.resolve(__dirname, '../lib/presentation/bento/bento_grid.dart');
    const content = fs.readFileSync(bentoPath, 'utf8');

    expect(content).toContain('isCaregiver');
    expect(content).toContain('CashFlowCard');
  });

  it('should reject corrupt incoming HLC even when local record is missing in reconciler.dart', () => {
    const recPath = path.resolve(__dirname, '../lib/data/sync/reconciler.dart');
    const content = fs.readFileSync(recPath, 'utf8');

    expect(content).toContain("inTs.nodeId == 'invalid'");
    expect(content).toContain('rejectCorrupt');
  });

  it('should dispose TextEditingControllers in expense_quick_log_sheet.dart', () => {
    const sheetPath = path.resolve(__dirname, '../lib/presentation/logging/expense_quick_log_sheet.dart');
    const content = fs.readFileSync(sheetPath, 'utf8');

    expect(content).toContain('void dispose()');
    expect(content).toContain('_amountController.dispose()');
    expect(content).toContain('_noteController.dispose()');
  });

  it('should connect notificationStream to _eventChannel in notification_listener_channel.dart', () => {
    const channelPath = path.resolve(__dirname, '../lib/data/platform/notification_listener_channel.dart');
    const content = fs.readFileSync(channelPath, 'utf8');

    expect(content).toContain('_eventChannel.receiveBroadcastStream()');
  });
});
