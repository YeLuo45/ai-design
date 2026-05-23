// import.ts - Data import and persistence
import type { Skill } from './skills.js';

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export function validateSkillData(data: unknown): data is Skill {
  if (typeof data !== 'object' || data === null) return false;
  const s = data as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    typeof s.category === 'string' &&
    typeof s.description === 'string' &&
    Array.isArray(s.tags) &&
    typeof s.rating === 'number'
  );
}

export function parseImportJSON(json: string): { skills: Skill[]; errors: string[] } {
  const errors: string[] = [];
  try {
    const parsed = JSON.parse(json);
    const arr = Array.isArray(parsed) ? parsed : parsed.skills;
    if (!Array.isArray(arr)) {
      return { skills: [], errors: ['Invalid format: expected array'] };
    }
    const skills: Skill[] = [];
    arr.forEach((item, i) => {
      if (validateSkillData(item)) {
        skills.push(item);
      } else {
        errors.push(`Item ${i}: invalid structure`);
      }
    });
    return { skills, errors };
  } catch (e) {
    return { skills: [], errors: [`JSON parse error: ${e}`] };
  }
}

export function mergeSkills(existing: Skill[], incoming: Skill[]): { merged: Skill[]; added: number; replaced: number } {
  let added = 0, replaced = 0;
  const merged = [...existing];
  const ids = new Set(existing.map(s => s.id));
  incoming.forEach(skill => {
    const idx = merged.findIndex(s => s.id === skill.id);
    if (idx === -1) {
      merged.push(skill);
      added++;
    } else {
      merged[idx] = skill;
      replaced++;
    }
  });
  return { merged, added, replaced };
}

export function createBackup(data: Skill[]): string {
  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    skills: data,
  };
  localStorage.setItem('ai-design:backup', JSON.stringify(backup));
  return backup.timestamp;
}

export function loadBackup(): { timestamp: string; skills: Skill[] } | null {
  try {
    const raw = localStorage.getItem('ai-design:backup');
    if (!raw) return null;
    const backup = JSON.parse(raw);
    return { timestamp: backup.timestamp, skills: backup.skills || [] };
  } catch {
    return null;
  }
}

export function importFromFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { skills, errors } = parseImportJSON(text);
      if (skills.length === 0) {
        resolve({ success: false, imported: 0, skipped: 0, errors: ['No valid skills found'] });
        return;
      }
      resolve({ success: true, imported: skills.length, skipped: 0, errors });
    };
    reader.onerror = () => resolve({ success: false, imported: 0, skipped: 0, errors: ['File read error'] });
    reader.readAsText(file);
  });
}