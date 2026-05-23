import { describe, it, expect } from 'vitest';
import { classNames, formatDate } from '../utils';

describe('utils', () => {
  describe('classNames', () => {
    it('joins class names', () => {
      expect(classNames('foo', 'bar')).toBe('foo bar');
    });

    it('filters falsy values', () => {
      expect(classNames('foo', false, 'bar', null, 'baz')).toBe('foo bar baz');
    });

    it('handles all falsy', () => {
      expect(classNames(false, null, undefined)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = formatDate(date);
      expect(result).toContain('Jan');
      expect(result).toContain('15');
    });
  });
});