import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatClock, languageLabel, positionAt } from '../js/voice-desk.js';

test('formatClock pads minutes and seconds', () => {
  assert.equal(formatClock(0), '00:00');
  assert.equal(formatClock(5_000), '00:05');
  assert.equal(formatClock(65_000), '01:05');
  assert.equal(formatClock(3_661_000), '1:01:01');
});

test('languageLabel maps known ids', () => {
  assert.equal(languageLabel('es-ES'), 'Spanish (Spain)');
  assert.equal(languageLabel('en'), 'English');
  assert.equal(languageLabel('xx'), 'xx');
});

test('positionAt stays inside a 72-hour cycle', () => {
  const pos = positionAt(Date.UTC(2026, 7, 2, 13, 30, 0));
  assert.ok(pos.slot >= 0 && pos.slot < 72);
  assert.ok(pos.day >= 1 && pos.day <= 3);
  assert.ok(pos.hour >= 0 && pos.hour <= 23);
  assert.ok(pos.title.length > 2);
  assert.ok(pos.remainingMs > 0 && pos.remainingMs <= 60 * 60 * 1000);
});
