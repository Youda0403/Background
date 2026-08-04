/* LYRIC — plates on a grid, with large geometry drawn straight across
   them: one hairline circle wider than the page, one solid star, and a
   quarter-circle arc struck from a grid corner.

   This replaces the torn-paper collage. That design had two faults no
   amount of tuning fixed. The tear sat at a fixed fraction of the page,
   so a short name left the whole upper half empty; and both lines of the
   headline were set in the same script, so pressing Enter changed the
   line count and nothing else.

   The grammar here comes from the technical-collage posters: a coarse
   grid, plates snapped to it and cropped hard against the trim, corner
   brackets and small set numerals at the plate edges, and — the part that
   carries the page — geometric figures drawn at a scale that ignores the
   plates entirely. A circle that fits inside a panel is decoration. A
   circle wider than the page, crossing type and photograph alike, is the
   composition.

   Three rules keep it from turning into litter:

     1. Every plate edge lands on the grid. The figures do not — they are
        struck from grid intersections but their radii are free, which is
        what makes them read as drawn over the layout rather than as
        another cell in it.
     2. There is exactly one of each figure. One circle, one star, one
        arc. A second of anything is a scatter.
     3. Small text never sits on the photograph. It sits on a paper plate
        of its own, which is also what gives the collage its second
        surface. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  function brackets(ctx, r, len, color, alpha, lw) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, lw);
    ctx.beginPath();
    [[r.x, r.y, 1, 1], [r.x + r.w, r.y, -1, 1],
      [r.x, r.y + r.h, 1, -1], [r.x + r.w, r.y + r.h, -1, -1]]
      .forEach(function (p) {
        ctx.moveTo(p[0], p[1] + len * p[3]);
        ctx.lineTo(p[0], p[1]);
        ctx.lineTo(p[0] + len * p[2], p[1]);
      });
    ctx.stroke();
    ctx.restore();
  }

  function label(env, text, x, y, color, size, align) {
    var ctx = env.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.75;
    T.setFont(ctx, 'dmmono', size, {});
    T.draw(ctx, text, x, y, { align: align || 'left', tracking: size * 0.1 });
    ctx.restore();
  }

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content;
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';
    var accent = PO.accentOn(pal, pal.base);

    PO.paper(env, { tint: true });
    var m = PO.margins(env);

    /* the grid every plate edge lands on */
    var cols = wide ? 8 : 6;
    var cell = m.inner / cols;
    var g = U.clamp(cell * 0.34, u(12), u(40));
    function snap(v) { return m.left + Math.round((v - m.left) / cell) * cell; }

    var bandTop = m.top + (env.micro ? mic * 0.9 : mic * 1.9);
    var bandBottom = h - m.bottom - (env.micro ? mic * 0.6 : mic * 2.6);

    /* ---------- the caption plate, measured before anything is placed --- */
    var capW = cell * 3;
    var pad = g * 0.62;
    var capH = 0;
    if (c.caption && !env.micro) {
      capH = PO.block(env, 0, 0, capW - pad * 2, [c.caption], {
        size: mic * 0.8, lead: 1.55, upper: false, measure: true, font: st.bodyFont
      }) + pad * 2 + mic * 1.1;
    }

    /* ---------- the headline ---------- */
    var headBox = { x: m.left, y: bandTop, w: wide ? m.inner * 0.44 : m.inner };
    var headMax = wide ? (bandBottom - bandTop) * 0.8 : (bandBottom - bandTop) * 0.4;
    var head = PO.headline(env, headBox, {
      style: st.headlineStyle, align: 'left', maxH: headMax, measure: true
    });

    /* ---------- the photograph plate ---------- */
    var plate;
    if (wide) {
      var px = snap(m.left + m.inner * 0.46);
      plate = { x: px, y: bandTop, w: w - px, h: bandBottom - bandTop };
    } else {
      var pTop = bandTop + head.h + g * 1.5;
      plate = {
        x: snap(m.left + cell),
        y: pTop,
        /* cropped hard against the trim — a plate that stops inside the
           margin reads as an inset picture, not as a plate */
        w: w - snap(m.left + cell),
        h: Math.max(u(200), bandBottom - pTop - capH * 0.34)
      };
    }

    var deep = U.mix(pal.duo[0], pal.duo[1], 0.34);
    ctx.save();
    ctx.beginPath();
    ctx.rect(plate.x, plate.y, plate.w, plate.h);
    ctx.clip();
    if (env.hasPhoto) {
      env.drawPhoto(plate);
    } else {
      ctx.fillStyle = deep;
      ctx.fillRect(plate.x, plate.y, plate.w, plate.h);
      P.wash(ctx, plate.x + plate.w * 0.3, plate.y + plate.h * 0.28,
        Math.max(plate.w, plate.h) * 0.8, pal.soft[0], 0.6 * st.washStrength);
      P.wash(ctx, plate.x + plate.w * 0.8, plate.y + plate.h * 0.74,
        Math.max(plate.w, plate.h) * 0.66, pal.soft[1] || pal.soft[0], 0.5 * st.washStrength);
    }
    ctx.restore();

    /* ---------- the geometry: struck from the grid, not bound by it ----- */
    /* Wider than the plate, but not so much wider that only two stray
       arcs show inside the trim — a circle has to read as a circle to be
       the composition rather than a scuff. */
    var gx = snap(m.left + cell * (wide ? 4 : 3));
    var gy = plate.y + plate.h * 0.46;
    var R = Math.min(m.inner * 0.66, (bandBottom - bandTop) * 0.62);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    ctx.globalAlpha = 0.5 * env.decoAlpha;
    ctx.strokeStyle = pal.text;
    ctx.lineWidth = Math.max(1, u(2.2));
    P.circle(ctx, gx, gy, R);
    ctx.stroke();

    ctx.globalAlpha = 0.36 * env.decoAlpha;
    ctx.lineWidth = Math.max(1, u(1.6));
    ctx.beginPath();
    ctx.arc(m.left, bandBottom, R * 0.8, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.restore();

    /* The star, solid, sitting astride the plate's top edge. Fat-armed
       rather than spiked: a thin eight-pointed burst at this size reads as
       a sparkle dropped on the page, and the figure has to hold its own
       against a photograph. */
    var starR = cell * (wide ? 1.5 : 1.7);
    /* It straddles the edge the plate shares with the open field — the top
       edge on a portrait page, the left edge on a wide one. Keeping it on
       the top edge of a wide plate put it against the trim, where all that
       showed was the two bottom arms. */
    var starX = wide ? plate.x : plate.x + plate.w * 0.26;
    var starY = wide ? plate.y + plate.h * 0.3 : plate.y;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = accent;
    P.star(ctx, starX, starY, starR, 8, 0.44, 0.39);
    ctx.fill();
    ctx.restore();

    var onPlate = U.onColor(deep);
    brackets(ctx, plate, cell * 0.42, onPlate, 0.8 * env.decoAlpha, u(2));

    /* ---------- the headline, drawn over the geometry ---------- */
    PO.headline(env, headBox, { style: st.headlineStyle, align: 'left', maxH: headMax });

    if (env.micro) {
      PO.microFoot(env, { m: m });
      return;
    }

    /* ---------- the caption plate: the collage's second surface -------- */
    if (capH) {
      var stock = PO.stock(pal);
      /* On a portrait page it laps the plate's lower-left corner, which is
         what makes the two surfaces read as a collage. On a wide one the
         left column is already open, so it sits under the headline rather
         than hanging off the plate into the foot rail. */
      var capPlate = {
        x: m.left,
        y: wide ? bandTop + head.h + g * 1.6
          : Math.min(plate.y + plate.h - capH * 0.62, bandBottom - capH),
        w: capW, h: capH
      };
      ctx.save();
      ctx.globalAlpha = 0.97;
      ctx.fillStyle = stock.paper;
      ctx.fillRect(capPlate.x, capPlate.y, capPlate.w, capPlate.h);
      ctx.restore();
      brackets(ctx, capPlate, cell * 0.22, stock.ink, 0.5, u(1.4));

      label(env, '01', capPlate.x + pad, capPlate.y + pad + mic * 0.66, accent, mic * 0.66);
      PO.block(env, capPlate.x + pad, capPlate.y + pad + mic * 1.05, capW - pad * 2,
        [c.caption], {
          size: mic * 0.8, lead: 1.55, upper: false, alpha: 0.85,
          font: st.bodyFont, color: stock.ink
        });
    }

    /* ---------- set numerals at the plate edges ---------- */
    label(env, 'ø ' + Math.round(R / u(1)), plate.x + cell * 0.5,
      plate.y + cell * 0.5 + mic * 0.5, onPlate, mic * 0.62);

    /* ---------- the foot ---------- */
    var railY = h - m.bottom - mic * 0.9;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, u(2));
    ctx.beginPath();
    ctx.moveTo(m.left, railY - mic * 1.15);
    ctx.lineTo(w - m.right, railY - mic * 1.15);
    ctx.stroke();
    ctx.restore();

    PO.rail(env, railY, [
      (st.showNames && c.names) || W.textstack.monogram(st) || null,
      st.showTags && c.tags.length
        ? c.tags.map(function (t) { return '(' + t.toLowerCase() + ')'; }).join('  ') : null,
      c.footnote || 'pairtone'
    ], { m: m, size: mic * 0.78, alpha: 0.75 });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'lyric',
    label: 'Lyric',
    blurb: '사진판 위로 큰 원과 별을 겹쳐 그은 콜라주. 제일 대담한 쪽.',
    defaults: {
      titleFont: 'bricolage', scriptFont: 'playball', bodyFont: 'dmmono',
      headlineStyle: 'scriptSans',
      photoShape: 'rect', tone: 'duo', toneAmount: 0.92,
      feather: 0, scrim: 0.2,
      motifs: ['sparkle'], decoCount: 0, grain: 1.4, vignette: 0.05
    },
    draw: draw
  });
})(window.PT = window.PT || {});
