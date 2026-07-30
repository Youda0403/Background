/* Render orchestrator. The same code path draws the on-screen preview
   and the full-resolution export — only the pixel count differs, because
   every dimension is expressed in per-mille of the short side. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, C = W.compose, TS = W.textstack;

  function layouts() {
    if (!W.layouts) {
      W.layouts = {};
      (W.layoutRegistry || []).forEach(function (l) { W.layouts[l.id] = l; });
    }
    return W.layouts;
  }

  function dims(st) {
    var w, h;
    if (st.presetId === 'custom') {
      w = U.clamp(Math.round(st.customW) || 1080, 64, 8000);
      h = U.clamp(Math.round(st.customH) || 1920, 64, 8000);
    } else {
      var p = W.presets.byId[st.presetId] || W.presets.byId['ip-15'];
      w = p.w; h = p.h;
    }
    if (st.orientation === 'landscape') { var t = w; w = h; h = t; }
    return { w: w, h: h };
  }

  function photoOpts(st, pal) {
    return {
      tone: st.tone,
      toneAmount: U.clamp(st.toneAmount, 0, 1),
      brightness: st.brightness,
      contrast: st.contrast,
      saturation: st.saturation,
      blur: st.blur,
      duoDark: pal.duo[0],
      duoLight: pal.duo[1],
      inkColor: pal.duo[0],
      feather: st.feather,
      opacity: st.opacity,
      blend: st.blend,
      overprint: st.overprint,
      halftoneCells: st.halftoneCells,
      ox: st.ox,
      oy: st.oy,
      zoom: st.zoom,
      rotate: st.photoRotate
    };
  }

  function buildEnv(ctx, w, h, st, nominal) {
    var pal = W.palettes.byId[st.palette] || W.palettes.list[0];
    var S = Math.min(w, h);
    var tier = C.tierOf(h / w);
    var safeKey = tier === 'wide' ? 'wide' : (tier === 'tall' || tier === 'phone') ? 'phone' : 'tablet';
    var sa = W.presets.safe[safeKey];
    var sub = U.clamp(st.subtlety, 0, 1);

    var env = {
      ctx: ctx, w: w, h: h, S: S, ar: h / w, tier: tier,
      u: function (v) { return (v * S) / 1000; },
      st: st, pal: pal,
      seedNum: U.hashStr(String(st.seed)),
      rand: U.rng(String(st.seed) + '|' + st.layout + '|' + st.palette),
      content: TS.build(st),
      emphasis: 1 - sub,
      decoAlpha: U.lerp(1, 0.5, sub),
      /* Literally the number of decorations drawn. Discretion changes how
         loud they are, never how many — a control labelled "6개" that
         quietly drew four is worse than no control. */
      decoBudget: Math.round(U.clamp(st.decoCount, 0, 24)),
      hasPhoto: W.photo.has(),
      safe: sa,
      /* The target's true proportions. Integer canvas sizes mean the
         preview's own aspect ratio is a hair off the export's, so anything
         that rounds (grid row counts, for one) must use this instead. */
      nominalAr: nominal ? nominal.h / nominal.w : h / w,
      /* Watch faces and cover screens cannot carry four lines of type —
         drop the long ones and enlarge what is left. */
      micro: S < 560,
      typeScale: S < 560 ? 1.45 : 1
    };

    env.band = {
      top: Math.max(h * 0.06, st.safeShift ? h * sa.clock[1] : h * 0.07),
      bottom: Math.min(h * 0.95, st.safeShift ? h * sa.dock[0] : h * 0.93)
    };

    var shape = W.frames.make(st.photoShape, env.seedNum);
    var opts = photoOpts(st, pal);
    env.drawPhoto = function (frame) {
      W.photo.place(ctx, frame, shape, opts, pal);
    };
    return env;
  }

  function vignette(env) {
    var st = env.st;
    if (st.vignette <= 0.005) return;
    var ctx = env.ctx, w = env.w, h = env.h;
    var dark = U.luma(env.pal.base) > 0.5 ? '#3a3a38' : '#000000';
    var r = Math.hypot(w, h) * 0.62;
    var g = ctx.createRadialGradient(w / 2, h / 2, r * 0.42, w / 2, h / 2, r);
    g.addColorStop(0, U.rgba(dark, 0));
    g.addColorStop(1, U.rgba(dark, st.vignette));
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /* Lock-screen keep-out guides. Preview only — never exported. */
  function guides(env) {
    var ctx = env.ctx, w = env.w, h = env.h, sa = env.safe;
    var line = U.luma(env.pal.base) > 0.5 ? 'rgba(20,20,20,0.45)' : 'rgba(255,255,255,0.5)';
    ctx.save();
    ctx.strokeStyle = line;
    ctx.lineWidth = Math.max(1, env.u(3));
    ctx.setLineDash([env.u(16), env.u(12)]);
    [['clock', sa.clock], ['widget', sa.widget], ['dock', sa.dock]].forEach(function (pair) {
      var band = pair[1];
      if (band[1] - band[0] <= 0) return;
      ctx.strokeRect(env.u(30), h * band[0], w - env.u(60), h * (band[1] - band[0]));
    });
    ctx.restore();
  }

  function render(canvas, st, opts) {
    opts = opts || {};
    var d = dims(st);
    var scale = 1;
    if (opts.maxSize) scale = Math.min(scale, opts.maxSize / Math.max(d.w, d.h));
    if (opts.maxPixels) scale = Math.min(scale, Math.sqrt(opts.maxPixels / (d.w * d.h)));
    var w = Math.max(16, Math.round(d.w * scale));
    var h = Math.max(16, Math.round(d.h * scale));

    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, w, h);

    var env = buildEnv(ctx, w, h, st, d);
    var L = layouts()[st.layout] || layouts().aura;
    L.draw(env);

    vignette(env);
    P.applyGrain(ctx, w, h, U.clamp(env.pal.grain * st.grain, 0, 0.6), env.u(1000) / 1000);
    if (opts.guides && st.showGuides) guides(env);

    return { w: w, h: h, scale: scale, full: d, env: env };
  }

  function slug(st) {
    var base = (st.pairName || TS.joinNames(st) || 'wallpaper')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    var d = dims(st);
    return (base || 'wallpaper') + '-' + d.w + 'x' + d.h;
  }

  function toBlob(st) {
    return new Promise(function (resolve, reject) {
      var c = document.createElement('canvas');
      try {
        render(c, st, {});
      } catch (e) {
        reject(e);
        return;
      }
      if (c.toBlob) {
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error('encode failed')); }, 'image/png');
      } else {
        try {
          var parts = c.toDataURL('image/png').split(',');
          var bin = atob(parts[1]);
          var arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          resolve(new Blob([arr], { type: 'image/png' }));
        } catch (e2) { reject(e2); }
      }
    });
  }

  W.render = {
    render: render, dims: dims, layouts: layouts, toBlob: toBlob, slug: slug
  };
})(window.PT = window.PT || {});
