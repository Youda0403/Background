/* Palettes lifted from the reference boards. Colour only — the fonts
   belong to the layout and to the user, not to the palette.

   base  : page colour
   inks  : decorative colours (stars, panels, motifs)
   duo   : [shadow, highlight] used to tone photos into the page
   text  : foreground for typography
   soft  : aura / wash colours
   grain : how much paper texture this stock naturally carries
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
      grain: 0.05
    },
    {
      id: 'greenwash',
      label: 'Green Wash',
      base: '#f7fdf8',
      soft: ['#b6ddb9', '#d8efd6', '#eaf7ee'],
      inks: ['#8cc79a', '#6fae85', '#cfe6cd', '#a3d0ae'],
      duo: ['#2f5a41', '#f2fbf3'],
      text: '#4c6b56',
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
      grain: 0.12
    },
    {
      id: 'aurapink',
      label: 'Aura Heart',
      base: '#fdf6f8',
      soft: ['#f9c3d2', '#e6d3f2', '#fbe0e8'],
      inks: ['#f4a8bf', '#c9b6e8', '#ffe9a8', '#bfe4ef'],
      duo: ['#8a5a72', '#fdf2f6'],
      text: '#8d6577',
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
      grain: 0.08
    },
    {
      id: 'jelly',
      label: 'Jelly Tide',
      base: '#fbfcfe',
      soft: ['#cfe2f5', '#e6eefb', '#f2f6fd'],
      inks: ['#3f7fbf', '#8fc6e8', '#f4c6d8', '#ffe8a8'],
      duo: ['#255d92', '#f7fbff'],
      text: '#6a7684',
      grain: 0.03
    },
    {
      id: 'cream',
      label: 'Cream Doodle',
      base: '#fbfbe6',
      soft: ['#dfeefb', '#f6dbe8', '#eef7dd'],
      inks: ['#5b86d6', '#f2a8c4', '#9fd4c0', '#2f4f9c'],
      duo: ['#3b5aa0', '#fbfbe8'],
      text: '#5a6285',
      grain: 0.07
    },
    {
      id: 'kawaii',
      label: 'Soft Sheet',
      base: '#fdfcfa',
      soft: ['#e9f3fb', '#fdeee2', '#fdf6e2'],
      inks: ['#f6c9a8', '#a8d3ea', '#f2b8c6', '#e8dfa8'],
      duo: ['#8a6a58', '#fdf8f2'],
      text: '#8a7566',
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
      grain: 0.1
    }
    ,
    {
      id: 'shampoo',
      label: 'Shampoo Blue',
      base: '#dcecf8',
      soft: ['#a8d0ee', '#ffffff', '#cfe4f6'],
      inks: ['#2b4f7a', '#7fb2dd', '#ffffff', '#b9cfe4'],
      duo: ['#1d3c60', '#eaf4fc'],
      text: '#1f3d5e',
      grain: 0.05
    },
    {
      id: 'crimson',
      label: 'Crimson Letter',
      base: '#f6efe4',
      soft: ['#e8c9bd', '#f2ded0', '#d9b7a8'],
      inks: ['#a32a2a', '#7d1f24', '#e3b9a6', '#2e2422'],
      duo: ['#6b1c1c', '#f7f0e6'],
      text: '#5c2320',
      grain: 0.13
    },
    {
      id: 'terracotta',
      label: 'Terracotta',
      base: '#f3e6d8',
      soft: ['#dcae8c', '#e8cbb2', '#c98f6b'],
      inks: ['#b4643c', '#8a4a2e', '#e0bb9b', '#4a3326'],
      duo: ['#7a4429', '#f6ebdd'],
      text: '#6b4130',
      grain: 0.12
    },
    {
      id: 'lavender',
      label: 'Lavender Haze',
      base: '#f6f2fb',
      soft: ['#d7c8ee', '#e9dff7', '#c3b2e2'],
      inks: ['#8f7ac0', '#6d5aa0', '#e0d2f2', '#f4c9de'],
      duo: ['#5b4a86', '#f7f3fc'],
      text: '#6a5a92',
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
      grain: 0.11
    },
    {
      id: 'peach',
      label: 'Peach Fizz',
      base: '#fff2ec',
      soft: ['#ffd0bc', '#ffe2d6', '#ffc0b0'],
      inks: ['#f28f6e', '#e2694f', '#ffd9c4', '#8fc7c2'],
      duo: ['#a8543a', '#fff4ef'],
      text: '#a05a44',
      grain: 0.05
    },
    {
      id: 'butter',
      label: 'Butter Note',
      base: '#fbf4dc',
      soft: ['#f5e0a0', '#fbeec4', '#e8cf86'],
      inks: ['#c9a23c', '#8f6f22', '#f2e2b0', '#6f7a4a'],
      duo: ['#7a5f1e', '#fdf7e4'],
      text: '#6f5a24',
      grain: 0.09
    },
    {
      id: 'charcoal',
      label: 'Charcoal',
      base: '#1c1c1a',
      soft: ['#33332f', '#262624', '#3d3d38'],
      inks: ['#e6e2d6', '#a8a396', '#c9b98a', '#8f8f86'],
      duo: ['#0e0e0d', '#e8e4d8'],
      text: '#ebe7db',
      grain: 0.13
    }
  ];

  var BY_ID = {};
  PALETTES.forEach(function (p) { BY_ID[p.id] = p; });

  W.palettes = { list: PALETTES, byId: BY_ID };
})(window.PT = window.PT || {});
