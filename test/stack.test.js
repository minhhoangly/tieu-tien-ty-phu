'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Stack = require('../js/stack.js');

const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) <= expected * 1e-9, `${actual} vs ${expected}`);

test('a 500.000 ₫ note is 0,1 mm thick', () => {
  assert.equal(Stack.noteVnd, 500000);
  near(Stack.stackHeightMeters(500000), 0.0001);
});

test('stackHeightMeters scales linearly with money', () => {
  near(Stack.stackHeightMeters(1e9), 0.2); // 2.000 notes
  near(Stack.stackHeightMeters(5e9), 1);
  near(Stack.stackHeightMeters(1.04e15), 208000); // top budget tier: 208 km
  assert.equal(Stack.stackHeightMeters(0), 0);
});

test('noteCount divides by the note value', () => {
  assert.equal(Stack.noteCount(1e9), 2000);
  assert.equal(Stack.noteCount(250000), 0.5);
});

test('formatLength picks a readable unit', () => {
  assert.equal(Stack.formatLength(0), '0 mm');
  assert.equal(Stack.formatLength(5e-6), '0,005 mm');
  assert.equal(Stack.formatLength(0.0001), '0,1 mm');
  assert.equal(Stack.formatLength(0.2), '20 cm');
  assert.equal(Stack.formatLength(1.144), '1,14 m');
  assert.equal(Stack.formatLength(461.3), '461,3 m');
  assert.equal(Stack.formatLength(3143), '3.143 m');
  assert.equal(Stack.formatLength(208000), '208 km');
});

test('compare describes the closest landmark', () => {
  assert.equal(Stack.compare(0, Stack.landmarks), null);
  assert.equal(Stack.compare(1.144, Stack.landmarks).text, 'bằng 67% chiều cao một người');
  assert.equal(Stack.compare(461.3, Stack.landmarks).text, 'xấp xỉ Landmark 81');
  assert.equal(Stack.compare(1000, Stack.landmarks).text, 'cao gấp 1,2 lần Burj Khalifa');
  assert.equal(Stack.compare(208000, Stack.landmarks).text, 'bằng 52% trạm vũ trụ ISS');
  assert.equal(Stack.compare(5e-6, Stack.landmarks).text, 'chưa tới 1% một cuốn sách dày');
});

test('landmarks are unique and sorted by height', () => {
  const ids = Stack.landmarks.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  for (let i = 1; i < Stack.landmarks.length; i++) {
    assert.ok(Stack.landmarks[i].m > Stack.landmarks[i - 1].m);
  }
});
