/* Seeded RNG, colour maths, small helpers. */
(function (W) {
  'use strict';

  function hashStr(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /* mulberry32 — small, fast, deterministic. */
  function rng(seed) {
    var a = typeof seed === 'number' ? seed >>> 0 : hashStr(String(seed));
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(r, arr) { return arr[Math.floor(r() * arr.length) % arr.length]; }
  function range(r, lo, hi) { return lo + r() * (hi - lo); }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function hex2rgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgba(hex, a) {
    var c = hex2rgb(hex);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  function mix(hexA, hexB, t) {
    var a = hex2rgb(hexA), b = hex2rgb(hexB);
    return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' +
      Math.round(lerp(a[1], b[1], t)) + ',' +
      Math.round(lerp(a[2], b[2], t)) + ')';
  }

  function rgb2hex(r, g, b) {
    function h2(v) { var t = clamp(Math.round(v), 0, 255).toString(16); return t.length < 2 ? '0' + t : t; }
    return '#' + h2(r) + h2(g) + h2(b);
  }

  /* Like `mix`, but hex in and hex out, so the result can be fed back into
     anything that parses colours itself. */
  function mixHex(hexA, hexB, t) {
    var a = hex2rgb(hexA), b = hex2rgb(hexB);
    return rgb2hex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
  }

  /* hex -> [hue 0..360, saturation 0..1, lightness 0..1] */
  function hsl(hex) {
    var c = hex2rgb(hex);
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    var l = (mx + mn) / 2;
    if (!d) return [0, 0, l];
    var s = d / (1 - Math.abs(2 * l - 1));
    var h;
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [((h * 60) + 360) % 360, s, l];
  }

  function fromHsl(h, s, l) {
    s = clamp(s, 0, 1); l = clamp(l, 0, 1);
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var hp = (((h % 360) + 360) % 360) / 60;
    var x = c * (1 - Math.abs((hp % 2) - 1));
    var rgb = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x]
      : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
    var m = l - c / 2;
    return rgb2hex((rgb[0] + m) * 255, (rgb[1] + m) * 255, (rgb[2] + m) * 255);
  }

  /* WCAG relative luminance, and the contrast ratio between two colours. */
  function rel(hex) {
    var c = hex2rgb(hex).map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  function contrast(a, b) {
    var la = rel(a), lb = rel(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  function luma(hex) {
    var c = hex2rgb(hex);
    return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  }

  /* Readable text colour against a background. */
  function onColor(hex) { return luma(hex) > 0.55 ? '#1a1a1a' : '#f7f7f5'; }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  /* rAF-coalesced scheduler: many control changes, one render. */
  function raf(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fn(); });
    };
  }

  W.util = {
    hashStr: hashStr, rng: rng, pick: pick, range: range, clamp: clamp,
    lerp: lerp, hex2rgb: hex2rgb, rgba: rgba, mix: mix, luma: luma,
    onColor: onColor, debounce: debounce, raf: raf,
    rgb2hex: rgb2hex, mixHex: mixHex, hsl: hsl, fromHsl: fromHsl, contrast: contrast
  };
})(window.PT = window.PT || {});
