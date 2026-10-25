/*
 * "How tall is your money?" Pure logic for stacking 500.000 ₫ banknotes and
 * comparing the stack with real-world heights.
 *
 * Assumptions, easy to change below:
 *   - the note is the 500.000 ₫ polymer note, about 0,1 mm thick
 *   - the stack is perfectly flat and uncompressed
 *
 * `approx: true` marks round "about" figures; the others are published
 * heights. Check them before publishing.
 */
(function (root) {
  'use strict';

  var Core = typeof module !== 'undefined' && module.exports ? require('./core.js') : root.Core;

  var NOTE_VND = 500000;
  var NOTE_THICKNESS_M = 0.0001; // 0,1 mm

  // Ascending by height. `name` labels the chart; `phrase` reads naturally
  // mid-sentence ("bằng 67% chiều cao một người").
  var LANDMARKS = [
    { id: 'book', name: 'Một cuốn sách dày', phrase: 'một cuốn sách dày', m: 0.03, approx: true },
    { id: 'person', name: 'Chiều cao một người', phrase: 'chiều cao một người', m: 1.7, approx: true },
    { id: 'house', name: 'Ngôi nhà 3 tầng', phrase: 'ngôi nhà 3 tầng', m: 10, approx: true },
    { id: 'bitexco', name: 'Tòa Bitexco', phrase: 'tòa Bitexco', m: 262.5 },
    { id: 'landmark81', name: 'Landmark 81', phrase: 'Landmark 81', m: 461.3 },
    { id: 'burj', name: 'Burj Khalifa', phrase: 'Burj Khalifa', m: 828 },
    { id: 'fansipan', name: 'Đỉnh Fansipan', phrase: 'đỉnh Fansipan', m: 3143 },
    { id: 'everest', name: 'Đỉnh Everest', phrase: 'đỉnh Everest', m: 8849 },
    { id: 'karman', name: 'Ranh giới vũ trụ', phrase: 'ranh giới vũ trụ (đường Kármán)', m: 100000 },
    { id: 'iss', name: 'Trạm vũ trụ ISS', phrase: 'trạm vũ trụ ISS', m: 400000, approx: true }
  ];

  function noteCount(vnd) {
    return vnd / NOTE_VND;
  }

  function stackHeightMeters(vnd) {
    return noteCount(vnd) * NOTE_THICKNESS_M;
  }

  // 0.2 -> "20 cm", 461.3 -> "461,3 m", 208000 -> "208 km".
  function formatLength(m) {
    if (!(m > 0)) return '0 mm';
    if (m < 0.01) return Core.formatNumber(m * 1000, 3) + ' mm';
    if (m < 1) return Core.formatNumber(m * 100, 2) + ' cm';
    if (m < 10000) return Core.formatNumber(m, 2) + ' m';
    return Core.formatNumber(m / 1000, 2) + ' km';
  }

  // Pick the landmark closest in ratio (log distance) and describe the gap.
  // Returns { landmark, ratio, text } or null for an empty stack.
  function compare(heightM, landmarks) {
    if (!(heightM > 0) || !landmarks || !landmarks.length) return null;
    var best = landmarks[0];
    var bestDist = Infinity;
    for (var i = 0; i < landmarks.length; i++) {
      var d = Math.abs(Math.log(heightM / landmarks[i].m));
      if (d < bestDist) {
        bestDist = d;
        best = landmarks[i];
      }
    }
    var ratio = heightM / best.m;
    var what = best.phrase || best.name;
    var text;
    if (ratio >= 0.95 && ratio <= 1.05) {
      text = 'xấp xỉ ' + what;
    } else if (ratio > 1.05) {
      text = 'cao gấp ' + Core.formatNumber(ratio, ratio >= 10 ? 0 : 1) + ' lần ' + what;
    } else if (ratio < 0.01) {
      text = 'chưa tới 1% ' + what;
    } else {
      text = 'bằng ' + Core.formatNumber(ratio * 100, ratio < 0.1 ? 1 : 0) + '% ' + what;
    }
    return { landmark: best, ratio: ratio, text: text };
  }

  var api = {
    noteVnd: NOTE_VND,
    noteThicknessM: NOTE_THICKNESS_M,
    landmarks: LANDMARKS,
    noteCount: noteCount,
    stackHeightMeters: stackHeightMeters,
    formatLength: formatLength,
    compare: compare
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Stack = api;
})(typeof window !== 'undefined' ? window : this);
