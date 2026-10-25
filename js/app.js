(function () {
  'use strict';

  var Core = window.Core;
  var Stack = window.Stack;
  var ShareCard = window.ShareCard;
  var StackView = window.StackView;
  var Budgets = window.Budgets;
  var TIERS = Budgets.tiers;
  var DEFAULT_TIER = 3; // top 1% in Vietnam
  var DEFAULT_BUDGET = TIERS[DEFAULT_TIER].vnd;
  var STORAGE_KEY = 'tieu-tien:v1';

  var items = window.ITEMS.slice().sort(function (a, b) { return a.price - b.price; });
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var els = {
    title: document.getElementById('budget-title'),
    slider: document.getElementById('budget-slider'),
    ticks: document.getElementById('budget-ticks'),
    tierDesc: document.getElementById('tier-desc'),
    tierVnd: document.getElementById('tier-vnd'),
    interestValue: document.getElementById('interest-value'),
    interestCompact: document.getElementById('interest-compact'),
    interestRate: document.getElementById('interest-rate'),
    rateNote: document.getElementById('rate-note'),
    value: document.getElementById('money-value'),
    compact: document.getElementById('money-compact'),
    sr: document.getElementById('sr-balance'),
    list: document.getElementById('items'),
    receipt: document.getElementById('receipt'),
    receiptList: document.getElementById('receipt-list'),
    receiptTotal: document.getElementById('receipt-total'),
    share: document.getElementById('share-btn'),
    stackBtn: document.getElementById('stack-btn'),
    reset: document.getElementById('reset-btn'),
    shareDialog: document.getElementById('share-dialog'),
    sharePreview: document.getElementById('share-preview'),
    shareNative: document.getElementById('share-native'),
    shareDownload: document.getElementById('share-download'),
    shareCopy: document.getElementById('share-copy'),
    shareStatus: document.getElementById('share-status'),
    stackDialog: document.getElementById('stack-dialog'),
    stackHeight: document.getElementById('stack-height'),
    stackCompare: document.getElementById('stack-compare'),
    stackMeta: document.getElementById('stack-meta'),
    stackChart: document.getElementById('stack-chart')
  };

  var rows = {};            // item id -> { input, buy, sell, note }
  var state = loadState();  // { budget, amounts: { id: quantity } }
  var shown = remaining();  // value currently painted in the money bar
  var rafId = 0;
  var statusTimer = 0;

  /* ---------- state ---------- */

  function remaining() {
    return state.budget - Core.totalSpent(items, state.amounts);
  }

  function loadState() {
    var budget = DEFAULT_BUDGET;
    var amounts = {};
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && tierIndex(saved.budget) !== -1) {
        budget = saved.budget;
        amounts = Core.sanitizeAmounts(items, saved.amounts, budget);
      }
    } catch (e) { /* storage unavailable or corrupt: start fresh */ }
    return { budget: budget, amounts: amounts };
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function tierIndex(budget) {
    for (var i = 0; i < TIERS.length; i++) {
      if (TIERS[i].vnd === budget) return i;
    }
    return -1;
  }

  function budgetLabel() {
    return Core.formatCompact(state.budget);
  }

  function setAmount(item, quantity) {
    // Clamp against the money that would be free if this item were at zero.
    var others = remaining() + (state.amounts[item.id] || 0) * item.price;
    var q = Core.clampQuantity(quantity, item, others);
    if (q > 0) state.amounts[item.id] = q;
    else delete state.amounts[item.id];
    return q;
  }

  /* ---------- rendering ---------- */

  function buildItems() {
    items.forEach(function (item, index) {
      var li = document.createElement('li');
      li.className = 'item';
      li.style.setProperty('--hue', item.hue != null ? item.hue : (index * 37) % 360);

      var tile = document.createElement('div');
      tile.className = 'tile';
      if (item.image) {
        var img = document.createElement('img');
        img.src = item.image;
        img.alt = item.name;
        tile.appendChild(img);
      } else {
        var emoji = document.createElement('span');
        emoji.className = 'emoji';
        emoji.setAttribute('aria-hidden', 'true');
        emoji.textContent = item.emoji;
        tile.appendChild(emoji);
      }

      var name = document.createElement('h3');
      name.className = 'item-name';
      name.textContent = item.name;

      var price = document.createElement('div');
      price.className = 'item-price';
      price.textContent = Core.formatVND(item.price);

      var note = document.createElement('div');
      note.className = 'item-note';

      var controls = document.createElement('div');
      controls.className = 'controls';

      var sell = document.createElement('button');
      sell.type = 'button';
      sell.className = 'btn-sell';
      sell.textContent = 'Bán';
      sell.setAttribute('aria-label', 'Bán một ' + item.name);

      var input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.step = '1';
      input.inputMode = 'numeric';
      input.setAttribute('aria-label', 'Số lượng ' + item.name);

      var buy = document.createElement('button');
      buy.type = 'button';
      buy.className = 'btn-buy';
      buy.textContent = 'Mua';
      buy.setAttribute('aria-label', 'Mua một ' + item.name);

      sell.addEventListener('click', function () { change(item, -1); });
      buy.addEventListener('click', function () { change(item, +1); });
      input.addEventListener('input', function () {
        if (input.value === '') return; // let people clear the box while typing
        var q = setAmount(item, input.value);
        input.value = String(q);
        afterChange();
      });
      input.addEventListener('change', function () {
        input.value = String(state.amounts[item.id] || 0);
      });

      controls.append(sell, input, buy);
      li.append(tile, name, price, note, controls);
      els.list.appendChild(li);
      rows[item.id] = { input: input, buy: buy, sell: sell, note: note };
    });
  }

  function buildSlider() {
    els.slider.min = '0';
    els.slider.max = String(TIERS.length - 1);
    els.slider.step = '1';

    TIERS.forEach(function (tier, i) {
      var tick = document.createElement('span');
      tick.className = 'tick';
      tick.style.left = (i / (TIERS.length - 1)) * 100 + '%';
      tick.textContent = tier.short;
      els.ticks.appendChild(tick);
    });

    // While dragging, only preview the tier. Apply it when the drag ends.
    els.slider.addEventListener('input', function () { showTier(Number(els.slider.value)); });
    els.slider.addEventListener('change', function () { chooseTier(Number(els.slider.value)); });

    els.interestRate.textContent = String(Budgets.annualRate * 100).replace('.', ',') + '%';
    els.rateNote.textContent = '1 USD = ' + Core.formatVND(Budgets.vndPerUsd);
  }

  // Paint the tier text and its monthly-interest box (no state change).
  function showTier(index) {
    var tier = TIERS[index];
    var monthly = Core.monthlyInterest(tier.vnd, Budgets.annualRate);
    els.tierDesc.textContent = tier.desc;
    els.tierVnd.textContent = Core.formatVND(tier.vnd);
    els.slider.setAttribute('aria-valuetext', tier.desc + ': ' + Core.formatVND(tier.vnd));
    els.interestValue.textContent = Core.formatVND(monthly);
    els.interestCompact.textContent = monthly >= 1e6 ? '≈ ' + Core.formatCompact(monthly) + ' mỗi tháng' : '';
    Array.prototype.forEach.call(els.ticks.children, function (tick, i) {
      tick.classList.toggle('is-active', i === index);
    });
  }

  function chooseTier(index) {
    var current = tierIndex(state.budget);
    if (index === current) {
      showTier(current);
      return;
    }
    var hasSpend = Object.keys(state.amounts).length > 0;
    if (hasSpend && !window.confirm('Đổi ngân sách sẽ xoá các món bạn đã mua. Tiếp tục?')) {
      els.slider.value = String(current);
      showTier(current);
      return;
    }
    state = { budget: TIERS[index].vnd, amounts: {} };
    afterChange();
  }

  function change(item, delta) {
    setAmount(item, (state.amounts[item.id] || 0) + delta);
    afterChange();
  }

  function afterChange() {
    saveState();
    render();
    animateTo(remaining());
  }

  function render() {
    var left = remaining();

    els.title.textContent = budgetLabel();
    var index = tierIndex(state.budget);
    els.slider.value = String(index);
    showTier(index);

    items.forEach(function (item) {
      var row = rows[item.id];
      var amount = state.amounts[item.id] || 0;
      var atLimit = item.limit != null && amount >= item.limit;
      if (document.activeElement !== row.input) row.input.value = String(amount);
      row.sell.disabled = amount === 0;
      row.buy.disabled = left < item.price || atLimit;
      row.note.textContent = item.limit != null ? 'Tối đa ' + item.limit : '';
    });

    renderReceipt();
  }

  function renderReceipt() {
    var spent = Core.totalSpent(items, state.amounts);
    els.receipt.hidden = spent === 0;
    els.receiptList.textContent = '';
    items.forEach(function (item) {
      var amount = state.amounts[item.id] || 0;
      if (!amount) return;
      var li = document.createElement('li');
      var n = document.createElement('span');
      n.textContent = item.name;
      var q = document.createElement('span');
      q.className = 'r-qty';
      q.textContent = '×' + Core.formatCompact(amount);
      var c = document.createElement('span');
      c.className = 'r-cost';
      c.textContent = Core.formatCompact(amount * item.price);
      li.append(n, q, c);
      els.receiptList.appendChild(li);
    });
    els.receiptTotal.textContent = Core.formatVND(spent);
  }

  /* ---------- money bar animation ---------- */

  function paint() {
    els.value.textContent = Core.formatVND(shown);
    els.compact.textContent = shown >= 1e6 ? '≈ ' + Core.formatCompact(shown) : '';
  }

  function duration(diff) {
    if (diff < 1e5) return 400;
    if (diff < 1e9) return 800;
    if (diff < 1e12) return 1300;
    return 1800;
  }

  function announce(target) {
    els.sr.textContent = 'Số dư còn lại ' + Core.formatVND(target);
  }

  function animateTo(target) {
    cancelAnimationFrame(rafId);
    var from = shown;
    var diff = Math.abs(target - from);
    if (diff === 0 || reducedMotion.matches) {
      shown = target;
      paint();
      announce(target);
      return;
    }
    var span = duration(diff);
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / span);
      shown = from + (target - from) * (1 - Math.pow(1 - t, 3)); // ease-out cubic
      paint();
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        shown = target;
        paint();
        announce(target);
      }
    }
    rafId = requestAnimationFrame(step);
  }

  /* ---------- receipt actions ---------- */

  var CARD_FILE = 'tieu-tien-bien-lai.png';
  var cardBlob = null;
  var cardFile = null;
  var cardUrl = '';

  function spentTotal() {
    return Core.totalSpent(items, state.amounts);
  }

  // Height of the stack of 500.000 ₫ notes the receipt adds up to.
  function stackInfo() {
    var spent = spentTotal();
    var height = Stack.stackHeightMeters(spent);
    var notes = Stack.noteCount(spent);
    return {
      spent: spent,
      height: height,
      heightText: Stack.formatLength(height),
      notesText: notes < 1000 ? Core.formatNumber(notes, 2) : Core.formatCompact(notes),
      compare: Stack.compare(height, Stack.landmarks)
    };
  }

  function receiptData() {
    var info = stackInfo();
    var tier = TIERS[tierIndex(state.budget)];
    var lines = items
      .filter(function (item) { return state.amounts[item.id] > 0; })
      .map(function (item) {
        var qty = state.amounts[item.id];
        return { emoji: item.emoji || '🛍️', name: item.name, qty: qty, cost: qty * item.price };
      })
      .sort(function (a, b) { return b.cost - a.cost; });
    return {
      budgetText: budgetLabel(),
      tierDesc: tier.desc,
      budget: state.budget,
      spent: info.spent,
      remaining: remaining(),
      lines: lines,
      stack: {
        heightText: info.heightText,
        notesText: info.notesText,
        compareText: info.compare ? info.compare.text : ''
      }
    };
  }

  function say(message) {
    els.shareStatus.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { els.shareStatus.textContent = ''; }, 4000);
  }

  function releaseCard() {
    if (cardUrl) URL.revokeObjectURL(cardUrl);
    cardUrl = '';
    cardBlob = null;
    cardFile = null;
    els.sharePreview.removeAttribute('src');
  }

  /* share card: preview image plus share / download / copy */

  function openShare() {
    var data = receiptData();
    ShareCard.toBlob(ShareCard.render(data)).then(function (blob) {
      releaseCard();
      cardBlob = blob;
      cardUrl = URL.createObjectURL(blob);
      cardFile = typeof File === 'function' ? new File([blob], CARD_FILE, { type: 'image/png' }) : null;

      els.sharePreview.src = cardUrl;
      els.sharePreview.alt =
        'Thẻ biên lai: đã tiêu ' + Core.formatCompact(data.spent) + ' trên tổng ' + data.budgetText + ' đồng';
      els.shareNative.hidden = !(cardFile && navigator.share && navigator.canShare &&
        navigator.canShare({ files: [cardFile] }));
      els.shareCopy.hidden = !(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem);
      els.shareStatus.textContent = '';
      els.shareDialog.showModal();
    }).catch(function () {
      window.alert('Không thể tạo thẻ chia sẻ. Hãy thử lại.');
    });
  }

  els.share.addEventListener('click', openShare);
  els.shareDialog.addEventListener('close', releaseCard);

  els.shareNative.addEventListener('click', function () {
    if (!cardFile) return;
    navigator.share({ files: [cardFile], title: 'Tiêu Tiền Tỷ Phú', text: 'Biên lai tiêu tiền của mình' })
      .catch(function (err) {
        if (!err || err.name !== 'AbortError') say('Không thể chia sẻ ảnh này. Hãy thử tải xuống.');
      });
  });

  els.shareDownload.addEventListener('click', function () {
    if (!cardUrl) return;
    var link = document.createElement('a');
    link.href = cardUrl;
    link.download = CARD_FILE;
    document.body.appendChild(link);
    link.click();
    link.remove();
    say('Đã tải ảnh xuống.');
  });

  els.shareCopy.addEventListener('click', function () {
    if (!cardBlob) return;
    navigator.clipboard.write([new ClipboardItem({ 'image/png': cardBlob })]).then(
      function () { say('Đã sao chép ảnh. Hãy dán vào tin nhắn hoặc bài viết.'); },
      function () { say('Không thể sao chép ảnh. Hãy thử tải xuống.'); }
    );
  });

  /* banknote stack height vs real landmarks */

  function openStack() {
    var info = stackInfo();
    els.stackHeight.textContent = info.heightText;
    els.stackCompare.textContent = info.compare
      ? 'Chồng tiền của bạn ' + info.compare.text + '.'
      : '';
    els.stackMeta.textContent =
      '≈ ' + info.notesText + ' tờ 500.000 ₫ · tổng đã tiêu ' + Core.formatVND(info.spent);
    StackView.render(
      els.stackChart,
      info.height,
      Stack.landmarks,
      info.compare ? info.compare.landmark.id : ''
    );
    els.stackDialog.showModal();
  }

  els.stackBtn.addEventListener('click', openStack);

  els.reset.addEventListener('click', function () {
    state.amounts = {};
    afterChange();
  });

  /* ---------- boot ---------- */

  buildSlider();
  buildItems();
  render();
  paint();
  announce(shown);
})();
