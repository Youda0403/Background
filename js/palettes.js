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
      label: 'Sandstone',
      base: '#e6d6b8',
      soft: ['#cbb489', '#a8dcd6', '#d9c6a0'],
      inks: ['#4a3a26', '#2f9c94', '#e8dcc2', '#7a6244'],
      duo: ['#3f3020', '#f2e8d4'],
      text: '#4a3a26',
      accent: '#2f9c94',
      grain: 0.12
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
      label: 'Tide Pool',
      base: '#dfeeea',
      soft: ['#8fc4bc', '#ffd2bc', '#b6dcd4'],
      inks: ['#2f7a72', '#1d5a54', '#ffc4a8', '#a8d6cd'],
      duo: ['#17544e', '#eaf6f2'],
      text: '#1f5f58',
      accent: '#e0764f',
      grain: 0.07
    },
    {
      id: 'cream',
      label: 'Olive Note',
      base: '#e8e4cd',
      soft: ['#c2bd93', '#d9c2d2', '#b0aa7c'],
      inks: ['#6b6a3c', '#4d4c28', '#cfc9a2', '#8f6f92'],
      duo: ['#45441f', '#efecd9'],
      text: '#54522c',
      accent: '#8f5f96',
      grain: 0.1
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
      label: 'Plum Ink',
      /* Crimson Letter and Terracotta were both a light warm paper with a
         red-brown ink, a hand's breadth apart on the wheel and the same
         decision twice. One of them had to go somewhere else, and a deep
         plum is the gap the set had: the only violet in it was a pale
         one. */
      base: '#2e1d33',
      soft: ['#463049', '#3a2440', '#5c4260'],
      inks: ['#efe6ee', '#e0b46a', '#c9a8d6', '#8f6f96'],
      duo: ['#1a0f1e', '#f2e9f0'],
      text: '#f0e7ef',
      accent: '#e0b46a',
      grain: 0.11
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
      label: 'Forest Room',
      base: '#1e3226',
      soft: ['#2f4a37', '#26402f', '#3d5c46'],
      inks: ['#e6e2cf', '#b6c9a8', '#e0b46a', '#8fa88a'],
      duo: ['#0f1e16', '#e8e6d2'],
      text: '#e8e6d2',
      accent: '#e0b46a',
      grain: 0.12
    },
    {
      id: 'coral',
      label: 'Coral Set',
      /* Deep, not mid. A saturated page at half luminance is the one case
         no accent can serve: reaching a readable contrast forces the
         colour almost to black, and a dark colour blended over a
         saturated ground comes back muddy brown rather than the hue the
         swatch promised. Take the page down instead, and a bright accent
         both contrasts and keeps its hue. */
      base: '#7a2418',
      soft: ['#a83a28', '#5c1810', '#c9503a'],
      inks: ['#ffe6da', '#5fbf9e', '#ffc98f', '#e0614a'],
      duo: ['#3d0f08', '#ffe6da'],
      text: '#ffeae2',
      /* A soft sea green rather than a bright mint. On a page this deep a
         fully saturated green is a highlighter stripe — but taken all the
         way down to a tint it stops being a colour at all: measured, a
         muted #7fae9c reached 0.015% of Aura's pixels, which is nothing
         the eye can find. This one is still soft and lands at 0.11%. The
         floor is not a matter of taste; a colour that does not reach the
         page is not in the palette. */
      accent: '#5fbf9e',
      grain: 0.11
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

    /* Walk the lightness away from the page until the accent reads — but
       in whichever direction gets there first. It used to pick the
       direction from the page alone: lighter for any page under half
       luminance. On a page that IS about half — a saturated coral — that
       meant climbing all the way to 0.93 before the contrast came good,
       and a colour dragged that close to white has no chroma left. The
       swatch promised mint and the wallpaper printed off-white. */
    function walk(from, step) {
      var c = from;
      for (var i = 0; i < 30 && U.contrast(c, p.base) < 3; i++) {
        var h = U.hsl(c);
        c = U.fromHsl(h[0], h[1], U.clamp(h[2] + step, 0.06, 0.94));
      }
      return c;
    }
    if (U.contrast(col, p.base) >= 3) return col;
    var up = walk(col, 0.03), down = walk(col, -0.03);
    /* keep whichever kept more colour, and only fall back to the one that
       actually reached contrast if the other did not */
    var upOk = U.contrast(up, p.base) >= 3, downOk = U.contrast(down, p.base) >= 3;
    if (upOk && !downOk) return up;
    if (downOk && !upOk) return down;
    return chroma(down) >= chroma(up) ? down : up;
  }

  PALETTES.forEach(function (p) {
    p.accentSeed = p.accent;
    p.accent = harmonise(p.accent, p);
  });

  var BY_ID = {};
  PALETTES.forEach(function (p) { BY_ID[p.id] = p; });

  W.palettes = { list: PALETTES, byId: BY_ID };
})(window.PT = window.PT || {});
