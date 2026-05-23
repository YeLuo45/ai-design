// theme.ts - Theme customization system

export type Theme = 'light' | 'dark' | 'system';
export type Spacing = 'compact' | 'normal' | 'relaxed';

export interface ThemeConfig {
  theme: Theme;
  fontFamily: string;
  spacing: Spacing;
  borderRadius: number;
}

const STORAGE_KEY = 'ai-design:theme';

const FONTS = [
  'system-ui, -apple-system, sans-serif',
  'Georgia, serif',
  'Monaco, monospace',
] as const;

const DEFAULT_CONFIG: ThemeConfig = {
  theme: 'system',
  fontFamily: FONTS[0],
  spacing: 'normal',
  borderRadius: 8,
};

export function getThemeConfig(): ThemeConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function setThemeConfig(partial: Partial<ThemeConfig>): void {
  const current = getThemeConfig();
  const updated = { ...current, ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getFontFamilies(): readonly string[] {
  return FONTS;
}

export function getEffectiveTheme(): 'light' | 'dark' {
  const config = getThemeConfig();
  if (config.theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return config.theme;
}

export function getSpacingValue(spacing: Spacing): number {
  switch (spacing) {
    case 'compact': return 4;
    case 'normal': return 8;
    case 'relaxed': return 16;
  }
}

export function getBorderRadiusPx(config: ThemeConfig): string {
  return `${config.borderRadius}px`;
}