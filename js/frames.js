/* Photo window shapes. Each returns fn(ctx, w, h, k) which lays down a
   path inside a w×h box, scaled by k about the centre (k drives the
   feathered edge in photo.place). */
(function (W) {
  'use strict';
  var P = W.prim, U = W.util;

  var SHAPES = [
    { id: 'circle', label: 'Circle' },
    { id: 'arch', label: 'Arch' },
    { id: 'rect', label: 'Panel' },
    { id: 'card', label: 'Rounded' },
    { id: 'blob', label: 'Blob' },
    { id: 'heart', label: 'Heart' },
    { id: 'star', label: 'Star' },
    { id: 'oval', label: 'Oval' },
    { id: 'full', label: 'Full bleed' }
  ];

  function make(kind, seed) {
    var rand = U.rng('shape' + (seed || 0));
    return function (ctx, w, h, k) {
      k = k == null ? 1 : k;
      var cx = w / 2, cy = h / 2;
      var sw = w * k, sh = h * k;
      var m = Math.min(sw, sh);
      switch (kind) {
        case 'circle':
          P.circle(ctx, cx, cy, m / 2);
          break;
        case 'oval':
          ctx.beginPath();
          ctx.ellipse(cx, cy, sw / 2, sh / 2, 0, 0, P.TAU);
          ctx.closePath();
          break;
        case 'arch':
          P.arch(ctx, cx - sw / 2, cy - sh / 2, sw, sh);
          break;
        case 'card':
          P.roundRect(ctx, cx - sw / 2, cy - sh / 2, sw, sh, m * 0.12);
          break;
        case 'blob':
          P.blob(ctx, cx, cy, m / 2, U.rng('blob' + (seed || 0)), 0.15, 9);
          break;
        case 'heart':
          P.heart(ctx, cx, cy, m * 0.56);
          break;
        case 'star':
          P.puffStar(ctx, cx, cy, m / 2, 5, 0.52, 0);
          break;
        case 'full':
        case 'rect':
        default:
          ctx.beginPath();
          ctx.rect(cx - sw / 2, cy - sh / 2, sw, sh);
          ctx.closePath();
      }
      return rand;
    };
  }

  W.frames = { shapes: SHAPES, make: make };
})(window.PT = window.PT || {});
