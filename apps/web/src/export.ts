// export.ts - Skill export utilities
import type { Skill } from './skills.js';

export interface ExportFormat {
  version: string;
  exportedAt: string;
  skills: Skill[];
}

export function exportToJSON(skills: Skill[]): string {
  const format: ExportFormat = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    skills,
  };
  return JSON.stringify(format, null, 2);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadJSON(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatExportSize(json: string): string {
  const bytes = new Blob([json]).size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}