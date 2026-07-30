/* Palettes lifted from the reference boards. A palette is the whole
   visual voice, not just colour: it also carries the typographic pairing
   and the paper feel, so picking one is a complete stylistic choice and
   the user only ever has two decisions — layout and palette.

   base    : page colour
   inks    : decorative colours (stars, panels, motifs)
   duo     : [shadow, highlight] used to tone photos into the page
   text    : foreground for typography
   soft    : aura / wash colours
   type    : title / script / body faces + which headline pairing suits
   texture : grain, vignette and glitter defaults
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
      grain: 0.05,
      type: { title: 'instrument', script: 'birthstone', body: 'dmmono', headline: 'stack' },
      texture: { grain: 0.05, vignette: 0.05, glitter: false }
    },
    {
      id: 'greenwash',
      label: 'Green Wash',
      base: '#f7fdf8',
      soft: ['#b6ddb9', '#d8efd6', '#eaf7ee'],
      inks: ['#8cc79a', '#6fae85', '#cfe6cd', '#a3d0ae'],
      duo: ['#2f5a41', '#f2fbf3'],
      text: '#4c6b56',
      grain: 0.04,
      type: { title: 'familjen', script: 'parisienne', body: 'familjen', headline: 'scriptSans' },
      texture: { grain: 0.04, vignette: 0.04, glitter: false }
    },
    {
      id: 'sage',
      label: 'Sage Letter',
      base: '#eeeade',
      soft: ['#c3cdb0', '#dcd9c6', '#b9c4a6'],
      inks: ['#a9b795', '#8d9c7b', '#d6d2bd', '#f4f1e6'],
      duo: ['#5d6a4d', '#f1efe3'],
      text: '#6b6f5c',
      grain: 0.12,
      type: { title: 'cormorant', script: 'italianno', body: 'dmmono', headline: 'scriptSans' },
      texture: { grain: 0.12, vignette: 0.05, glitter: false }
    },
    {
      id: 'aurapink',
      label: 'Aura Heart',
      base: '#fdf6f8',
      soft: ['#f9c3d2', '#e6d3f2', '#fbe0e8'],
      inks: ['#f4a8bf', '#c9b6e8', '#ffe9a8', '#bfe4ef'],
      duo: ['#8a5a72', '#fdf2f6'],
      text: '#8d6577',
      grain: 0.05,
      type: { title: 'cormorant', script: 'birthstone', body: 'dmmono', headline: 'scriptSans' },
      texture: { grain: 0.05, vignette: 0.06, glitter: false }
    },
    {
      id: 'dotpaper',
      label: 'Dot Diary',
      base: '#fbfbfa',
      soft: ['#f6e4e2', '#e7eef5', '#f2f2ef'],
      inks: ['#2b2b2b', '#9fbcd6', '#f2ddda', '#c9c9c4'],
      duo: ['#1f2933', '#f8f8f6'],
      text: '#2b2b2b',
      grain: 0.06,
      type: { title: 'playfair', script: 'delafield', body: 'spacegrotesk', headline: 'capsScript' },
      texture: { grain: 0.06, vignette: 0.05, glitter: false }
    },
    {
      id: 'riso',
      label: 'Riso Blue',
      base: '#f3efe2',
      soft: ['#2f6d92', '#8d9464', '#dcd6c2'],
      inks: ['#1f5f86', '#8b9360', '#e8e2d0', '#123f5c'],
      duo: ['#12496c', '#f5f1e4'],
      text: '#1b3d52',
      grain: 0.14,
      type: { title: 'bricolage', script: 'parisienne', body: 'dmmono', headline: 'scriptSans' },
      texture: { grain: 0.14, vignette: 0.07, glitter: false }
    },
    {
      id: 'applesilver',
      label: 'Apple Silver',
      base: '#123a86',
      soft: ['#2b56a8', '#0d2c6b', '#3f6bc0'],
      inks: ['#d9dde6', '#e8443f', '#f4d24e', '#8fb8e8'],
      duo: ['#0b2559', '#dfe6f2'],
      text: '#eef2fa',
      grain: 0.08,
      type: { title: 'dmserif', script: 'delafield', body: 'dmmono', headline: 'scriptSans' },
      texture: { grain: 0.08, vignette: 0.1, glitter: true }
    },
    {
      id: 'jelly',
      label: 'Jelly Tide',
      base: '#fbfcfe',
      soft: ['#cfe2f5', '#e6eefb', '#f2f6fd'],
      inks: ['#3f7fbf', '#8fc6e8', '#f4c6d8', '#ffe8a8'],
      duo: ['#255d92', '#f7fbff'],
      text: '#6a7684',
      grain: 0.03,
      type: { title: 'spacegrotesk', script: 'sacramento', body: 'spacegrotesk', headline: 'capsScript' },
      texture: { grain: 0.03, vignette: 0.04, glitter: false }
    },
    {
      id: 'cream',
      label: 'Cream Doodle',
      base: '#fbfbe6',
      soft: ['#dfeefb', '#f6dbe8', '#eef7dd'],
      inks: ['#5b86d6', '#f2a8c4', '#9fd4c0', '#2f4f9c'],
      duo: ['#3b5aa0', '#fbfbe8'],
      text: '#5a6285',
      grain: 0.07,
      type: { title: 'fraunces', script: 'yellowtail', body: 'dmmono', headline: 'scriptSans' },
      texture: { grain: 0.07, vignette: 0.05, glitter: false }
    },
    {
      id: 'kawaii',
      label: 'Soft Sheet',
      base: '#fdfcfa',
      soft: ['#e9f3fb', '#fdeee2', '#fdf6e2'],
      inks: ['#f6c9a8', '#a8d3ea', '#f2b8c6', '#e8dfa8'],
      duo: ['#8a6a58', '#fdf8f2'],
      text: '#8a7566',
      grain: 0.05,
      type: { title: 'bagel', script: 'parisienne', body: 'dmmono', headline: 'stack' },
      texture: { grain: 0.05, vignette: 0.04, glitter: false }
    },
    {
      id: 'mono',
      label: 'Ink & Blush',
      base: '#f7f6f4',
      soft: ['#f3e6e4', '#e8e8e6', '#fbfbfa'],
      inks: ['#161616', '#8c8c8c', '#f0dcd8', '#d8d8d4'],
      duo: ['#111111', '#f6f4f2'],
      text: '#161616',
      grain: 0.09,
      type: { title: 'syne', script: 'delafield', body: 'spacemono', headline: 'capsScript' },
      texture: { grain: 0.09, vignette: 0.06, glitter: false }
    },
    {
      id: 'midnight',
      label: 'Midnight Wish',
      base: '#171a2e',
      soft: ['#2c3358', '#3d3563', '#1d2140'],
      inks: ['#cfd6f2', '#8f9be0', '#f2d9a8', '#b9a8e0'],
      duo: ['#0d1024', '#c9d2f2'],
      text: '#e4e8fa',
      grain: 0.1,
      type: { title: 'didone', script: 'delafield', body: 'spacegrotesk', headline: 'capsScript' },
      texture: { grain: 0.1, vignette: 0.22, glitter: true }
    }
  ];

  var BY_ID = {};
  PALETTES.forEach(function (p) { BY_ID[p.id] = p; });

  W.palettes = { list: PALETTES, byId: BY_ID };
})(window.PT = window.PT || {});
