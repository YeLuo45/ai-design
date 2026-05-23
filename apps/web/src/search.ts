// search.ts - Advanced search and filtering
import type { Skill } from './skills.js';

export interface SearchOptions {
  query: string;
  category?: Skill['category'];
  minRating?: number;
  tags?: string[];
  limit?: number;
}

export interface SearchResult {
  skills: Skill[];
  total: number;
  query: string;
  took: number; // ms
}

const HISTORY_KEY = 'ai-design:search-history';
const MAX_HISTORY = 10;

export function parseQuery(query: string): { field: string | null; value: string } {
  const match = query.match(/^(\w+):(.+)$/);
  if (match) return { field: match[1], value: match[2] };
  return { field: null, value: query };
}

export function matchSkill(skill: Skill, query: string): boolean {
  if (!query) return true;
  const { field, value } = parseQuery(query);
  const q = value.toLowerCase();
  if (field === 'name') return skill.name.toLowerCase().includes(q);
  if (field === 'category') return skill.category.toLowerCase().includes(q);
  if (field === 'tag') return skill.tags.some(t => t.toLowerCase().includes(q));
  if (field === 'rating') return skill.rating >= parseFloat(q);
  return skill.name.toLowerCase().includes(q) ||
         skill.description.toLowerCase().includes(q) ||
         skill.tags.some(t => t.toLowerCase().includes(q));
}

export function filterByCategory(skills: Skill[], category: Skill['category']): Skill[] {
  return skills.filter(s => s.category === category);
}

export function filterByRating(skills: Skill[], min: number): Skill[] {
  return skills.filter(s => s.rating >= min);
}

export function filterByTags(skills: Skill[], tags: string[]): Skill[] {
  if (tags.length === 0) return skills;
  return skills.filter(s => tags.some(t => s.tags.includes(t)));
}

export function searchSkills(skills: Skill[], options: SearchOptions): SearchResult {
  const start = Date.now();
  let results = skills;
  if (options.query) {
    results = results.filter(s => matchSkill(s, options.query));
  }
  if (options.category) {
    results = filterByCategory(results, options.category);
  }
  if (options.minRating !== undefined) {
    results = filterByRating(results, options.minRating);
  }
  if (options.tags && options.tags.length > 0) {
    results = filterByTags(results, options.tags);
  }
  const total = results.length;
  if (options.limit) {
    results = results.slice(0, options.limit);
  }
  return { skills: results, total, query: options.query, took: Date.now() - start };
}

export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addToHistory(query: string): void {
  if (!query.trim()) return;
  const history = getSearchHistory().filter(h => h !== query);
  history.unshift(query);
  const trimmed = history.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export function clearSearchHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function getSuggestions(allSkills: Skill[], prefix: string): string[] {
  if (!prefix) return [];
  const q = prefix.toLowerCase();
  const names = allSkills
    .filter(s => s.name.toLowerCase().startsWith(q))
    .map(s => s.name)
    .slice(0, 5);
  const tagPrefix = 'tag:';
  if (prefix.startsWith(tagPrefix)) {
    const tagQ = prefix.slice(tagPrefix.length).toLowerCase();
    const tags = allSkills
      .flatMap(s => s.tags)
      .filter((t, i, arr) => arr.indexOf(t) === i && t.toLowerCase().startsWith(tagQ))
      .map(t => tagPrefix + t)
      .slice(0, 5);
    return tags;
  }
  return names;
}