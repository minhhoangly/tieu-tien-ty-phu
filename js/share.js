/*
 * Draws the receipt as a shareable PNG "card" with the Canvas API.
 *
 * render(data) lays the card out twice: a first pass on a tall scratch canvas
 * measures the content height, then a second pass draws onto a canvas of
 * exactly that height. toBlob(canvas) turns it into a PNG.
 *
 * data = {
 *   budgetText, tierDesc, budget, spent, remaining,
 *   lines: [{ emoji, name, qty, cost }],           // already sorted, biggest spend first
 *   stack: { heightText, notesText, compareText }  // or null
 * }
 */
(function (root) {
  'use strict';

  var Core = root.Core;

  var W = 1080;
  var PAD = 64;
  var MAX_ROWS = 8;
  var FONT = '"Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif';
  var COLOR = {
    brand: '#da251d',
    brandDark: '#a81610',
    gold: '#ffcd00',
    goldSoft: '#fff0b8',
    goldInk: '#6b4f00',
    ink: '#2b2118',
    muted: '#7a6a5a',
    line: '#ead9bd',
    green: '#1f9d55',
    white: '#ffffff'
  };

  function font(size, weight) {
    return (weight || 400) + ' ' + size + 'px ' + FONT;
  }

  // Greedy word wrap using the context's current font.
  function wrap(ctx, text, maxWidth) {
    var words = String(text).split(' ');
    var lines = [];
    var line = '';
    words.forEach(function (word) {
      var test = line ? line + ' ' + word : word;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function ellipsize(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    var s = text;
    while (s.length > 1 && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1);
    return s.replace(/\s+$/, '') + '…';
  }

  // Largest font size (down to `min`) at which `text` fits in `maxWidth`.
  function fitSize(ctx, text, maxWidth, start, weight, min) {
    for (var size = start; size > min; size -= 2) {
      ctx.font = font(size, weight);
      if (ctx.measureText(text).width <= maxWidth) return size;
    }
    return min;
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Paints the card and returns the height it needs.
  function draw(ctx, data) {
    var canvas = ctx.canvas;
    var inner = W - PAD * 2;

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOR.white;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* header */
    ctx.font = font(32, 400);
    var subtitle = wrap(ctx, 'Mình có ' + data.budgetText + ' đồng — ' + data.tierDesc, inner);
    var headerH = 52 + 76 + 14 + subtitle.length * 44 + 40;
    var gradient = ctx.createLinearGradient(0, 0, 0, headerH);
    gradient.addColorStop(0, COLOR.brand);
    gradient.addColorStop(1, COLOR.brandDark);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, headerH);

    ctx.fillStyle = COLOR.white;
    ctx.font = font(66, 800);
    ctx.fillText('Tiêu Tiền Tỷ Phú', PAD, 52);
    ctx.font = font(32, 400);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    subtitle.forEach(function (line, i) {
      ctx.fillText(line, PAD, 52 + 76 + 14 + i * 44);
    });

    /* itemised list */
    var y = headerH + 44;
    ctx.fillStyle = COLOR.muted;
    ctx.font = font(24, 700);
    ctx.fillText('NHỮNG MÓN ĐÃ MUA', PAD, y);
    y += 50;

    var shown = data.lines.slice(0, MAX_ROWS);
    var rest = data.lines.slice(MAX_ROWS);
    var nameMax = W - PAD - 400 - (PAD + 80);

    shown.forEach(function (row) {
      ctx.fillStyle = COLOR.ink;
      ctx.font = font(46, 400);
      ctx.fillText(row.emoji, PAD, y + 6);

      ctx.font = font(34, 600);
      ctx.fillText(ellipsize(ctx, row.name, nameMax), PAD + 80, y + 10);

      ctx.textAlign = 'right';
      ctx.fillStyle = COLOR.muted;
      ctx.font = font(28, 400);
      ctx.fillText('×' + Core.formatCompact(row.qty), W - PAD - 300, y + 14);

      ctx.fillStyle = COLOR.green;
      ctx.font = font(34, 700);
      ctx.fillText(Core.formatCompact(row.cost), W - PAD, y + 10);
      ctx.textAlign = 'left';

      ctx.fillStyle = COLOR.line;
      ctx.fillRect(PAD, y + 74, inner, 2);
      y += 84;
    });

    if (rest.length) {
      var restCost = rest.reduce(function (sum, row) { return sum + row.cost; }, 0);
      ctx.fillStyle = COLOR.muted;
      ctx.font = font(28, 400);
      ctx.fillText('và ' + rest.length + ' món khác (' + Core.formatCompact(restCost) + ')', PAD + 80, y + 4);
      y += 56;
    }

    /* totals */
    y += 16;
    ctx.fillStyle = COLOR.ink;
    ctx.fillRect(PAD, y, inner, 4);
    y += 28;
    ctx.fillStyle = COLOR.muted;
    ctx.font = font(26, 700);
    ctx.fillText('TỔNG ĐÃ TIÊU', PAD, y);
    y += 40;

    var total = Core.formatVND(data.spent);
    var size = fitSize(ctx, total, inner, 76, 800, 36);
    ctx.font = font(size, 800);
    ctx.fillStyle = COLOR.green;
    ctx.fillText(total, PAD, y);
    y += size + 20;

    var percent = data.budget > 0 ? (data.spent / data.budget) * 100 : 0;
    ctx.font = font(30, 400);
    ctx.fillStyle = COLOR.ink;
    wrap(
      ctx,
      'Đã dùng ' + Core.formatPercent(percent) + ' ngân sách · còn lại ' + Core.formatVND(data.remaining),
      inner
    ).forEach(function (line) {
      ctx.fillText(line, PAD, y);
      y += 42;
    });

    /* banknote stack */
    if (data.stack) {
      y += 20;
      var boxPad = 28;
      ctx.font = font(28, 400);
      var detail = wrap(
        ctx,
        '≈ ' + data.stack.notesText + ' tờ · ' + data.stack.compareText,
        inner - boxPad * 2
      );
      var boxH = boxPad + 30 + 62 + detail.length * 38 + boxPad;
      ctx.fillStyle = COLOR.goldSoft;
      roundedRect(ctx, PAD, y, inner, boxH, 20);
      ctx.fill();

      var by = y + boxPad;
      ctx.fillStyle = COLOR.goldInk;
      ctx.font = font(24, 700);
      ctx.fillText('CHỒNG TIỀN 500.000 ₫ CAO', PAD + boxPad, by);
      by += 30;
      ctx.fillStyle = COLOR.ink;
      ctx.font = font(52, 800);
      ctx.fillText(data.stack.heightText, PAD + boxPad, by);
      by += 62;
      ctx.fillStyle = COLOR.ink;
      ctx.font = font(28, 400);
      detail.forEach(function (line) {
        ctx.fillText(line, PAD + boxPad, by);
        by += 38;
      });
      y += boxH;
    }

    /* footer */
    y += 36;
    ctx.fillStyle = COLOR.muted;
    ctx.font = font(22, 400);
    wrap(
      ctx,
      'Số liệu minh hoạ: mức tài sản, giá và chiều cao so sánh chỉ mang tính tham khảo.',
      inner
    ).forEach(function (line) {
      ctx.fillText(line, PAD, y);
      y += 30;
    });

    return Math.ceil(y + PAD * 0.7);
  }

  function render(data) {
    var probe = document.createElement('canvas');
    probe.width = W;
    probe.height = 4000;
    var height = draw(probe.getContext('2d'), data);

    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = height;
    draw(canvas.getContext('2d'), data);
    return canvas;
  }

  function toBlob(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error('Could not encode the card as PNG'));
      }, 'image/png');
    });
  }

  root.ShareCard = { render: render, toBlob: toBlob, width: W };
})(window);
