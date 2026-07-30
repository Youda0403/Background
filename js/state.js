/* Single source of truth + share-link serialisation.

   Two decisions make a design: a LAYOUT (where things sit, and which
   fonts suit it) and a PALETTE (colour). Everything else is an optional
   nudge. There is deliberately no third "look" concept. */
(function (W) {
  'use strict';
  var U = W.util;

  var DEFAULTS = {
    /* canvas */
    presetId: 'ip-15',
    orientation: 'portrait',
    customW: 1179,
    customH: 2556,

    /* the two real choices */
    layout: 'editorial',
    palette: 'sage',

    /* scene */
    seed: 12,
    washStrength: 1,
    grain: 1,
    vignette: 0.06,
    decoCount: 6,
    subtlety: 0.3,
    motifs: ['burst', 'sparkle'],
    glitter: false,
    auraShape: 'heart',
    safeShift: true,
    showGuides: false,

    /* layout trim */
    headlineStyle: 'scriptSans',
    headlineScale: 1,
    microScale: 1,
    bleed: false,
    burst: true,
    scrim: 0.4,
    strike: true,
    sideLabel: false,

    /* words */
    titleMode: 'pair',
    pairName: 'Spirit\nof Nature',
    nameA: 'Aki',
    nameB: 'Ren',
    sep: 'x',
    showNames: true,
    caption: 'in the silence beneath the water’s surface, every ripple tells a story of balance',
    footnote: 'since 2024',
    tags: 'love, always, ours',
    showTags: true,

    titleFont: 'cormorant',
    scriptFont: 'italianno',
    bodyFont: 'dmmono',

    /* photo */
    photoShape: 'rect',
    tone: 'wash',
    toneAmount: 0.7,
    brightness: 0,
    contrast: 1,
    saturation: 1,
    blur: 0,
    feather: 0,
    opacity: 1,
    blend: 'normal',
    overprint: 0,
    halftoneCells: 52,
    zoom: 1,
    ox: 0.5,
    oy: 0.5,
    photoRotate: 0
  };

  var HEADLINE_STYLES = [
    { id: 'scriptSans', label: '필기체 + 굵은 고딕' },
    { id: 'capsScript', label: '작은 대문자 + 큰 필기체' },
    { id: 'didone', label: '전부 대문자 세리프' },
    { id: 'stack', label: '같은 폰트로 두 줄' }
  ];

  var TONES = [
    { id: 'natural', label: '원본' },
    { id: 'wash', label: '빛바램' },
    { id: 'duo', label: '듀오톤' },
    { id: 'mono', label: '흑백' },
    { id: 'halftone', label: '망점' }
  ];

  var BLENDS = [
    { id: 'normal', label: '기본' },
    { id: 'multiply', label: '곱하기' },
    { id: 'screen', label: '스크린' },
    { id: 'overlay', label: '오버레이' },
    { id: 'soft-light', label: '소프트 라이트' },
    { id: 'luminosity', label: '명도만' }
  ];

  var MOTIF_KINDS = [
    { id: 'burst', label: '가시별 8갈' },
    { id: 'burst4', label: '가시별 4갈' },
    { id: 'sparkle', label: '반짝이' },
    { id: 'flash', label: '삐죽별' },
    { id: 'star', label: '별' },
    { id: 'puff', label: '통통별' },
    { id: 'six', label: '육각별' },
    { id: 'heart', label: '하트' },
    { id: 'circle', label: '점' },
    { id: 'flower', label: '꽃' },
    { id: 'clover', label: '클로버' },
    { id: 'cloud', label: '구름' },
    { id: 'moon', label: '달' },
    { id: 'bow', label: '리본' },
    { id: 'key', label: '열쇠' },
    { id: 'lock', label: '하트 자물쇠' }
  ];

  /* Ids that changed between releases, so old share links still open. */
  var LAYOUT_ALIASES = { paper: 'editorial', riso: 'zine', sticker: 'lyric' };

  function create() {
    var st = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      st[k] = Array.isArray(DEFAULTS[k]) ? DEFAULTS[k].slice() : DEFAULTS[k];
    });
    return st;
  }

  /* A palette is colour, nothing else — swapping one must never move the
     typography out from under the user. */
  function applyPalette(st, paletteId) {
    if (W.palettes.byId[paletteId]) st.palette = paletteId;
    return st;
  }

  function applyLayoutDefaults(st, layoutId) {
    var L = (W.layouts || {})[layoutId];
    if (!L || !L.defaults) return;
    Object.keys(L.defaults).forEach(function (k) {
      if (!(k in DEFAULTS)) return;
      st[k] = Array.isArray(L.defaults[k]) ? L.defaults[k].slice() : L.defaults[k];
    });
    st.layout = layoutId;
  }

  function migrate(st) {
    if (LAYOUT_ALIASES[st.layout]) st.layout = LAYOUT_ALIASES[st.layout];
    ['titleFont', 'bodyFont', 'scriptFont'].forEach(function (k) {
      if (st[k] && W.type.aliases[st[k]]) st[k] = W.type.aliases[st[k]];
      if (!W.type.byId[st[k]]) st[k] = DEFAULTS[k];
    });
    if (!W.palettes.byId[st.palette]) st.palette = DEFAULTS.palette;
    st.motifs = (st.motifs || []).filter(function (m) { return !!W.prim.motifs[m]; });
    if (!st.motifs.length) st.motifs = DEFAULTS.motifs.slice();
    return st;
  }

  /* ---------- share links ---------- */

  function b64url(s) {
    return btoa(unescape(encodeURIComponent(s)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64url(s) {
    var t = s.replace(/-/g, '+').replace(/_/g, '/');
    while (t.length % 4) t += '=';
    return decodeURIComponent(escape(atob(t)));
  }

  function serialize(st) {
    var diff = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      var a = st[k], b = DEFAULTS[k];
      var same = Array.isArray(b) ? JSON.stringify(a) === JSON.stringify(b) : a === b;
      if (!same) diff[k] = a;
    });
    return b64url(JSON.stringify(diff));
  }

  function deserialize(hash) {
    try {
      var diff = JSON.parse(unb64url(hash));
      var st = create();
      Object.keys(diff).forEach(function (k) {
        if (k in DEFAULTS) st[k] = diff[k];
      });
      if (diff.layout && LAYOUT_ALIASES[diff.layout]) st.layout = LAYOUT_ALIASES[diff.layout];
      return migrate(st);
    } catch (e) {
      return null;
    }
  }

  function randomize(st) {
    var r = U.rng(Date.now() ^ (Math.random() * 1e9));
    var layouts = Object.keys(W.layouts || { editorial: 1 });
    var next = create();
    /* keep what the user wrote and how they framed their photo */
    ['presetId', 'orientation', 'customW', 'customH', 'titleMode', 'pairName',
      'nameA', 'nameB', 'sep', 'showNames', 'caption', 'footnote', 'tags',
      'showTags', 'zoom', 'ox', 'oy', 'brightness', 'contrast', 'saturation',
      'safeShift', 'showGuides'].forEach(function (k) { next[k] = st[k]; });
    applyLayoutDefaults(next, U.pick(r, layouts));
    applyPalette(next, U.pick(r, W.palettes.list).id);
    next.seed = Math.floor(r() * 9999);
    next.sep = U.pick(r, W.textstack.separators).id;
    return next;
  }

  W.state = {
    defaults: DEFAULTS, tones: TONES, blends: BLENDS,
    motifKinds: MOTIF_KINDS, headlineStyles: HEADLINE_STYLES,
    create: create, migrate: migrate, applyPalette: applyPalette,
    applyLayoutDefaults: applyLayoutDefaults, serialize: serialize,
    deserialize: deserialize, randomize: randomize
  };
})(window.PT = window.PT || {});
