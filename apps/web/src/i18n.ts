// i18n.ts - Internationalization support
export type Locale = 'en' | 'zh';
export type TranslationKey = 'app.title' | 'app.subtitle' | 'skill.search' | 'skill.export' | 'skill.import' | 'theme.light' | 'theme.dark' | 'theme.system' | 'common.save' | 'common.cancel' | 'common.confirm' | 'common.delete' | 'notification.success' | 'notification.error';

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    'app.title': 'ai-design',
    'app.subtitle': 'Design System Platform',
    'skill.search': 'Search skills...',
    'skill.export': 'Export',
    'skill.import': 'Import',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'notification.success': 'Success',
    'notification.error': 'Error',
  },
  zh: {
    'app.title': 'ai-design',
    'app.subtitle': '设计系统平台',
    'skill.search': '搜索技能...',
    'skill.export': '导出',
    'skill.import': '导入',
    'theme.light': '浅色',
    'theme.dark': '深色',
    'theme.system': '跟随系统',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.delete': '删除',
    'notification.success': '成功',
    'notification.error': '错误',
  },
};

const LOCALE_KEY = 'ai-design:locale';

export function getLocale(): Locale {
  try {
    const raw = localStorage.getItem(LOCALE_KEY);
    if (raw === 'en' || raw === 'zh') return raw;
    const browser = navigator.language.toLowerCase();
    if (browser.startsWith('zh')) return 'zh';
    return 'en';
  } catch {
    return 'en';
  }
}

export function setLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // Storage error - ignore
  }
}

export function t(key: TranslationKey, locale?: Locale): string {
  const currentLocale = locale || getLocale();
  return translations[currentLocale][key] || key;
}

export function formatDate(date: Date | string, locale?: Locale): string {
  const currentLocale = locale || getLocale();
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(currentLocale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatNumber(num: number, locale?: Locale): string {
  const currentLocale = locale || getLocale();
  return num.toLocaleString(currentLocale === 'zh' ? 'zh-CN' : 'en-US');
}

export function getAvailableLocales(): { code: Locale; name: string }[] {
  return [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
  ];
}

export function getLocaleDisplayName(locale: Locale): string {
  const names: Record<Locale, string> = { en: 'English', zh: '中文' };
  return names[locale];
}