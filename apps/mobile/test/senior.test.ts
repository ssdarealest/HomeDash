import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Senior Mode 2-Tab Dashboard', () => {
  it('should implement 2-tab navigation in senior_dashboard.dart', () => {
    const dashPath = path.resolve(__dirname, '../lib/presentation/senior/senior_dashboard.dart');
    expect(fs.existsSync(dashPath)).toBe(true);
    const content = fs.readFileSync(dashPath, 'utf8');
    expect(content).toContain("Today's Care");
    expect(content).toContain('Emergency');
    expect(content).toContain('seniorScaleFactor');
  });

  it('should provide 1-tap call and allergy emergency card in senior_emergency_sheet.dart', () => {
    const sheetPath = path.resolve(__dirname, '../lib/presentation/senior/senior_emergency_sheet.dart');
    expect(fs.existsSync(sheetPath)).toBe(true);
    const content = fs.readFileSync(sheetPath, 'utf8');
    expect(content).toContain('SeniorEmergencySheet');
    expect(content).toContain('CALL EMERGENCY CONTACT');
  });

  it('should provide high-touch SeniorCareCard and SeniorEmergencyBanner widgets', () => {
    const careCardPath = path.resolve(__dirname, '../lib/presentation/senior/widgets/senior_care_card.dart');
    const bannerPath = path.resolve(__dirname, '../lib/presentation/senior/widgets/senior_emergency_banner.dart');
    expect(fs.existsSync(careCardPath)).toBe(true);
    expect(fs.existsSync(bannerPath)).toBe(true);
  });
});
