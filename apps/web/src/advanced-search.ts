// advanced-search.ts - Advanced search with query syntax
import type { Skill } from './skills.js';

export interface SearchQuery {
  raw: string;
  tokens: Token[];
  filters: Filter[];
}

export interface Token {
  type: 'term' | 'field' | 'op';
  value: string;
}

export interface Filter {
  field: string;
  op: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'contains';
  value: string | number;
}

export interface SearchHighlight {
  skillId: string;
  matches: { field: string; snippet: string }[];
}

export function parseQuery(query: string): SearchQuery {
  const tokens = tokenize(query);
  const filters = parseFilters(tokens);
  return { raw: query, tokens, filters };
}

function tokenize(query: string): Token[] {
  const tokens: Token[] = [];
  const regex = /(\w+:\S+)|(\w+)|(".*?")|(\S+)/g;
  let match;
  while ((match = regex.exec(query)) !== null) {
    const value = match[1] || match[2] || match[3] || match[4];
    const type = value.includes(':') ? 'field' : 'term';
    tokens.push({ type: type as 'term' | 'field', value });
  }
  return tokens;
}

function parseFilters(tokens: Token[]): Filter[] {
  const filters: Filter[] = [];
  for (const token of tokens) {
    if (token.type === 'field') {
      const [field, opStr] = token.value.split(/:(.+)/);
      const ops = ['>=', '<=', '>', '<', '='];
      let op: Filter['op'] = 'contains';
      let value = opStr;
      for (const o of ops) {
        if (opStr.startsWith(o)) {
          op = o as Filter['op'];
          value = opStr.slice(o.length);
          break;
        }
      }
      // Map raw operators to Filter op types
      const opMap: Record<string, Filter['op']> = { '>': 'gt', '<': 'lt', '>=': 'gte', '<=': 'lte', '=': 'eq' };
      filters.push({ field, op: opMap[op] ?? op, value: parseFloat(value) || value });
    }
  }
  return filters;
}

export function matchSkillAdvanced(skill: Skill, query: SearchQuery): boolean {
  if (query.filters.length === 0) {
    const q = query.raw.toLowerCase();
    return skill.name.toLowerCase().includes(q) ||
           skill.description.toLowerCase().includes(q);
  }
  for (const filter of query.filters) {
    if (!applyFilter(skill, filter)) return false;
  }
  return true;
}

function applyFilter(skill: Skill, filter: Filter): boolean {
  const fieldValue = (skill as any)[filter.field];
  if (fieldValue === undefined) return false;
  switch (filter.op) {
    case 'gt': return fieldValue > filter.value;
    case 'lt': return fieldValue < filter.value;
    case 'gte': return fieldValue >= filter.value;
    case 'lte': return fieldValue <= filter.value;
    case 'eq': return fieldValue === filter.value;
    case 'contains': return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
  }
}

export function highlightMatches(text: string, query: string): string {
  if (!query) return text;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let result = text;
  for (const term of terms) {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  }
  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getSnippet(text: string, query: string, maxLength = 100): string {
  const lower = text.toLowerCase();
  const q = query.toLowerCase().split(/\s+/)[0];
  const idx = lower.indexOf(q);
  if (idx === -1) return text.slice(0, maxLength) + (text.length > maxLength ? '...' : '');
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, start + maxLength);
  const snippet = text.slice(start, end);
  return (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '');
}

export function buildSavedFilter(name: string, filters: Filter[]): { name: string; filters: Filter[] } {
  return { name, filters: [...filters] };
}

export function applySavedFilter(skills: Skill[], saved: { filters: Filter[] }): Skill[] {
  return skills.filter(s => saved.filters.every(f => applyFilter(s, f)));
}