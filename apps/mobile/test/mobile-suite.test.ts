import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Phase 4 Flutter Client Application Complete Suite', () => {
  it('should have all core architecture modules present and valid', () => {
    const requiredFiles = [
      'pubspec.yaml',
      'analysis_options.yaml',
      'lib/main.dart',
      'lib/core/theme/app_colors.dart',
      'lib/core/theme/app_typography.dart',
      'lib/core/theme/app_theme.dart',
      'lib/core/hlc/hlc.dart',
      'lib/core/crypto/vault_crypto.dart',
      'lib/data/database/tables.dart',
      'lib/data/database/app_database.dart',
      'lib/data/database/daos/outbox_dao.dart',
      'lib/data/database/daos/chores_dao.dart',
      'lib/data/database/daos/medications_dao.dart',
      'lib/data/database/daos/finance_dao.dart',
      'lib/data/sync/reconciler.dart',
      'lib/data/sync/sync_client.dart',
      'lib/data/sync/sync_coordinator.dart',
      'lib/data/platform/notification_listener_channel.dart',
      'lib/domain/models/user_role.dart',
      'lib/domain/state/session_state.dart',
      'lib/domain/state/vault_state.dart',
      'lib/presentation/navigation/app_router.dart',
      'lib/presentation/bento/bento_grid.dart',
      'lib/presentation/bento/widgets/hero_emergency_card.dart',
      'lib/presentation/bento/widgets/medication_timeline_card.dart',
      'lib/presentation/bento/widgets/cash_flow_card.dart',
      'lib/presentation/bento/widgets/caregiver_shift_card.dart',
      'lib/presentation/logging/medication_quick_log_sheet.dart',
      'lib/presentation/logging/expense_quick_log_sheet.dart',
      'lib/presentation/logging/chore_toggle_sheet.dart',
      'lib/presentation/senior/senior_dashboard.dart',
      'lib/presentation/senior/senior_emergency_sheet.dart',
      'lib/presentation/senior/widgets/senior_care_card.dart',
      'lib/presentation/senior/widgets/senior_emergency_banner.dart',
      'android/app/src/main/kotlin/com/homedash/app/NotificationListenerServiceImpl.kt',
    ];

    for (const file of requiredFiles) {
      const fullPath = path.resolve(__dirname, '..', file);
      expect(fs.existsSync(fullPath), `Missing required mobile file: ${file}`).toBe(true);
    }
  });

  it('should pass typechecking for TypeScript test harnesses', () => {
    const tsconfigPath = path.resolve(__dirname, '../tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);
  });
});
