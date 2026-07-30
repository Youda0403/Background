/* Single source of truth + share-link serialisation.
   Deliberately fewer knobs than the first release: the layouts now own
   their own composition, so the settings that remain are the ones that
   change the result without being able to break it. */
(function (W) {
  'use strict';
  var U = W.util;

  var DEFAULTS = {
    /* canvas */
    presetId: 'ip-15',
    orientation: 'portrait',
    customW: 1179,
    customH: 2556,

    /* scene */
    layout: 'editorial',
    palette: 'sage',
    seed: 12,
    washStrength: 1,
    grain: 1,
    vignette: 0.06,
    decoDensity: 1,
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
    pairName: 'Spirit of Nature',
    nameA: 'Aki',
    nameB: 'Ren',
    sep: 'x',
    showNames: true,
    caption: 'in the silence beneath the water’s surface, every ripple tells a story of balance',
    footnote: 'since 2024',
    tags: 'love, always, ours',
    showTags: true,

    titleFont: 'didone',
    scriptFont: 'pinyon',
    bodyFont: 'archivo',
    titleCase: 'none',

    /* photo */
    photoShape: 'rect',
    photoRatio: 'free',
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

  /* Curated looks. Each one is a finished design; the sliders only nudge. */
  var LOOKS = [
    { id: 'spirit', label: 'Spirit', st: { layout: 'editorial', palette: 'greenwash', titleFont: 'archivo', scriptFont: 'pinyon', bodyFont: 'archivo', headlineStyle: 'scriptSans', tone: 'wash', toneAmount: 0.72, photoRatio: 'free', motifs: ['sparkle'], decoDensity: 0.5, grain: 1.3, vignette: 0.04, subtlety: 0.3 } },
    { id: 'sageletter', label: 'Sage Letter', st: { layout: 'editorial', palette: 'sage', titleFont: 'cormorant', scriptFont: 'italianno', bodyFont: 'dmmono', headlineStyle: 'scriptSans', tone: 'wash', toneAmount: 0.92, blur: 0.2, photoRatio: 'portrait45', motifs: ['sparkle'], decoDensity: 0.4, grain: 1.5, sideLabel: true, subtlety: 0.45 } },
    { id: 'anthurium', label: 'Anthurium', st: { layout: 'editorial', palette: 'sage', titleFont: 'archivo', bodyFont: 'archivo', headlineStyle: 'stack', titleCase: 'lower', tone: 'duo', toneAmount: 1, photoRatio: 'portrait34', motifs: ['burst'], decoDensity: 0.6, grain: 0.8, subtlety: 0.2 } },
    { id: 'overfeel', label: 'Overfeel', st: { layout: 'editorial', palette: 'riso', titleFont: 'spacemono', bodyFont: 'spacemono', headlineStyle: 'stack', titleCase: 'lower', tone: 'duo', toneAmount: 1, photoRatio: 'free', motifs: ['sparkle'], decoDensity: 0.3, grain: 1.6, subtlety: 0.5 } },

    { id: 'summerchild', label: 'Summer Child', st: { layout: 'lyric', palette: 'kawaii', titleFont: 'playfair', scriptFont: 'pinyon', bodyFont: 'archivo', headlineStyle: 'capsScript', tone: 'wash', toneAmount: 0.5, blur: 0.12, burst: true, scrim: 0.34, motifs: ['burst', 'sparkle'], grain: 1.4, subtlety: 0.2 } },
    { id: 'benew', label: 'Be New', st: { layout: 'lyric', palette: 'jelly', titleFont: 'didone', scriptFont: 'italianno', bodyFont: 'archivo', headlineStyle: 'capsScript', tone: 'wash', toneAmount: 0.6, bleed: true, burst: false, scrim: 0.22, motifs: ['sparkle', 'burst4'], grain: 0.7, subtlety: 0.25 } },
    { id: 'fireworks', label: 'Fireworks', st: { layout: 'lyric', palette: 'midnight', titleFont: 'didone', scriptFont: 'pinyon', bodyFont: 'archivo', headlineStyle: 'capsScript', tone: 'duo', toneAmount: 0.95, bleed: true, burst: true, scrim: 0.5, glitter: true, motifs: ['burst', 'flash'], grain: 1.2, vignette: 0.24, subtlety: 0.2 } },
    { id: 'hidingspot', label: 'Hiding Spot', st: { layout: 'lyric', palette: 'mono', titleFont: 'syne', scriptFont: 'pinyon', bodyFont: 'dmmono', headlineStyle: 'capsScript', tone: 'duo', toneAmount: 1, bleed: false, burst: false, scrim: 0.18, motifs: ['sparkle', 'burst4'], grain: 1.1, subtlety: 0.4 } },

    { id: 'crossword', label: 'Crossword', st: { layout: 'grid', palette: 'aurapink', titleFont: 'archivo', bodyFont: 'archivo', tone: 'mono', decoDensity: 0, grain: 1.3, subtlety: 0.3 } },
    { id: 'chrome', label: 'Chrome', st: { layout: 'grid', palette: 'mono', titleFont: 'anton', bodyFont: 'archivo', tone: 'halftone', halftoneCells: 44, decoDensity: 0, grain: 1, subtlety: 0.35 } },

    { id: 'hatachi', label: 'Hatachi', st: { layout: 'zine', palette: 'mono', titleFont: 'playfair', scriptFont: 'italianno', bodyFont: 'dmmono', headlineStyle: 'scriptSans', tone: 'halftone', halftoneCells: 56, strike: true, motifs: ['burst', 'burst4'], grain: 1.9, subtlety: 0.25 } },
    { id: 'risoblue', label: 'Riso Blue', st: { layout: 'zine', palette: 'riso', titleFont: 'bricolage', scriptFont: 'pinyon', bodyFont: 'dmmono', headlineStyle: 'scriptSans', tone: 'duo', toneAmount: 0.95, strike: false, motifs: ['burst4', 'sparkle'], grain: 1.7, subtlety: 0.3 } },
    { id: 'applesilver', label: 'Apple Silver', st: { layout: 'zine', palette: 'applesilver', titleFont: 'instrument', scriptFont: 'pinyon', bodyFont: 'dmmono', headlineStyle: 'scriptSans', tone: 'duo', toneAmount: 0.85, strike: false, glitter: true, motifs: ['star', 'burst'], grain: 1.1, subtlety: 0.15 } },

    { id: 'starmilk', label: 'Star Milk', st: { layout: 'aura', palette: 'starmilk', titleFont: 'instrument', scriptFont: 'pinyon', bodyFont: 'dmmono', headlineStyle: 'stack', auraShape: 'puff', photoShape: 'circle', photoRatio: 'square', tone: 'wash', feather: 0.4, motifs: ['puff', 'sparkle'], vignette: 0.05, subtlety: 0.3 } },
    { id: 'auraheart', label: 'Aura Heart', st: { layout: 'aura', palette: 'aurapink', titleFont: 'cormorant', scriptFont: 'italianno', bodyFont: 'dmmono', headlineStyle: 'scriptSans', auraShape: 'heart', photoShape: 'heart', photoRatio: 'square', tone: 'wash', feather: 0.45, motifs: ['puff', 'sparkle'], vignette: 0.07, subtlety: 0.2 } },
    { id: 'softsheet', label: 'Soft Sheet', st: { layout: 'aura', palette: 'kawaii', titleFont: 'bagel', scriptFont: 'pinyon', bodyFont: 'dmmono', headlineStyle: 'stack', auraShape: 'blob', photoShape: 'card', photoRatio: 'portrait45', tone: 'wash', toneAmount: 0.55, feather: 0.1, motifs: ['puff', 'heart', 'flower', 'bow', 'cloud'], vignette: 0.04, subtlety: 0.15 } }
  ];

  var HEADLINE_STYLES = [
    { id: 'scriptSans', label: '필기체 + 굵은 산세리프' },
    { id: 'capsScript', label: '작은 대문자 + 큰 필기체' },
    { id: 'didone', label: '전부 대문자 세리프' },
    { id: 'stack', label: '같은 폰트 2줄' }
  ];

  var TONES = [
    { id: 'natural', label: '원본' },
    { id: 'wash', label: '워시' },
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

  function migrate(st) {
    if (LAYOUT_ALIASES[st.layout]) st.layout = LAYOUT_ALIASES[st.layout];
    ['titleFont', 'bodyFont', 'scriptFont'].forEach(function (k) {
      if (st[k] && W.type.aliases[st[k]]) st[k] = W.type.aliases[st[k]];
    });
    if (!W.compose.ratioById[st.photoRatio] && st.photoRatio !== 'free') st.photoRatio = 'free';
    st.motifs = (st.motifs || []).filter(function (m) { return !!W.prim.motifs[m]; });
    if (!st.motifs.length) st.motifs = DEFAULTS.motifs.slice();
    return st;
  }

  function applyLook(st, lookId) {
    var look = LOOKS.filter(function (l) { return l.id === lookId; })[0];
    if (!look) return st;
    /* Looks reset the design but never touch what the user wrote, how the
       photo is cropped, or which device they are making this for. */
    var keep = ['presetId', 'orientation', 'customW', 'customH', 'titleMode',
      'pairName', 'nameA', 'nameB', 'sep', 'showNames', 'caption', 'footnote',
      'tags', 'showTags', 'zoom', 'ox', 'oy', 'brightness', 'contrast',
      'saturation', 'safeShift', 'showGuides', 'seed', 'headlineScale', 'microScale'];
    var kept = {};
    keep.forEach(function (k) { kept[k] = st[k]; });
    var next = create();
    Object.keys(look.st).forEach(function (k) {
      next[k] = Array.isArray(look.st[k]) ? look.st[k].slice() : look.st[k];
    });
    keep.forEach(function (k) { next[k] = kept[k]; });
    next.look = lookId;
    return next;
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
      /* old links may carry ids this release renamed */
      if (diff.layout && LAYOUT_ALIASES[diff.layout]) st.layout = LAYOUT_ALIASES[diff.layout];
      return migrate(st);
    } catch (e) {
      return null;
    }
  }

  function randomize(st) {
    var r = U.rng(Date.now() ^ (Math.random() * 1e9));
    var look = U.pick(r, LOOKS);
    var next = applyLook(st, look.id);
    next.seed = Math.floor(r() * 9999);
    next.sep = U.pick(r, W.textstack.separators).id;
    return next;
  }

  W.state = {
    defaults: DEFAULTS, looks: LOOKS, tones: TONES, blends: BLENDS,
    motifKinds: MOTIF_KINDS, headlineStyles: HEADLINE_STYLES,
    create: create, migrate: migrate, applyLook: applyLook,
    applyLayoutDefaults: applyLayoutDefaults, serialize: serialize,
    deserialize: deserialize, randomize: randomize
  };
})(window.PT = window.PT || {});
