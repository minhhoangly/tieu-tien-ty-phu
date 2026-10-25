'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Budgets = require('../js/budgets.js');

test('budget tiers match the agreed USD levels, lowest to highest', () => {
  assert.deepEqual(
    Budgets.tiers.map((t) => t.usd),
    [8e3, 5e4, 8e4, 2.2e5, 8e5, 1e7, 1e9, 4e10]
  );
});

test('budget tiers convert to VND at the configured rate', () => {
  assert.equal(Budgets.vndPerUsd, 26000);
  for (const tier of Budgets.tiers) assert.equal(tier.vnd, tier.usd * 26000);
  assert.equal(Budgets.tiers[0].vnd, 208000000);
  assert.equal(Budgets.tiers[7].vnd, 1040000000000000);
});

test('budget tiers are strictly ascending and safely inside integer range', () => {
  for (let i = 1; i < Budgets.tiers.length; i++) {
    assert.ok(Budgets.tiers[i].vnd > Budgets.tiers[i - 1].vnd);
  }
  const top = Budgets.tiers[Budgets.tiers.length - 1].vnd;
  assert.ok(top * 4 < Number.MAX_SAFE_INTEGER);
  for (const tier of Budgets.tiers) {
    assert.ok(tier.short && tier.desc);
  }
});

test('catalogue ids are unique and prices are positive whole numbers', () => {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/items.js'), 'utf8'), ctx);
  const items = ctx.window.ITEMS;
  assert.ok(items.length > 0);
  assert.equal(new Set(items.map((i) => i.id)).size, items.length);
  for (const item of items) {
    assert.ok(Number.isInteger(item.price) && item.price > 0, item.id);
    if (item.limit != null) assert.ok(Number.isInteger(item.limit) && item.limit > 0, item.id);
  }
});
