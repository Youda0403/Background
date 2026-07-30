/* Single source of truth + share-link serialisation. */
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
    layout: 'aura',
    palette: 'starmilk',
    seed: 12,
    washStrength: 1,
    grain: 1,
    vignette: 0.1,
    decoDensity: 1,
    subtlety: 0.25,
    motifs: ['star', 'sparkle', 'puff'],
    glitter: false,
    paperStyle: 'none',
    cardStyle: 'round',
    swirl: true,
    border: false,
    doodleOutline: false,
    auraShape: 'heart',
    safeShift: true,
    showGuides: false,

    /* words */
    titleMode: 'pair',
    pairName: 'Sunrise Duo',
    nameA: 'Aki',
    nameB: 'Ren',
    sep: 'x',
    showNames: true,
    caption: 'two halves of the same daydream',
    footnote: 'since 2024',
    tags: 'love, always, ours',
    showTags: true,

    titleFont: 'serif-display',
    titleSize: 92,
    titleTrack: 12,
    titleCase: 'none',
    titleItalic: false,
    titleWeight: 400,
    bodyFont: 'mono',
    bodySize: 34,
    bodyTrack: 90,
    bodyCase: 'upper',
    captionRule: false,

    /* photo */
    photoShape: 'circle',
    photoRatio: 'square',
    tone: 'wash',
    toneAmount: 0.8,
    brightness: 0,
    contrast: 1,
    saturation: 1,
    blur: 0,
    feather: 0.3,
    opacity: 1,
    blend: 'normal',
    overprint: 0,
    halftoneCells: 52,
    zoom: 1,
    ox: 0.5,
    oy: 0.5,
    photoRotate: 0,
    photoRing: false,
    polaroid: false
  };

  /* Curated one-click looks — one per reference board. */
  var LOOKS = [
    { id: 'starmilk', label: 'Star Milk', st: { layout: 'aura', palette: 'starmilk', auraShape: 'puff', photoShape: 'circle', tone: 'wash', feather: 0.4, titleFont: 'serif-display', bodyFont: 'mono', motifs: ['puff', 'sparkle', 'star'], glitter: false, paperStyle: 'none', vignette: 0.06, subtlety: 0.3 } },
    { id: 'auraheart', label: 'Aura Heart', st: { layout: 'aura', palette: 'aurapink', auraShape: 'heart', photoShape: 'heart', tone: 'wash', feather: 0.45, titleFont: 'serif-fine', titleItalic: true, bodyFont: 'mono', motifs: ['puff', 'star', 'sparkle'], paperStyle: 'none', vignette: 0.08, subtlety: 0.2 } },
    { id: 'greenwash', label: 'Green Wash', st: { layout: 'aura', palette: 'greenwash', auraShape: 'blob', photoShape: 'blob', tone: 'wash', toneAmount: 0.9, feather: 0.55, titleFont: 'deco', bodyFont: 'mono', motifs: ['sparkle', 'six'], paperStyle: 'none', vignette: 0.05, subtlety: 0.5, decoDensity: 0.6 } },
    { id: 'midnight', label: 'Midnight Wish', st: { layout: 'aura', palette: 'midnight', auraShape: 'star', photoShape: 'circle', tone: 'duo', feather: 0.4, titleFont: 'deco', bodyFont: 'mono', motifs: ['star', 'sparkle', 'six'], glitter: true, paperStyle: 'none', vignette: 0.22, subtlety: 0.25 } },
    { id: 'sage', label: 'Sage Letter', st: { layout: 'paper', palette: 'sage', photoShape: 'rect', photoRatio: 'portrait34', tone: 'wash', toneAmount: 0.95, blur: 0.35, feather: 0.3, paperStyle: 'lines', cardStyle: 'square', swirl: false, titleFont: 'serif-fine', titleCase: 'lower', bodyFont: 'mono', motifs: ['sparkle'], decoDensity: 0.4, grain: 1.4, subtlety: 0.6 } },
    { id: 'fairytale', label: 'Fairy Tale', st: { layout: 'paper', palette: 'dotpaper', photoShape: 'rect', photoRatio: 'portrait45', tone: 'halftone', halftoneCells: 46, paperStyle: 'dots', cardStyle: 'round', swirl: true, titleFont: 'serif-display', bodyFont: 'grotesk', captionRule: true, motifs: ['star', 'sparkle'], photoRing: true, subtlety: 0.3 } },
    { id: 'jelly', label: 'Jelly Tide', st: { layout: 'paper', palette: 'jelly', photoShape: 'oval', tone: 'halftone', halftoneCells: 60, paperStyle: 'none', cardStyle: 'none', swirl: false, titleFont: 'grotesk', titleSize: 70, bodyFont: 'mono', motifs: ['star', 'circle', 'sparkle'], decoDensity: 0.7, subtlety: 0.55 } },
    { id: 'inkblush', label: 'Ink & Blush', st: { layout: 'paper', palette: 'mono', photoShape: 'card', tone: 'halftone', halftoneCells: 40, paperStyle: 'grid', cardStyle: 'ellipse', swirl: true, titleFont: 'serif-display', titleCase: 'upper', bodyFont: 'mono', motifs: ['star'], decoDensity: 0.9, grain: 1.2, subtlety: 0.35 } },
    { id: 'riso', label: 'Riso Blue', st: { layout: 'riso', palette: 'riso', photoShape: 'rect', photoRatio: 'portrait45', tone: 'duo', toneAmount: 0.95, overprint: 0.6, titleFont: 'deco', titleCase: 'upper', titleTrack: 60, bodyFont: 'mono', motifs: ['six', 'sparkle'], grain: 1.5, decoDensity: 0.6, subtlety: 0.3 } },
    { id: 'apple', label: 'Apple Silver', st: { layout: 'riso', palette: 'applesilver', photoShape: 'blob', photoRatio: 'square', tone: 'duo', toneAmount: 0.85, overprint: 0.3, titleFont: 'serif-display', bodyFont: 'mono', motifs: ['star', 'puff'], glitter: true, grain: 1.1, decoDensity: 1.1, subtlety: 0.15 } },
    { id: 'softsheet', label: 'Soft Sheet', st: { layout: 'sticker', palette: 'kawaii', photoShape: 'card', photoRatio: 'portrait45', tone: 'wash', toneAmount: 0.6, polaroid: true, photoRotate: -3, paperStyle: 'dots', titleFont: 'hand', titleSize: 100, bodyFont: 'mono', motifs: ['puff', 'heart', 'bow', 'flower', 'cloud', 'clover'], doodleOutline: true, subtlety: 0.2 } },
    { id: 'creamdoodle', label: 'Cream Doodle', st: { layout: 'sticker', palette: 'cream', photoShape: 'blob', tone: 'wash', toneAmount: 0.7, polaroid: false, paperStyle: 'lines', titleFont: 'serif-fine', titleItalic: true, bodyFont: 'mono', motifs: ['sparkle', 'bow', 'key', 'lock', 'cloud', 'star'], border: true, subtlety: 0.3 } }
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
    { id: 'star', label: '별' },
    { id: 'puff', label: '통통별' },
    { id: 'six', label: '육각별' },
    { id: 'sparkle', label: '반짝이' },
    { id: 'heart', label: '하트' },
    { id: 'circle', label: '점' },
    { id: 'flower', label: '꽃' },
    { id: 'clover', label: '클로버' },
    { id: 'cloud', label: '구름' },
    { id: 'moon', label: '달' },
    { id: 'bow', label: '리본' },
    { id: 'key', label: '열쇠' },
    { id: 'lock', label: '하트 자물쇠' },
    { id: 'blob', label: '블롭' }
  ];

  function create() {
    var st = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      st[k] = Array.isArray(DEFAULTS[k]) ? DEFAULTS[k].slice() : DEFAULTS[k];
    });
    return st;
  }

  function applyLook(st, lookId) {
    var look = LOOKS.filter(function (l) { return l.id === lookId; })[0];
    if (!look) return st;
    /* start from defaults so looks are reproducible, then keep the
       user's own words, photo framing and canvas choice */
    var keep = ['presetId', 'orientation', 'customW', 'customH', 'titleMode',
      'pairName', 'nameA', 'nameB', 'sep', 'showNames', 'caption', 'footnote',
      'tags', 'showTags', 'zoom', 'ox', 'oy', 'brightness', 'contrast',
      'saturation', 'safeShift', 'showGuides', 'seed'];
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

  /* Applying a layout only overrides the knobs that layout owns. */
  function applyLayoutDefaults(st, layoutId) {
    var L = (W.layouts || {})[layoutId];
    if (!L || !L.defaults) return;
    Object.keys(L.defaults).forEach(function (k) {
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
      return st;
    } catch (e) {
      return null;
    }
  }

  function randomize(st) {
    var r = U.rng(Date.now() ^ (Math.random() * 1e9));
    var look = U.pick(r, LOOKS);
    var next = applyLook(st, look.id);
    next.seed = Math.floor(r() * 9999);
    next.subtlety = Math.round(U.range(r, 0.1, 0.6) * 100) / 100;
    next.sep = U.pick(r, W.textstack.separators).id;
    return next;
  }

  W.state = {
    defaults: DEFAULTS, looks: LOOKS, tones: TONES, blends: BLENDS,
    motifKinds: MOTIF_KINDS, create: create, applyLook: applyLook,
    applyLayoutDefaults: applyLayoutDefaults, serialize: serialize,
    deserialize: deserialize, randomize: randomize
  };
})(window.PT = window.PT || {});
