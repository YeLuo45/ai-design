// advanced-import.ts - Advanced import/export with batch operations
import type { Skill } from './skills.js';

export interface ExportPackage {
  version: string;
  exportedAt: string;
  skills: Skill[];
  metadata: {
    total: number;
    categories: string[];
  };
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface BatchExportOptions {
  format: 'json' | 'yaml';
  categories?: string[];
  includeMetadata: boolean;
}

export function createExportPackage(skills: Skill[], options: BatchExportOptions): ExportPackage {
  let filtered = skills;
  if (options.categories && options.categories.length > 0) {
    filtered = skills.filter(s => options.categories!.includes(s.category));
  }
  const categories = Array.from(new Set(filtered.map(s => s.category)));
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    skills: filtered,
    metadata: {
      total: filtered.length,
      categories,
    },
  };
}

export function exportToFormat(skills: Skill[], options: BatchExportOptions): string {
  const pkg = createExportPackage(skills, options);
  if (options.format === 'yaml') {
    return jsonToYaml(JSON.stringify(pkg, null, 2));
  }
  return JSON.stringify(pkg, null, 2);
}

export function validateImportPackage(data: unknown): data is ExportPackage {
  if (!data || typeof data !== 'object') return false;
  const pkg = data as Record<string, unknown>;
  return (
    typeof pkg.version === 'string' &&
    typeof pkg.exportedAt === 'string' &&
    Array.isArray(pkg.skills) &&
    typeof pkg.metadata === 'object'
  );
}

export function mergeSkills(existing: Skill[], imported: Skill[], mode: 'replace' | 'merge' = 'merge'): Skill[] {
  if (mode === 'replace') return imported;
  const existingIds = new Set(existing.map(s => s.id));
  const newSkills = imported.filter(s => !existingIds.has(s.id));
  return [...existing, ...newSkills];
}

export function getImportStats(existing: Skill[], imported: Skill[]): { new: number; duplicate: number; total: number } {
  const existingIds = new Set(existing.map(s => s.id));
  let duplicate = 0;
  imported.forEach(s => { if (existingIds.has(s.id)) duplicate++; });
  return {
    new: imported.length - duplicate,
    duplicate,
    total: imported.length,
  };
}

function jsonToYaml(json: string): string {
  const obj = JSON.parse(json);
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        lines.push(`  ${k}: ${JSON.stringify(v)}`);
      }
    } else {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    }
  }
  return lines.join('\n');
}

export function parseYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  let currentKey = '';
  for (const line of lines) {
    const match = line.match(/^(\S+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      try {
        result[key] = JSON.parse(value);
      } catch {
        result[key] = value;
      }
    }
  }
  return result;
}