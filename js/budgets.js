/*
 * Budget tiers for the slider, lowest (left) to highest (right).
 *
 * Each tier is defined in USD and converted to VND with one fixed rate, so
 * changing VND_PER_USD or ANNUAL_RATE here updates the whole page.
 * The wealth levels and rankings are rough illustrations, not audited
 * statistics; check them before publishing.
 *
 * The top tier is about 1.04 × 10^15 ₫, still well inside the exact-integer
 * range of a JS number (about 9 × 10^15).
 */
(function (root) {
  'use strict';

  var VND_PER_USD = 26000;
  var ANNUAL_RATE = 0.05; // savings-deposit interest per year

  var TIERS = [
    { usd: 8e3, short: 'Top 50%', desc: 'Top 50% người giàu nhất Việt Nam' },
    { usd: 5e4, short: 'Top 10%', desc: 'Top 10% người giàu nhất Việt Nam' },
    { usd: 8e4, short: 'Top 5%', desc: 'Top 5% người giàu nhất Việt Nam' },
    { usd: 2.2e5, short: 'Top 1%', desc: 'Top 1% người giàu nhất Việt Nam' },
    { usd: 8e5, short: 'Top 0,1%', desc: 'Top 0,1% người giàu nhất Việt Nam' },
    { usd: 1e7, short: 'Toàn cầu', desc: 'Mức giàu có trên bình diện thế giới' },
    { usd: 1e9, short: 'Top 10 VN', desc: 'Nằm trong top 10 người giàu nhất Việt Nam' },
    { usd: 4e10, short: 'Số 1 VN', desc: 'Tài sản như Phạm Nhật Vượng, người giàu nhất Việt Nam' }
  ].map(function (tier) {
    return {
      usd: tier.usd,
      vnd: tier.usd * VND_PER_USD,
      short: tier.short,
      desc: tier.desc
    };
  });

  var api = { vndPerUsd: VND_PER_USD, annualRate: ANNUAL_RATE, tiers: TIERS };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Budgets = api;
})(typeof window !== 'undefined' ? window : this);
