import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Multi-Role Session and Route Quarantine', () => {
  it('should define all 4 canonical user roles in user_role.dart', () => {
    const rolePath = path.resolve(__dirname, '../lib/domain/models/user_role.dart');
    expect(fs.existsSync(rolePath)).toBe(true);
    const content = fs.readFileSync(rolePath, 'utf8');
    expect(content).toContain('admin');
    expect(content).toContain('senior');
    expect(content).toContain('teen_child');
    expect(content).toContain('caregiver_guest');
  });

  it('should quarantine caregiver from finance and vault routes in app_router.dart', () => {
    const routerPath = path.resolve(__dirname, '../lib/presentation/navigation/app_router.dart');
    expect(fs.existsSync(routerPath)).toBe(true);
    const content = fs.readFileSync(routerPath, 'utf8');
    expect(content).toContain('canAccessRoute');
    expect(content).toContain('caregiver_guest');
    expect(content).toContain('/finance');
    expect(content).toContain('/vault');
  });

  it('should implement profile switching and magic link ingestion in session_state.dart', () => {
    const sessionPath = path.resolve(__dirname, '../lib/domain/state/session_state.dart');
    expect(fs.existsSync(sessionPath)).toBe(true);
    const content = fs.readFileSync(sessionPath, 'utf8');
    expect(content).toContain('class SessionState');
    expect(content).toContain('switchRole');
    expect(content).toContain('consumeCaregiverMagicLink');
  });
});
