import { describe, it, expect } from 'vitest';
import { getFontFamilies, getSpacingValue, getBorderRadiusPx } from '../theme.js';

describe('Theme & UI Customization', () => {
  it('TC-001: getFontFamilies returns 3 fonts', () => {
    const fonts = getFontFamilies();
    expect(fonts.length).toBe(3);
  });

  it('TC-002: getSpacingValue returns correct values', () => {
    expect(getSpacingValue('compact')).toBe(4);
    expect(getSpacingValue('normal')).toBe(8);
    expect(getSpacingValue('relaxed')).toBe(16);
  });

  it('TC-003: getBorderRadiusPx formats correctly', () => {
    const result = getBorderRadiusPx({ theme: 'light', fontFamily: 'sans', spacing: 'normal', borderRadius: 12 });
    expect(result).toBe('12px');
  });

  it('TC-004: getSpacingValue handles all spacing modes', () => {
    const values = ['compact', 'normal', 'relaxed'].map(s => getSpacingValue(s as any));
    expect(values).toEqual([4, 8, 16]);
  });
});