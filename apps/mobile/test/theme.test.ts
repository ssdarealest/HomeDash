import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Material 3 and Senior Theme Tokens', () => {
  it('should define M3 tonal surface elevation tokens in app_colors.dart', () => {
    const filePath = path.resolve(__dirname, '../lib/core/theme/app_colors.dart');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('surfaceContainerLowest');
    expect(content).toContain('surfaceContainerLow');
    expect(content).toContain('surfaceContainer');
    expect(content).toContain('surfaceContainerHigh');
    expect(content).toContain('surfaceContainerHighest');
    expect(content).toContain('seniorBackground');
    expect(content).toContain('seniorText');
  });

  it('should define Senior Mode 1.4x scaled typography in app_typography.dart', () => {
    const filePath = path.resolve(__dirname, '../lib/core/theme/app_typography.dart');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('seniorScaleFactor = 1.4');
    expect(content).toContain('seniorTextTheme');
  });

  it('should provide Senior Theme with minimum 48dp touch targets in app_theme.dart', () => {
    const filePath = path.resolve(__dirname, '../lib/core/theme/app_theme.dart');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('static ThemeData light()');
    expect(content).toContain('static ThemeData dark()');
    expect(content).toContain('static ThemeData senior()');
    expect(content).toContain('Size(48, 48)');
  });
});
