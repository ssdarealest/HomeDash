import { describe, it, expect } from 'vitest';

// Emulating the layout and style resolution logic of BentoGridView & GlassmorphicCard
function getBentoColumnCount(viewportWidth: number): number {
  if (viewportWidth > 1440) return 4;
  if (viewportWidth > 1024) return 3;
  if (viewportWidth > 600) return 2;
  return 1;
}

interface GlassmorphicStyle {
  blurSigma: number;
  borderWidth: number;
  borderColor: string;
  surfaceColor: string;
  isSolidM3: boolean;
}

function resolveCardStyle(isGlassmorphic: boolean, isDarkMode: boolean): GlassmorphicStyle {
  if (!isGlassmorphic) {
    return {
      blurSigma: 0,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333333' : '#E0E0E0',
      surfaceColor: isDarkMode ? '#1E1E1E' : '#F5F5F5',
      isSolidM3: true,
    };
  }

  return {
    blurSigma: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.60)',
    surfaceColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)',
    isSolidM3: false,
  };
}

interface BentoItem {
  id: string;
  type: 'cash_flow' | 'break_glass' | 'medication_timeline' | 'system_sync';
}

function filterBentoItems(items: BentoItem[], isCaregiver: boolean): BentoItem[] {
  return items.filter((item) => {
    if (isCaregiver && (item.type === 'cash_flow' || item.type === 'break_glass')) {
      return false;
    }
    return true;
  });
}

describe('Desktop & Web Glassmorphic Bento Grid (Phase 6 Task 4)', () => {
  it('calculates responsive column count across desktop/tablet/mobile breakpoints', () => {
    expect(getBentoColumnCount(412)).toBe(1);  // Mobile portrait
    expect(getBentoColumnCount(768)).toBe(2);  // Tablet portrait
    expect(getBentoColumnCount(1200)).toBe(3); // Desktop standard / laptop
    expect(getBentoColumnCount(1600)).toBe(4); // Ultrawide / 4K monitor
  });

  it('resolves glassmorphic styling tokens with blur and translucent borders', () => {
    const darkGlass = resolveCardStyle(true, true);
    expect(darkGlass.blurSigma).toBe(16);
    expect(darkGlass.borderColor).toBe('rgba(255, 255, 255, 0.14)');
    expect(darkGlass.surfaceColor).toBe('rgba(255, 255, 255, 0.08)');
    expect(darkGlass.isSolidM3).toBe(false);

    const lightGlass = resolveCardStyle(true, false);
    expect(lightGlass.blurSigma).toBe(16);
    expect(lightGlass.borderColor).toBe('rgba(255, 255, 255, 0.60)');
    expect(lightGlass.surfaceColor).toBe('rgba(255, 255, 255, 0.65)');
  });

  it('resolves solid M3 fallback styling when glassmorphism is disabled', () => {
    const solidDark = resolveCardStyle(false, true);
    expect(solidDark.blurSigma).toBe(0);
    expect(solidDark.isSolidM3).toBe(true);
    expect(solidDark.surfaceColor).toBe('#1E1E1E');
  });

  it('strictly quarantines caregivers from financial and vault break-glass bento cards', () => {
    const allItems: BentoItem[] = [
      { id: '1', type: 'cash_flow' },
      { id: '2', type: 'break_glass' },
      { id: '3', type: 'medication_timeline' },
      { id: '4', type: 'system_sync' },
    ];

    const adminView = filterBentoItems(allItems, false);
    expect(adminView.length).toBe(4);

    const caregiverView = filterBentoItems(allItems, true);
    expect(caregiverView.length).toBe(2);
    expect(caregiverView.map((i) => i.type)).toEqual(['medication_timeline', 'system_sync']);
  });
});
