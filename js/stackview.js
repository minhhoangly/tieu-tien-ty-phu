/*
 * Draws the banknote-stack height on a logarithmic ruler next to real
 * landmarks (SVG, no libraries).
 *
 * A linear ruler cannot work here: stacks run from a fraction of a millimetre
 * to hundreds of kilometres, so each major tick is 10x the one below it.
 *
 * Layout, left to right: ruler labels | axis | the user's bar and "Bạn" label
 * | landmark labels. The "Bạn" label sits beside the bar and landmark labels
 * start further right, so the two never collide, even when the stack is
 * almost exactly as tall as a landmark.
 *
 * render(container, heightM, landmarks, nearId)
 */
(function (root) {
  'use strict';

  var Core = root.Core;
  var Stack = root.Stack;
  var NS = 'http://www.w3.org/2000/svg';

  var VB_W = 400;
  var VB_H = 580;
  var TOP = 18;
  var BOTTOM = 26;
  var AXIS_X = 70;
  var BAR_X = AXIS_X + 8;
  var BAR_W = 26;
  var USER_LABEL_X = AXIS_X + 38;
  var TICK_END = AXIS_X + 112;
  var LABEL_X = AXIS_X + 120;
  var RIGHT = VB_W - 6;
  var LOG_MIN = -4; // 0,1 mm: one banknote
  var LOG_MAX = 6; // 1.000 km
  var PLOT_H = VB_H - TOP - BOTTOM;
  var MIN_LABEL_GAP = 16;

  function el(name, attrs, text) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (text != null) node.textContent = text;
    return node;
  }

  function yFor(m) {
    var exp = Math.log10(Math.max(m, Math.pow(10, LOG_MIN)));
    exp = Math.min(Math.max(exp, LOG_MIN), LOG_MAX);
    return VB_H - BOTTOM - ((exp - LOG_MIN) / (LOG_MAX - LOG_MIN)) * PLOT_H;
  }

  // Ruler label: 0,1 mm · 1 cm · 1 m · 1 km (formatLength would say "1.000 m").
  function axisLabel(m) {
    if (m < 0.01) return Core.formatNumber(m * 1000, 2) + ' mm';
    if (m < 1) return Core.formatNumber(m * 100, 2) + ' cm';
    if (m < 1000) return Core.formatNumber(m, 2) + ' m';
    return Core.formatNumber(m / 1000, 2) + ' km';
  }

  function render(container, heightM, landmarks, nearId) {
    container.textContent = '';
    var base = VB_H - BOTTOM;
    var yUser = yFor(heightM);

    var svg = el('svg', {
      viewBox: '0 0 ' + VB_W + ' ' + VB_H,
      role: 'img',
      'aria-label':
        'Thang đo logarit từ 0,1 mm đến 1.000 km. Chồng tiền của bạn cao ' + Stack.formatLength(heightM) + '.'
    });

    /* ruler: one gridline per power of ten */
    for (var e = LOG_MIN; e <= LOG_MAX; e++) {
      var dy = yFor(Math.pow(10, e));
      svg.appendChild(el('line', { x1: AXIS_X, x2: RIGHT, y1: dy, y2: dy, class: 'sv-decade' }));
      svg.appendChild(el('text', { x: AXIS_X - 8, y: dy + 4, class: 'sv-axis-label' }, axisLabel(Math.pow(10, e))));
    }
    svg.appendChild(el('line', { x1: AXIS_X, x2: AXIS_X, y1: TOP, y2: base, class: 'sv-axis' }));

    /* the user's level and stack; the line stops short of the landmark column
       so it can never strike through a landmark label */
    svg.appendChild(el('line', { x1: AXIS_X, x2: LABEL_X - 8, y1: yUser, y2: yUser, class: 'sv-user-line' }));
    svg.appendChild(el('rect', {
      x: BAR_X,
      y: yUser,
      width: BAR_W,
      height: Math.max(2, base - yUser),
      rx: 2,
      class: 'sv-bar'
    }));

    /* landmarks: the tick sits at the true height, the label is nudged apart */
    var items = landmarks.map(function (l) { return { l: l, y: yFor(l.m), ly: 0 }; });
    items.sort(function (a, b) { return a.y - b.y; }); // top of the chart first
    items.forEach(function (item, i) {
      item.ly = item.y;
      if (i > 0 && item.ly - items[i - 1].ly < MIN_LABEL_GAP) item.ly = items[i - 1].ly + MIN_LABEL_GAP;
    });

    items.forEach(function (item) {
      var g = el('g', { class: 'sv-landmark' + (item.l.id === nearId ? ' is-near' : '') });
      g.appendChild(el('line', { x1: AXIS_X, x2: TICK_END, y1: item.y, y2: item.y, class: 'sv-landmark-line' }));
      if (item.ly !== item.y) {
        g.appendChild(el('line', { x1: TICK_END, x2: LABEL_X - 4, y1: item.y, y2: item.ly, class: 'sv-landmark-line' }));
      }
      var label = item.l.name + ' · ' + (item.l.approx ? '≈ ' : '') + Stack.formatLength(item.l.m);
      g.appendChild(el('text', { x: LABEL_X, y: item.ly + 4, class: 'sv-landmark-text' }, label));
      svg.appendChild(g);
    });

    /* marker and label for the user's stack, in the free column beside the bar */
    svg.appendChild(el('circle', { cx: AXIS_X, cy: yUser, r: 4, class: 'sv-user-dot' }));
    var labelY = yUser < TOP + 16 ? yUser + 18 : yUser - 6;
    svg.appendChild(el('text', { x: USER_LABEL_X, y: labelY, class: 'sv-user-text' }, Stack.formatLength(heightM)));

    container.appendChild(svg);
  }

  root.StackView = { render: render };
})(window);
