import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Phase 5 Mobile UI Screens & Ergonomic Sheets', () => {
  it('should implement GroceryListScreen and GroceryCheckoutSheet with 48dp touch targets', () => {
    const listPath = path.resolve(__dirname, '../lib/presentation/grocery/grocery_list_screen.dart');
    const sheetPath = path.resolve(__dirname, '../lib/presentation/grocery/grocery_checkout_sheet.dart');

    expect(fs.existsSync(listPath)).toBe(true);
    expect(fs.existsSync(sheetPath)).toBe(true);

    const listContent = fs.readFileSync(listPath, 'utf8');
    const sheetContent = fs.readFileSync(sheetPath, 'utf8');

    expect(listContent).toContain('class GroceryListScreen');
    expect(listContent).toContain('aisleCategory');
    expect(sheetContent).toContain('class GroceryCheckoutSheet');
    expect(sheetContent).toContain('minTouchTarget');
    expect(sheetContent).toContain('Checkout & Log Expense');
  });

  it('should implement VitalsLogSheet with 1-handed quick log ergonomics', () => {
    const vitalsPath = path.resolve(__dirname, '../lib/presentation/health/vitals_log_sheet.dart');
    expect(fs.existsSync(vitalsPath)).toBe(true);
    const content = fs.readFileSync(vitalsPath, 'utf8');
    expect(content).toContain('class VitalsLogSheet');
    expect(content).toContain('blood_pressure');
    expect(content).toContain('minTouchTarget');
  });

  it('should implement AllergyBanner with high-contrast emergency warning', () => {
    const bannerPath = path.resolve(__dirname, '../lib/presentation/health/allergy_banner.dart');
    expect(fs.existsSync(bannerPath)).toBe(true);
    const content = fs.readFileSync(bannerPath, 'utf8');
    expect(content).toContain('class AllergyBanner');
    expect(content).toContain('critical');
    expect(content).toContain('ALLERGY ALERT');
  });

  it('should implement ShiftSwapSheet for caregiver visit claims and swaps', () => {
    const shiftPath = path.resolve(__dirname, '../lib/presentation/shifts/shift_swap_sheet.dart');
    expect(fs.existsSync(shiftPath)).toBe(true);
    const content = fs.readFileSync(shiftPath, 'utf8');
    expect(content).toContain('class ShiftSwapSheet');
    expect(content).toContain('Claim or Swap Shift');
  });

  it('should implement BreakGlassStatusCard with countdown timer and admin veto', () => {
    const cardPath = path.resolve(__dirname, '../lib/presentation/vault/break_glass_status_card.dart');
    expect(fs.existsSync(cardPath)).toBe(true);
    const content = fs.readFileSync(cardPath, 'utf8');
    expect(content).toContain('class BreakGlassStatusCard');
    expect(content).toContain('VETO REQUEST');
    expect(content).toContain('pending_cooldown');
  });
});
