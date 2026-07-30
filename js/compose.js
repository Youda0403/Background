/* Canvas classification and photo proportions. Layouts branch on the
   aspect-ratio tier, which is what lets one design reflow from a Watch
   face to a Fold. */
(function (W) {
  'use strict';

  var RATIOS = [
    { id: 'free', label: '자동 (레이아웃에 맡김)', v: null },
    { id: 'tall', label: '세로 9 : 16', v: 0.5625 },
    { id: 'portrait23', label: '세로 2 : 3', v: 0.667 },
    { id: 'portrait34', label: '세로 3 : 4', v: 0.75 },
    { id: 'portrait45', label: '세로 4 : 5', v: 0.8 },
    { id: 'square', label: '정사각 1 : 1', v: 1 },
    { id: 'land54', label: '가로 5 : 4', v: 1.25 },
    { id: 'land43', label: '가로 4 : 3', v: 1.333 },
    { id: 'land32', label: '가로 3 : 2', v: 1.5 },
    { id: 'land1610', label: '가로 16 : 10', v: 1.6 },
    { id: 'wide169', label: '가로 16 : 9', v: 1.778 },
    { id: 'wide21', label: '가로 2 : 1', v: 2 },
    { id: 'cinema', label: '시네마 21 : 9', v: 2.333 }
  ];

  var RATIO_BY_ID = {};
  RATIOS.forEach(function (r) { if (r.v) RATIO_BY_ID[r.id] = r.v; });

  function tierOf(ar) {
    if (ar >= 1.95) return 'tall';
    if (ar >= 1.6) return 'phone';
    if (ar >= 1.15) return 'tablet';
    if (ar >= 0.92) return 'square';
    return 'wide';
  }

  W.compose = { ratios: RATIOS, ratioById: RATIO_BY_ID, tierOf: tierOf };
})(window.PT = window.PT || {});
