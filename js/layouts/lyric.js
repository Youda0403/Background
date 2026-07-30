/* LYRIC — full-bleed photo, crop marks, small-caps lyric blocks up top
   and a huge script headline sitting at the foot with a burst behind it.
   Reference grammar: single-artwork lyric posters. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content, rand = env.rand;

    PO.paper(env);
    var m = PO.margins(env);
    var mic = PO.micro(env);
    var inset = st.bleed ? { left: 0, right: 0, top: 0, bottom: 0, inner: w }
      : { left: m.left, right: m.right, top: m.top + mic * 2, bottom: m.bottom + mic * 3, inner: m.inner };

    /* ---- photo fills the plate ---- */
    var plate = {
      x: inset.left, y: inset.top,
      w: w - inset.left - inset.right, h: h - inset.top - inset.bottom
    };
    if (env.hasPhoto) {
      env.drawPhoto(plate);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.55 * st.washStrength;
      ctx.fillStyle = pal.soft[0];
      ctx.fillRect(plate.x, plate.y, plate.w, plate.h);
      P.wash(ctx, plate.x + plate.w * 0.6, plate.y + plate.h * 0.35, env.S * 0.7,
        pal.soft[1] || pal.inks[1], 0.5 * st.washStrength);
      ctx.restore();
    }

    /* ---- scrim so type stays legible over any photo ---- */
    var overPhoto = U.luma(pal.duo[0]) < 0.5 ? '#ffffff' : pal.text;
    var scrimC = U.luma(pal.duo[0]) < 0.5 ? '#0b0d16' : '#ffffff';
    var g = ctx.createLinearGradient(0, plate.y + plate.h * 0.42, 0, plate.y + plate.h);
    g.addColorStop(0, U.rgba(scrimC, 0));
    g.addColorStop(1, U.rgba(scrimC, st.scrim));
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(plate.x, plate.y + plate.h * 0.42, plate.w, plate.h * 0.58);
    ctx.restore();

    /* ---- headline at the foot, burst behind ---- */
    var hlBox = { x: inset.left + u(34), y: h - inset.bottom - u(40), w: plate.w - u(68) };
    var hlMaxH = plate.h * 0.36;
    var hl = PO.headline(env, hlBox, {
      align: 'left', anchor: 'bottom', style: 'capsScript', maxH: hlMaxH,
      color: overPhoto, measure: true, ruleAfterSmall: true
    });

    if (st.burst && hl.h) {
      ctx.save();
      ctx.globalAlpha = 0.85 * env.decoAlpha;
      ctx.fillStyle = pal.inks[2] || pal.inks[0];
      P.burst(ctx, hl.x + u(24), hl.y + hl.h * 0.74, hl.h * 0.5, 8, 0.06);
      ctx.fill();
      ctx.restore();
    }

    PO.headline(env, hlBox, {
      align: 'left', anchor: 'bottom', style: 'capsScript', maxH: hlMaxH,
      color: overPhoto, ruleAfterSmall: true
    });

    /* ---- lyric blocks in the upper field ---- */
    if (c.caption && !env.micro) {
      var parts = c.caption.split(/\s*[|/·•]\s*|\s*\.\s+/).filter(Boolean);
      var bw = plate.w * (env.tier === 'wide' ? 0.3 : 0.52);
      PO.block(env, plate.x + u(40), plate.y + u(64), bw, [parts[0]], {
        size: mic * 0.95, lead: 1.5, alpha: 0.9, color: overPhoto,
        font: st.bodyFont, underlineFirst: false
      });
      if (parts[1]) {
        PO.block(env, plate.x + plate.w - u(40) - bw, plate.y + plate.h * 0.4, bw, [parts[1]], {
          size: mic * 0.95, lead: 1.5, alpha: 0.9, color: overPhoto,
          font: st.bodyFont, align: 'right'
        });
      }
    }

    /* ---- crop marks + rails ---- */
    if (!st.bleed) {
      PO.corners(env, { left: m.left * 0.55, right: m.right * 0.55, top: m.top * 0.6, bottom: m.bottom * 0.6 },
        { len: 40, alpha: 0.75 });
      PO.rail(env, m.top + mic * 0.6, [null, '※ ' + (c.title || 'pairtone').toUpperCase() + ' ※', null],
        { m: m, size: mic * 0.92, alpha: 0.7 });
      PO.rail(env, h - m.bottom + mic * 0.2, [
        c.footnote, null, W.textstack.monogram(st)
      ], { m: m, size: mic * 0.9, alpha: 0.65 });
      PO.tagRail(env, h - m.bottom + mic * 0.2, { m: m, size: mic * 0.88, alpha: 0.55 });
    } else {
      PO.rail(env, m.top + mic, [null, '※ ' + (c.title || '').toUpperCase() + ' ※', null],
        { m: m, size: mic * 0.92, alpha: 0.7, color: overPhoto });
      PO.tagRail(env, h - m.bottom, { m: m, size: mic * 0.9, alpha: 0.6, color: overPhoto });
    }

    /* ---- sparkles along the type ---- */
    PO.accents(env, { x: hlBox.x, y: hl.y || h * 0.7, w: hlBox.w, h: hl.h || u(200) }, {
      rMin: 14, rMax: 34,
      colors: [pal.inks[2] || pal.inks[0], overPhoto], speckle: st.glitter
    });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'lyric',
    label: 'Lyric',
    blurb: '가사 포스터. 사진 꽉 채우고 아래에 큰 필기체.',
    defaults: {
      photoShape: 'rect', tone: 'wash', toneAmount: 0.55,
      feather: 0, headlineStyle: 'capsScript', bleed: false, burst: true,
      scrim: 0.4, motifs: ['burst', 'sparkle', 'flash'], vignette: 0.12
    },
    draw: draw
  });
})(window.PT = window.PT || {});
