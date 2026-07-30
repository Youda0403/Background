/* EDITORIAL — art-book plate. A large treated photo held inside a paper
   margin, a display headline crossing its top edge, a micro-text column
   at the right, and rails top and bottom.
   Reference grammar: gallery flyers and plant/nature study posters. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content;

    PO.paper(env);
    var m = PO.margins(env);
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';

    /* ---- rails ---- */
    var topRailY = m.top + mic;
    PO.rail(env, topRailY, [
      (c.title || 'pairtone').toLowerCase() + (st.showNames && c.names ? ' / ' + c.names.toLowerCase() : ''),
      null,
      c.footnote
    ], { m: m, size: mic, alpha: 0.7 });

    ctx.save();
    ctx.globalAlpha = 0.3 * env.decoAlpha;
    ctx.strokeStyle = pal.text;
    ctx.lineWidth = Math.max(1, u(1.4));
    ctx.beginPath();
    ctx.moveTo(m.left, topRailY + mic * 0.9);
    ctx.lineTo(w - m.right, topRailY + mic * 0.9);
    ctx.stroke();
    ctx.restore();

    /* ---- headline measured first, so the photo can meet it ---- */
    var hasMicro = !!c.caption && !env.micro;
    /* Portrait gets the full measure for the headline and a caption band of
       its own under the plate; only wide canvases have room for the
       side-by-side column the reference posters use. */
    var hlBox = { x: m.left, y: topRailY + mic * (wide ? 2.2 : 2.6), w: m.inner };
    /* The plate is the subject; the headline gets at most a third of the
       page so the photo never collapses into a strip. */
    var hlMaxH = (h - m.top - m.bottom) * (wide ? 0.42 : 0.34);
    var hl = PO.headline(env, hlBox, { align: 'left', measure: true, maxH: hlMaxH });

    var capW = wide ? m.inner * 0.4 : m.inner * 0.78;
    var capH = hasMicro
      ? PO.block(env, 0, 0, capW, [c.caption], { size: mic * 0.92, lead: 1.42, measure: true, font: st.bodyFont })
      : 0;

    /* ---- photo plate ---- */
    var footH = mic * 3.2;
    var plate;
    if (wide) {
      var colW = m.inner * 0.52;
      plate = {
        x: w - m.right - colW, y: m.top + mic * 2.4,
        w: colW, h: h - m.bottom - footH - (m.top + mic * 2.4)
      };
    } else {
      /* the headline's foot grazes the plate rather than sitting on it */
      var overlap = env.tier === 'tall' || env.tier === 'phone' ? 0.16 : 0.28;
      var top = hl.h ? hl.bottom - hl.h * overlap : hlBox.y;
      var capBand = capH ? capH + mic * 1.5 : 0;
      plate = { x: m.left, y: top, w: m.inner, h: h - m.bottom - footH - capBand - top };
    }
    if (plate.h > u(160)) {
      if (env.hasPhoto) {
        env.drawPhoto(plate);
      } else {
        /* no photo: a flat ink field still reads as a plate */
        ctx.save();
        ctx.globalAlpha = 0.5 * st.washStrength;
        ctx.fillStyle = pal.soft[0];
        ctx.fillRect(plate.x, plate.y, plate.w, plate.h);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = 0.45 * env.decoAlpha;
      ctx.strokeStyle = pal.text;
      ctx.lineWidth = Math.max(1, u(1.2));
      ctx.strokeRect(plate.x, plate.y, plate.w, plate.h);
      ctx.restore();
    }

    /* ---- accents hugging the plate, then the headline on top ---- */
    PO.accents(env, plate, { rMin: 20, rMax: 52, outline: true, speckle: st.glitter });

    PO.headline(env, hlBox, {
      align: 'left', maxH: hlMaxH, scriptAlpha: 0.96, l2Weight: 500
    });

    /* ---- caption ---- */
    if (hasMicro) {
      var mx = m.left;
      var my = wide ? hl.bottom + mic * 1.6 : plate.y + plate.h + mic * 0.7;
      PO.block(env, mx, my, capW, [c.caption], {
        size: mic * 0.92, lead: 1.42, upper: false, alpha: 0.8, font: st.bodyFont
      });
    }

    /* ---- foot ---- */
    var footY = h - m.bottom - mic * 0.6;
    ctx.save();
    ctx.globalAlpha = 0.3 * env.decoAlpha;
    ctx.strokeStyle = pal.text;
    ctx.lineWidth = Math.max(1, u(1.4));
    ctx.beginPath();
    ctx.moveTo(m.left, footY - mic * 1.9);
    ctx.lineTo(w - m.right, footY - mic * 1.9);
    ctx.stroke();
    ctx.restore();

    var no = 'no.' + String(1 + (U.hashStr(String(st.seed)) % 899)).padStart(3, '0');
    PO.rail(env, footY, [no, null, W.textstack.monogram(st)], { m: m, size: mic, alpha: 0.7 });
    PO.tagRail(env, footY, { m: m, size: mic * 0.92, alpha: 0.6 });

    if (st.sideLabel) {
      PO.sideLabel(env, (c.title || '').toUpperCase(), { m: m, size: mic * 0.9, y: h * 0.62 });
    }
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'editorial',
    label: 'Editorial',
    blurb: '아트북 도판. 큰 사진 + 제목이 사진 위로 걸쳐요.',
    defaults: {
      titleFont: 'cormorant', scriptFont: 'italianno', bodyFont: 'dmmono',
      headlineStyle: 'scriptSans',
      photoShape: 'rect', tone: 'wash', toneAmount: 0.7,
      feather: 0,
      motifs: ['burst', 'sparkle'], sideLabel: false, vignette: 0.05
    },
    draw: draw
  });
})(window.PT = window.PT || {});
