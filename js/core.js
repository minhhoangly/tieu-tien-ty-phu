/*
 * Pure logic for Tiêu Tiền Tỷ Phú: number formatting and purchase rules.
 * No DOM access, so it can be unit-tested with `node --test`.
 *
 * All amounts are whole VND held in plain JS numbers. That is exact up to
 * 2^53 (about 9 × 10^15 ₫); keep budgets below that or switch to BigInt.
 */
(function (root) {
  'use strict';

  // Vietnamese magnitude words, largest first. Each step is a factor of 1000.
  var UNITS = [
    { value: 1e12, label: 'nghìn tỷ' },
    { value: 1e9, label: 'tỷ' },
    { value: 1e6, label: 'triệu' },
    { value: 1e3, label: 'nghìn' }
  ];

  // 1234567 -> "1.234.567" (Vietnamese uses a dot as thousands separator).
  function groupDigits(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function formatVND(n) {
    return groupDigits(n) + ' ₫';
  }

  // 1500000000 -> "1,5 tỷ" (comma is the decimal separator, up to 2 decimals).
  function formatCompact(n) {
    n = Math.round(n);
    if (n < 1000) return String(n);
    var i = 0;
    while (i < UNITS.length - 1 && n < UNITS[i].value) i++;
    var rounded = Math.round((n / UNITS[i].value) * 100) / 100;
    // 999,996 triệu would print as "1000 triệu"; promote to the next unit.
    if (rounded >= 1000 && i > 0) {
      i--;
      rounded = Math.round((n / UNITS[i].value) * 100) / 100;
    }
    // Dots group the whole part ("1.040 nghìn tỷ"), a comma starts the decimals.
    var parts = String(rounded).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',') + ' ' + UNITS[i].label;
  }

  // Simple (non-compounding) interest earned in one month on `principal`
  // at `annualRate` per year, e.g. 0.05 for 5%.
  function monthlyInterest(principal, annualRate) {
    return Math.round((principal * annualRate) / 12);
  }

  // Most units of `item` you can hold given the money left once this item's
  // own current spend is returned (`remainingExcl`), and the item's limit.
  function maxQuantity(item, remainingExcl) {
    var affordable = Math.floor(Math.max(0, remainingExcl) / item.price);
    var limit = item.limit == null ? Infinity : item.limit;
    return Math.min(affordable, limit);
  }

  // Turn whatever was typed into a valid whole quantity for this item.
  function clampQuantity(requested, item, remainingExcl) {
    var n = Math.floor(Math.abs(Number(requested)));
    if (isNaN(n)) n = 0;
    return Math.min(n, maxQuantity(item, remainingExcl));
  }

  function totalSpent(items, amounts) {
    var sum = 0;
    for (var i = 0; i < items.length; i++) {
      sum += (amounts[items[i].id] || 0) * items[i].price;
    }
    return sum;
  }

  // Validate untrusted saved data (e.g. from localStorage). Unknown ids and
  // bad values are dropped, and quantities are clamped so the total never
  // exceeds the budget or an item's limit.
  function sanitizeAmounts(items, saved, budget) {
    var out = {};
    if (!saved || typeof saved !== 'object') return out;
    var spent = 0;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var q = clampQuantity(saved[item.id], item, budget - spent);
      if (q > 0) {
        out[item.id] = q;
        spent += q * item.price;
      }
    }
    return out;
  }

  var api = {
    groupDigits: groupDigits,
    formatVND: formatVND,
    formatCompact: formatCompact,
    monthlyInterest: monthlyInterest,
    maxQuantity: maxQuantity,
    clampQuantity: clampQuantity,
    totalSpent: totalSpent,
    sanitizeAmounts: sanitizeAmounts
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Core = api;
})(typeof window !== 'undefined' ? window : this);
