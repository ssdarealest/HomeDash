import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Bento Dashboard and 1-Handed Quick-Log Sheets', () => {
  it('should define BentoGrid with adaptive layout in bento_grid.dart', () => {
    const gridPath = path.resolve(__dirname, '../lib/presentation/bento/bento_grid.dart');
    expect(fs.existsSync(gridPath)).toBe(true);
    const content = fs.readFileSync(gridPath, 'utf8');
    expect(content).toContain('class BentoGrid');
    expect(content).toContain('LayoutBuilder');
  });

  it('should define modular Bento cards', () => {
    const heroCardPath = path.resolve(__dirname, '../lib/presentation/bento/widgets/hero_emergency_card.dart');
    const medCardPath = path.resolve(__dirname, '../lib/presentation/bento/widgets/medication_timeline_card.dart');
    const cashCardPath = path.resolve(__dirname, '../lib/presentation/bento/widgets/cash_flow_card.dart');
    const shiftCardPath = path.resolve(__dirname, '../lib/presentation/bento/widgets/caregiver_shift_card.dart');

    expect(fs.existsSync(heroCardPath)).toBe(true);
    expect(fs.existsSync(medCardPath)).toBe(true);
    expect(fs.existsSync(cashCardPath)).toBe(true);
    expect(fs.existsSync(shiftCardPath)).toBe(true);
  });

  it('should define 1-handed bottom sheets for logging', () => {
    const medSheetPath = path.resolve(__dirname, '../lib/presentation/logging/medication_quick_log_sheet.dart');
    const expenseSheetPath = path.resolve(__dirname, '../lib/presentation/logging/expense_quick_log_sheet.dart');
    const choreSheetPath = path.resolve(__dirname, '../lib/presentation/logging/chore_toggle_sheet.dart');

    expect(fs.existsSync(medSheetPath)).toBe(true);
    expect(fs.existsSync(expenseSheetPath)).toBe(true);
    expect(fs.existsSync(choreSheetPath)).toBe(true);

    const medContent = fs.readFileSync(medSheetPath, 'utf8');
    expect(medContent).toContain('MedicationQuickLogSheet');
    expect(medContent).toContain('showModalBottomSheet');
  });
});
