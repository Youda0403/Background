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
    onColor: onColor, debounce: debounce, raf: raf
  };
})(window.PT = window.PT || {});
