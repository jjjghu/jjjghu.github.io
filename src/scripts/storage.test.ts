import { afterEach, expect, it, vi } from 'vitest';
import { storage } from './storage';
import { SettingsManager } from './settingsManager';

afterEach(() => vi.unstubAllGlobals());

it('keeps preferences usable when reads and writes are denied', () => {
  vi.stubGlobal('localStorage', {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('quota'); },
    removeItem() { throw new Error('denied'); },
  });
  expect(storage.getItem('blocked')).toBeNull();
  expect(storage.setItem('blocked', 'true')).toBe(false);
  expect(storage.getItem('blocked')).toBe('true');
  storage.removeItem('blocked');
  expect(storage.getItem('blocked')).toBeNull();
});

it('ignores non-finite numeric settings and invalid colors', () => {
  vi.stubGlobal('localStorage', { getItem: () => 'Infinity' });
  const manager = new SettingsManager();
  manager.register({ key: 'range-test', type: 'range', defaultValue: 1 });
  manager.register({ key: 'color-test', type: 'color', defaultValue: null });
  expect(manager.get('range-test')).toBe(1);
  expect(manager.get('color-test')).toBeNull();
});
