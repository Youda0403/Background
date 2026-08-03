/* Palettes lifted from the reference boards. Colour only — the fonts
   belong to the layout and to the user, not to the palette.

   base   : page colour
   inks   : decorative colours (stars, panels, motifs)
   duo    : [shadow, highlight] used to tone photos into the page
   text   : foreground for typography
   soft   : aura / wash colours
   accent : the loud one — the single chromatic colour every layout is
            obliged to put somewhere you can see. Without it a palette
            whose swatch shows red and yellow rendered as a page of blue,
            because a duotone photo is monochrome by definition and the
            type all came from `text`. The card promised a colour the
            wallpaper never delivered.
   grain  : how much paper texture this stock naturally carries
*/
(function (W) {
  'use strict';

  var PALETTES = [
    {
      id: 'starmilk',
      label: 'Star Milk',
      base: '#fdfefb',
      soft: ['#bfe6c4', '#a8d8ef', '#ffe89a'],
      inks: ['#8fd3a6', '#7fc4e8', '#f7d774', '#c9e7b0'],
      duo: ['#3f6b56', '#f4fbf2'],
      text: '#5d6a5f',
      accent: '#c9922f',
      grain: 0.05
    },
    {
      id: 'greenwash',
      label: 'Green Wash',
      base: '#f7fdf8',
      soft: ['#b6ddb9', '#f2d3da', '#eaf7ee'],
      inks: ['#8cc79a', '#6fae85', '#cfe6cd', '#a3d0ae'],
      duo: ['#2f5a41', '#f2fbf3'],
      text: '#4c6b56',
      accent: '#c4566a',
      grain: 0.04
    },
    {
      id: 'sage',
      label: 'Sage Letter',
      base: '#eeeade',
      soft: ['#c3cdb0', '#dcd9c6', '#b9c4a6'],
      inks: ['#a9b795', '#8d9c7b', '#d6d2bd', '#f4f1e6'],
      duo: ['#5d6a4d', '#f1efe3'],
      text: '#6b6f5c',
      accent: '#b06a4a',
      grain: 0.12
    },
    {
      id: 'aurapink',
      label: 'Aura Heart',
      base: '#fdf6f8',
      soft: ['#f9c3d2', '#c4e4f2', '#fbe0e8'],
      inks: ['#f4a8bf', '#c9b6e8', '#ffe9a8', '#bfe4ef'],
      duo: ['#8a5a72', '#fdf2f6'],
      text: '#8d6577',
      accent: '#4f9fc4',
      grain: 0.05
    },
    {
      id: 'dotpaper',
      label: 'Dot Diary',
      base: '#fbfbfa',
      soft: ['#f6e4e2', '#e7eef5', '#f2f2ef'],
      inks: ['#2b2b2b', '#9fbcd6', '#f2ddda', '#c9c9c4'],
      duo: ['#1f2933', '#f8f8f6'],
      text: '#2b2b2b',
      accent: '#d1573f',
      grain: 0.06
    },
    {
      id: 'riso',
      label: 'Riso Blue',
      base: '#f3efe2',
      soft: ['#2f6d92', '#8d9464', '#dcd6c2'],
      inks: ['#1f5f86', '#8b9360', '#e8e2d0', '#123f5c'],
      duo: ['#12496c', '#f5f1e4'],
      text: '#1b3d52',
      accent: '#c9503a',
      grain: 0.14
    },
    {
      id: 'applesilver',
      label: 'Apple Silver',
      base: '#123a86',
      soft: ['#2b56a8', '#0d2c6b', '#3f6bc0'],
      inks: ['#d9dde6', '#e8443f', '#f4d24e', '#8fb8e8'],
      duo: ['#0b2559', '#dfe6f2'],
      text: '#eef2fa',
      accent: '#e8443f',
      grain: 0.08
    },
    {
      id: 'jelly',
      label: 'Jelly Tide',
      base: '#fbfcfe',
      soft: ['#cfe2f5', '#fbdcc8', '#f2f6fd'],
      inks: ['#3f7fbf', '#8fc6e8', '#f4c6d8', '#ffe8a8'],
      duo: ['#255d92', '#f7fbff'],
      text: '#6a7684',
      accent: '#e0764f',
      grain: 0.03
    },
    {
      id: 'cream',
      label: 'Cream Doodle',
      base: '#fbfbe6',
      soft: ['#dfeefb', '#fbdcc4', '#eef7dd'],
      inks: ['#5b86d6', '#f2a8c4', '#9fd4c0', '#2f4f9c'],
      duo: ['#3b5aa0', '#fbfbe8'],
      text: '#5a6285',
      accent: '#cf6a3f',
      grain: 0.07
    },
    {
      id: 'kawaii',
      label: 'Soft Sheet',
      base: '#fdfcfa',
      soft: ['#d8f0ea', '#fdeee2', '#fdf6e2'],
      inks: ['#f6c9a8', '#a8d3ea', '#f2b8c6', '#e8dfa8'],
      duo: ['#8a6a58', '#fdf8f2'],
      text: '#8a7566',
      accent: '#35a394',
      grain: 0.05
    },
    {
      id: 'mono',
      label: 'Ink & Blush',
      base: '#f7f6f4',
      soft: ['#f3e6e4', '#e8e8e6', '#fbfbfa'],
      inks: ['#161616', '#8c8c8c', '#f0dcd8', '#d8d8d4'],
      duo: ['#111111', '#f6f4f2'],
      text: '#161616',
      accent: '#b8564a',
      grain: 0.09
    },
    {
      id: 'midnight',
      label: 'Midnight Wish',
      base: '#171a2e',
      soft: ['#2c3358', '#3d3563', '#1d2140'],
      inks: ['#cfd6f2', '#8f9be0', '#f2d9a8', '#b9a8e0'],
      duo: ['#0d1024', '#c9d2f2'],
      text: '#e4e8fa',
      accent: '#f2d9a8',
      grain: 0.1
    }
    ,
    {
      id: 'shampoo',
      label: 'Shampoo Blue',
      base: '#dcecf8',
      soft: ['#a8d0ee', '#f7d9d2', '#cfe4f6'],
      inks: ['#2b4f7a', '#7fb2dd', '#ffffff', '#b9cfe4'],
      duo: ['#1d3c60', '#eaf4fc'],
      text: '#1f3d5e',
      accent: '#d9645c',
      grain: 0.05
    },
    {
      id: 'crimson',
      label: 'Crimson Letter',
      base: '#f6efe4',
      soft: ['#e8c9bd', '#cfe4d8', '#d9b7a8'],
      inks: ['#a32a2a', '#7d1f24', '#e3b9a6', '#2e2422'],
      duo: ['#6b1c1c', '#f7f0e6'],
      text: '#5c2320',
      accent: '#2e8f74',
      grain: 0.13
    },
    {
      id: 'terracotta',
      label: 'Terracotta',
      base: '#f3e6d8',
      soft: ['#dcae8c', '#bcdcd8', '#c98f6b'],
      inks: ['#b4643c', '#8a4a2e', '#e0bb9b', '#4a3326'],
      duo: ['#7a4429', '#f6ebdd'],
      text: '#6b4130',
      accent: '#2f8f88',
      grain: 0.12
    },
    {
      id: 'lavender',
      label: 'Lavender Haze',
      base: '#f6f2fb',
      soft: ['#d7c8ee', '#f6e2c4', '#c3b2e2'],
      inks: ['#8f7ac0', '#6d5aa0', '#e0d2f2', '#f4c9de'],
      duo: ['#5b4a86', '#f7f3fc'],
      text: '#6a5a92',
      accent: '#c9873f',
      grain: 0.05
    },
    {
      id: 'matcha',
      label: 'Matcha',
      base: '#eef1e2',
      soft: ['#b6c98e', '#d4dfb8', '#9bb26e'],
      inks: ['#5c7038', '#3f4f26', '#c3d3a0', '#e6ead6'],
      duo: ['#3a4a22', '#f0f3e5'],
      text: '#455230',
      accent: '#b5623a',
      grain: 0.11
    },
    {
      id: 'peach',
      label: 'Peach Fizz',
      base: '#fff2ec',
      soft: ['#ffd0bc', '#bfe2dc', '#ffc0b0'],
      inks: ['#f28f6e', '#e2694f', '#ffd9c4', '#8fc7c2'],
      duo: ['#a8543a', '#fff4ef'],
      text: '#a05a44',
      accent: '#2f8f80',
      grain: 0.05
    },
    {
      id: 'butter',
      label: 'Butter Note',
      base: '#fbf4dc',
      soft: ['#f5e0a0', '#c4e2ee', '#e8cf86'],
      inks: ['#c9a23c', '#8f6f22', '#f2e2b0', '#6f7a4a'],
      duo: ['#7a5f1e', '#fdf7e4'],
      text: '#6f5a24',
      accent: '#3d8fa8',
      grain: 0.09
    },
    {
      id: 'inkwell',
      label: 'Inkwell',
      base: '#eceae4',
      soft: ['#c8c6bd', '#dcd9d0', '#b3b0a6'],
      inks: ['#26303a', '#4a5560', '#c9cdd2', '#8a6f52'],
      duo: ['#1d252e', '#f0eee8'],
      text: '#26303a',
      accent: '#8a6f52',
      grain: 0.1
    },
    {
      id: 'charcoal',
      label: 'Charcoal',
      base: '#1c1c1a',
      soft: ['#33332f', '#262624', '#3d3d38'],
      inks: ['#e6e2d6', '#a8a396', '#c9b98a', '#8f8f86'],
      duo: ['#0e0e0d', '#e8e4d8'],
      text: '#ebe7db',
      accent: '#c9b98a',
      grain: 0.13
    }
  ];

  /* ---------- harmonising the accent ----------

     A hand-picked "loud colour" looks pasted on. Hot magenta at full
     chroma over Jelly Tide's pale blues was not a palette, it was two
     palettes fighting. Real palettes agree about how saturated they are
     and what light they are lit by, so the accent is tuned to the rest of
     the swatch rather than trusted as typed:

       1. its chroma is capped near the palette's own ceiling,
       2. it takes a veil of the page colour — the "overlay" that gives a
          set of colours a common cast,
       3. then its lightness is pushed until it clears 3:1 against the
          page, because none of that is worth anything if you cannot read
          the word it is setting.
  */
  var U = W.util;

  /* True chroma, not HSL saturation: a pastel like #f4c6d8 is 0.68
     "saturated" and 0.18 chromatic, and it is the second number that says
     how loud a colour looks on a page. */
  function chroma(hex) {
    var c = U.hsl(hex);
    return c[1] * (1 - Math.abs(2 * c[2] - 1));
  }

  function withChroma(hex, target) {
    var c = U.hsl(hex);
    var span = 1 - Math.abs(2 * c[2] - 1);
    return U.fromHsl(c[0], span > 0.001 ? U.clamp(target / span, 0, 1) : 0, c[2]);
  }

  function chromaCeiling(p) {
    var hi = 0;
    p.inks.concat(p.soft).forEach(function (c) {
      var k = chroma(c);
      if (k > hi) hi = k;
    });
    /* half again as loud as the palette's loudest ink, but never mud and
       never neon: a quiet palette still gets a colour you can name */
    return U.clamp(hi * 1.6, 0.3, 0.62);
  }

  function harmonise(seed, p) {
    var col = withChroma(seed, Math.min(chroma(seed), chromaCeiling(p)));
    col = U.mixHex(col, p.base, 0.14);

    /* walk the lightness away from the page until the accent reads */
    var dark = U.luma(p.base) > 0.5;
    for (var i = 0; i < 24 && U.contrast(col, p.base) < 3; i++) {
      var c = U.hsl(col);
      col = U.fromHsl(c[0], c[1], U.clamp(c[2] + (dark ? -0.03 : 0.03), 0.06, 0.94));
    }
    return col;
  }

  PALETTES.forEach(function (p) {
    p.accentSeed = p.accent;
    p.accent = harmonise(p.accent, p);
  });

  var BY_ID = {};
  PALETTES.forEach(function (p) { BY_ID[p.id] = p; });

  W.palettes = { list: PALETTES, byId: BY_ID };
})(window.PT = window.PT || {});
