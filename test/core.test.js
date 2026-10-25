'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../js/core.js');

test('formatVND groups digits with dots', () => {
  assert.equal(Core.formatVND(0), '0 ₫');
  assert.equal(Core.formatVND(25000), '25.000 ₫');
  assert.equal(Core.formatVND(1234567), '1.234.567 ₫');
  assert.equal(Core.formatVND(1e13), '10.000.000.000.000 ₫');
});

test('formatCompact uses Vietnamese magnitude words', () => {
  assert.equal(Core.formatCompact(0), '0');
  assert.equal(Core.formatCompact(999), '999');
  assert.equal(Core.formatCompact(25000), '25 nghìn');
  assert.equal(Core.formatCompact(8e6), '8 triệu');
  assert.equal(Core.formatCompact(1.5e9), '1,5 tỷ');
  assert.equal(Core.formatCompact(1e13), '10 nghìn tỷ');
  assert.equal(Core.formatCompact(1.25e12), '1,25 nghìn tỷ');
  assert.equal(Core.formatCompact(1.2345e9), '1,23 tỷ');
  assert.equal(Core.formatCompact(2.6e13), '26 nghìn tỷ');
  assert.equal(Core.formatCompact(2.08e8), '208 triệu');
});

test('formatCompact groups large whole parts with dots', () => {
  assert.equal(Core.formatCompact(1.04e15), '1.040 nghìn tỷ');
});

test('monthlyInterest is simple interest divided over twelve months', () => {
  assert.equal(Core.monthlyInterest(1.2e9, 0.05), 5000000);
  assert.equal(Core.monthlyInterest(5.72e9, 0.05), 23833333);
  assert.equal(Core.monthlyInterest(1.04e15, 0.05), 4333333333333);
  assert.equal(Core.monthlyInterest(0, 0.05), 0);
});

test('formatCompact promotes values that would round to 1000 of a unit', () => {
  assert.equal(Core.formatCompact(999996000), '1 tỷ');
  assert.equal(Core.formatCompact(999996), '1 triệu');
  assert.equal(Core.formatCompact(999960000), '999,96 triệu');
});

const pho = { id: 'pho', price: 50000 };
const painting = { id: 'painting', price: 250e9, limit: 1 };

test('maxQuantity respects budget and limit', () => {
  assert.equal(Core.maxQuantity(pho, 1e6), 20);
  assert.equal(Core.maxQuantity(pho, 49999), 0);
  assert.equal(Core.maxQuantity(pho, -5), 0);
  assert.equal(Core.maxQuantity(painting, 1e13), 1);
});

test('clampQuantity cleans typed input', () => {
  assert.equal(Core.clampQuantity('7', pho, 1e6), 7);
  assert.equal(Core.clampQuantity('-3', pho, 1e6), 3);
  assert.equal(Core.clampQuantity('2.9', pho, 1e6), 2);
  assert.equal(Core.clampQuantity('abc', pho, 1e6), 0);
  assert.equal(Core.clampQuantity('999999', pho, 1e6), 20);
});

test('totalSpent sums quantity times price', () => {
  const items = [pho, painting];
  assert.equal(Core.totalSpent(items, {}), 0);
  assert.equal(Core.totalSpent(items, { pho: 3, painting: 1 }), 150000 + 250e9);
});

test('sanitizeAmounts drops bad data and never exceeds the budget', () => {
  const items = [pho, painting];
  assert.deepEqual(Core.sanitizeAmounts(items, null, 1e6), {});
  assert.deepEqual(Core.sanitizeAmounts(items, { ghost: 5, pho: 'x' }, 1e6), {});
  assert.deepEqual(Core.sanitizeAmounts(items, { pho: 1000 }, 1e6), { pho: 20 });
  assert.deepEqual(Core.sanitizeAmounts(items, { painting: 5 }, 1e13), { painting: 1 });
});
