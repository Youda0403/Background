/* AURA — the poster-zine page: a big Didone title top left, three
   numbered photo windows stepping down alternate sides, a gradient ribbon
   curling through them, and spiky stars.

   The layout it replaces was a circle parked above a centred stack, and
   the photograph was the last thing it thought about: a small window with
   a glow behind it, the same on every page. Here the picture appears three
   times, in three shapes, at three crops, and the composition is built
   round those windows.

   What carries over from the old Aura is the air: a warm paper ground with
   two wide blooms, soft grain, and nothing hard-edged except the frames.

   Rules that keep it standing on 33 device shapes:

     · Everything is placed in fractions of the STAGE — the measure by the
       keep-out band — so the whole composition scales with the page rather
       than drifting apart on a tablet.
     · The boxes are laid out so no two of them share a rectangle. The
       frames alternate sides and the small type lives in the gaps beside
       them; nothing is positioned relative to how long a string happens
       to be.
     · A wide canvas gets its own table: the title takes the left half and
       the windows stand in the right, because a stepped column of frames
       on a 16:9 page is three stamps in a very long field.

   With no photograph every window fills with the palette's own duotone
   field and its washes, so the page is identical either way. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, D = W.deco, PO = W.poster, T = W.type;

  /* ---------- shapes ---------- */

  function octagon(ctx, w, h, k) {
    k = k == null ? 1 : k;
    var cx = w / 2, cy = h / 2, sw = w * k, sh = h * k;
    var cut = Math.min(sw, sh) * 0.22;
    var x0 = cx - sw / 2, y0 = cy - sh / 2, x1 = cx + sw / 2, y1 = cy + sh / 2;
    ctx.beginPath();
    ctx.moveTo(x0 + cut, y0);
    ctx.lineTo(x1 - cut, y0);
    ctx.lineTo(x1, y0 + cut);
    ctx.lineTo(x1, y1 - cut);
    ctx.lineTo(x1 - cut, y1);
    ctx.lineTo(x0 + cut, y1);
    ctx.lineTo(x0, y1 - cut);
    ctx.lineTo(x0, y0 + cut);
    ctx.closePath();
  }

  function shapeOf(kind) {
    return kind === 'oct' ? octagon : W.frames.make(kind, 3);
  }

  /* Lay the frame's outline down in PAGE coordinates. Canvas bakes the
     transform into the path as the segments are added, so building it
     under a translate and restoring immediately leaves the path where it
     was drawn — which is how one shape function can serve both the photo
     mask and the outline. */
  function framePath(ctx, kind, fr, k) {
    ctx.save();
    ctx.translate(fr.x, fr.y);
    shapeOf(kind)(ctx, fr.w, fr.h, k == null ? 1 : k);
    ctx.restore();
  }

  /* ---------- the ribbon ---------- */

  /* A twisted paper streamer.

     The first cut of this was one smooth polygon whose width breathed
     along its length, and what that draws is a worm: a tube with no
     surface. Ribbon reads through two things a tube does not have —
     CREASES, where the band pinches to a hairline, and a BACK FACE, the
     duller side you see between one crease and the next. So the spine is
     sampled, the half-width is a full sine that really does close at every
     half turn, and each run between two creases is filled as its own
     quad, alternating front and back. */
  function ribbon(ctx, pts, wid, front, back, alpha) {
    var N = 160, i, t;
    function at(t2) {
      /* Catmull-Rom through the control points, so the curve passes
         through each one instead of being pulled short of it */
      var n = pts.length - 1;
      var f = U.clamp(t2, 0, 1) * n;
      var i0 = Math.min(n, Math.floor(f)), u2 = f - i0;
      var p0 = pts[Math.max(0, i0 - 1)], p1 = pts[i0];
      var p2 = pts[Math.min(n, i0 + 1)], p3 = pts[Math.min(n, i0 + 2)];
      var uu = u2 * u2, uuu = uu * u2;
      return {
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * u2 +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * uu +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * uuu),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * u2 +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * uu +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * uuu)
      };
    }
    var TURNS = 3.6, PH = 0.5;
    var sp = [];
    for (i = 0; i <= N; i++) {
      t = i / N;
      var a = at(t), b = at(Math.min(1, t + 0.003));
      var dx = b.x - a.x, dy = b.y - a.y;
      var len = Math.hypot(dx, dy) || 1;
      var ph = t * Math.PI * TURNS + PH;
      /* the ends taper shut as well, so the streamer is a length of ribbon
         rather than a band cut square at both ends */
      var taper = Math.min(1, Math.sin(Math.min(1, t * 5)) * 1.25) *
        Math.min(1, Math.sin(Math.min(1, (1 - t) * 5)) * 1.25);
      sp.push({
        x: a.x, y: a.y, nx: -dy / len, ny: dx / len,
        hw: wid * 0.5 * Math.max(0.05, Math.abs(Math.sin(ph))) * Math.max(0.1, taper),
        face: Math.floor(ph / Math.PI) % 2
      });
    }
    function grad(c) {
      var g = ctx.createLinearGradient(pts[0].x, pts[0].y,
        pts[pts.length - 1].x, pts[pts.length - 1].y);
      g.addColorStop(0, c[0]);
      g.addColorStop(1, c[1]);
      return g;
    }
    var faces = [grad(front), grad(back)];
    ctx.save();
    ctx.globalAlpha = alpha;
    var run = [sp[0]];
    for (i = 1; i <= sp.length; i++) {
      var q = sp[i];
      if (q && q.face === run[0].face) { run.push(q); continue; }
      if (run.length > 1) {
        ctx.fillStyle = faces[run[0].face];
        ctx.beginPath();
        run.forEach(function (r, k) {
          var x = r.x + r.nx * r.hw, y = r.y + r.ny * r.hw;
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        for (var k2 = run.length - 1; k2 >= 0; k2--) {
          ctx.lineTo(run[k2].x - run[k2].nx * run[k2].hw, run[k2].y - run[k2].ny * run[k2].hw);
        }
        ctx.closePath();
        ctx.fill();
      }
      if (q) run = [sp[i - 1], q];
    }
    ctx.restore();
  }

  /* ---------- small marks ---------- */

  function gradStar(ctx, x, y, r, c1, c2, alpha, spikes) {
    var g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    P.motifs[spikes === 4 ? 'burst4' : 'burst'](ctx, x, y, r);
    ctx.fill();
    ctx.restore();
  }

  function crosshair(ctx, x, y, r, color, alpha, lw) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    ctx.moveTo(x - r, y); ctx.lineTo(x - r * 0.72, y);
    ctx.moveTo(x + r * 0.72, y); ctx.lineTo(x + r, y);
    ctx.moveTo(x, y - r); ctx.lineTo(x, y - r * 0.72);
    ctx.moveTo(x, y + r * 0.72); ctx.lineTo(x, y + r);
    ctx.stroke();
    ctx.restore();
  }

  function crossMark(ctx, x, y, r, color, alpha, lw) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r);
    ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r);
    ctx.stroke();
    ctx.restore();
  }

  function barcode(ctx, x, y, w, h, seed, color, alpha) {
    var rand = U.rng('aura' + seed);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    var cx = x;
    while (cx < x + w - 1) {
      var bw = Math.max(1, (0.18 + rand() * 0.55) * (w / 34));
      ctx.fillRect(cx, y, bw, h);
      cx += bw + Math.max(1, (0.22 + rand() * 0.5) * (w / 34));
    }
    ctx.restore();
  }

  /* ---------- the layout tables ---------- */

  /* every box is x, y, w, h in fractions of the stage */
  var TALL = {
    badge: { x: 0, y: 0, w: 0.115, h: 0.075 },
    head: { x: 0.2, y: 0.03 },
    /* the title starts well clear of the badge — at 0.095 the first line's
       capitals sat against the ring and read as one crowded object */
    title: { x: 0.015, y: 0.155, w: 0.64, h: 0.185 },
    script: { x: 0.015, y: 0.385, w: 0.4 },
    /* three windows, three sizes: the biggest is three and a half times
       the smallest. At 0.14 / 0.13 / 0.04 of the stage they were near
       enough the same area to read as a set of stamps */
    f1: { x: 0.52, y: 0.37, w: 0.48, h: 0.28, kind: 'oval' },
    f2: { x: 0, y: 0.615, w: 0.54, h: 0.225, kind: 'card' },
    f3: { x: 0.68, y: 0.825, w: 0.28, h: 0.145, kind: 'oct' },
    note: { x: 0.6, y: 0.685, w: 0.4 },
    foot: { x: 0, y: 0.885, w: 0.54 },
    bars: { x: 0, y: 0.955, w: 0.26, h: 0.035 },
    marks: { x: -0.045, y: 0.62, n: 5, step: 0.038 },
    /* the streamer starts off the top of the page, sweeps left over the
       head rule and comes down behind the display line — the type is drawn
       after it, so it passes behind the words rather than through them */
    ribbon: [[0.94, -0.3], [0.6, -0.19], [0.29, -0.01], [0.44, 0.2],
      [0.69, 0.4], [0.52, 0.62], [0.58, 0.85], [0.48, 1.1]],
    stars: [[0.51, 0.385, 0.085, 1], [0.03, 0.835, 0.055, 0], [0.96, 0.61, 0.028, 1]]
  };

  var WIDE = {
    badge: { x: 0, y: 0, w: 0.07, h: 0.115 },
    head: { x: 0.12, y: 0.045 },
    title: { x: 0.01, y: 0.19, w: 0.4, h: 0.34 },
    script: { x: 0.01, y: 0.6, w: 0.28 },
    f1: { x: 0.45, y: 0.0, w: 0.27, h: 0.62, kind: 'oval' },
    f2: { x: 0.75, y: 0.14, w: 0.25, h: 0.42, kind: 'card' },
    f3: { x: 0.5, y: 0.7, w: 0.17, h: 0.28, kind: 'oct' },
    note: { x: 0.74, y: 0.66, w: 0.26 },
    foot: { x: 0.01, y: 0.86, w: 0.38 },
    bars: { x: 0.2, y: 0.9, w: 0.1, h: 0.05 },
    marks: { x: -0.03, y: 0.5, n: 4, step: 0.07 },
    ribbon: [[0.82, -0.36], [0.63, -0.16], [0.45, 0.05], [0.36, 0.3],
      [0.45, 0.56], [0.36, 0.82], [0.42, 1.14]],
    stars: [[0.44, 0.06, 0.06, 1], [0.7, 0.86, 0.045, 0], [0.98, 0.06, 0.022, 1]]
  };

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content;
    var m = PO.margins(env), mic = PO.micro(env);
    var wide = env.tier === 'wide';

    /* two inks, as on a two-colour print: the page's own ink and the
       palette's accent, resolved so both read on the paper */
    var ink = pal.text;
    var accent = PO.accentOn(pal, pal.base);

    /* ---------- ground ---------- */
    ctx.fillStyle = pal.base;
    ctx.fillRect(0, 0, w, h);
    P.wash(ctx, w * 0.92, h * 0.08, env.S * 1.15, pal.soft[0], 0.8 * st.washStrength);
    P.wash(ctx, w * 0.06, h * 0.72, env.S * 1.1, pal.soft[1] || pal.soft[0], 0.7 * st.washStrength);
    P.wash(ctx, w * 0.62, h * 1.0, env.S * 0.95, pal.soft[0], 0.55 * st.washStrength);

    if (env.micro) {
      PO.headline(env, { x: m.left, y: env.band.top + (env.band.bottom - env.band.top) * 0.3, w: m.inner },
        { align: 'center', maxH: h * 0.34 });
      PO.microFoot(env, { m: m });
      return;
    }

    var L = wide ? WIDE : TALL;
    var S = {
      x: m.left, y: env.band.top,
      w: m.inner, h: env.band.bottom - env.band.top
    };
    function bx(f) { return S.x + S.w * f; }
    function by(f) { return S.y + S.h * f; }
    function box(b) {
      return { x: bx(b.x), y: by(b.y), w: S.w * b.w, h: S.h * (b.h || 0) };
    }

    var hair = Math.max(1, u(1.6));

    /* ---------- the three windows ---------- */
    var frames = [L.f1, L.f2, L.f3];
    /* three crops of the one photograph, so the same picture reads as
       three moments rather than one repeated three times */
    var crops = [
      { zoom: 1.12, ox: 0.38, oy: 0.34 },
      { zoom: 1.55, ox: 0.6, oy: 0.5 },
      { zoom: 1.3, ox: 0.44, oy: 0.68 }
    ];
    frames.forEach(function (b, i) {
      var fr = box(b);
      var kind = b.kind;
      if (env.hasPhoto) {
        W.photo.place(ctx, fr, shapeOf(kind), {
          tone: st.tone, toneAmount: U.clamp(st.toneAmount, 0, 1),
          brightness: st.brightness, contrast: st.contrast, saturation: st.saturation,
          blur: st.blur, duoDark: pal.duo[0], duoLight: pal.duo[1],
          inkColor: pal.duo[0], halftoneInvert: false,
          feather: st.feather, opacity: 1, blend: 'normal', overprint: 0,
          halftoneCells: st.halftoneCells,
          ox: crops[i].ox, oy: crops[i].oy, zoom: crops[i].zoom * st.zoom, rotate: 0
        }, pal);
      } else {
        ctx.save();
        framePath(ctx, kind, fr);
        ctx.clip();
        ctx.fillStyle = U.mix(pal.duo[0], pal.duo[1], 0.5);
        ctx.fillRect(fr.x, fr.y, fr.w, fr.h);
        P.wash(ctx, fr.x + fr.w * 0.3, fr.y + fr.h * 0.28, Math.max(fr.w, fr.h) * 0.95,
          pal.soft[0], 0.75 * st.washStrength);
        P.wash(ctx, fr.x + fr.w * 0.78, fr.y + fr.h * 0.8, Math.max(fr.w, fr.h) * 0.8,
          pal.soft[1] || pal.soft[0], 0.6 * st.washStrength);
        ctx.restore();
      }

      /* the double outline: a hairline on the shape and a second one just
         outside it, which is what makes a window read as a plate */
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = ink;
      ctx.lineWidth = hair;
      framePath(ctx, kind, fr);
      ctx.stroke();
      ctx.globalAlpha = 0.55;
      framePath(ctx, kind, { x: fr.x - u(9), y: fr.y - u(9), w: fr.w + u(18), h: fr.h + u(18) });
      ctx.stroke();
      ctx.restore();

      /* the plate number, inside the window's shoulder */
      ctx.save();
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.9;
      T.setFont(ctx, st.bodyFont, mic * 0.92, { weight: 500 });
      T.draw(ctx, '0' + (i + 1), fr.x + fr.w * (kind === 'oval' ? 0.18 : 0.09),
        fr.y + fr.h * (kind === 'oval' ? 0.2 : 0.16), { align: 'left', tracking: mic * 0.06 });
      ctx.restore();
      crosshair(ctx, fr.x + fr.w / 2, fr.y + fr.h / 2, mic * 0.62, ink, 0.6, Math.max(1, u(1.4)));
    });

    /* ---------- the ribbon, over the windows ----------
       Pastel, not the raw inks: an accent-to-ink gradient goes through mud
       on any warm palette, and the streamer has to stay luminous or it
       reads as a stain. It crosses the windows rather than passing behind
       them, which is the one thing that makes a page of separate plates
       read as one picture. */
    /* mixHex, not mix: the streamer's own gradient mixes these two again
       inside, and `mix` returns an rgb() string that the next mix cannot
       parse — which is why the first cut of this came out mud */
    /* On a deep page the same pastel mix lands as grey twice over: the
       duotone is already dark so white only takes it to slate, and the
       shaded face mixes toward a near-white ink, which flattens the crease
       away. So a deep page pulls the second stop toward the accent to hold
       a hue, and shades toward the ground rather than toward the ink. */
    var deep = U.luma(pal.base) < 0.42;
    var warm = U.mixHex(pal.duo[0], accent, deep ? 0.55 : 0.2);
    var shade = deep ? pal.base : ink;
    ribbon(ctx, L.ribbon.map(function (q) { return { x: bx(q[0]), y: by(q[1]) }; }),
      Math.min(S.w, S.h) * 0.062,
      [U.mixHex(accent, '#ffffff', deep ? 0.28 : 0.2),
        U.mixHex(warm, '#ffffff', deep ? 0.5 : 0.42)],
      [U.mixHex(accent, shade, deep ? 0.46 : 0.42),
        U.mixHex(warm, shade, deep ? 0.4 : 0.34)], 0.88);

    /* ---------- the stars ---------- */
    L.stars.forEach(function (s) {
      gradStar(ctx, bx(s[0]), by(s[1]), S.w * s[2],
        s[3] ? accent : U.mix(ink, accent, 0.2),
        s[3] ? U.mix(accent, ink, 0.45) : ink, 0.92, s[2] < 0.03 ? 4 : 8);
    });

    /* ---------- the badge ---------- */
    var bd = box(L.badge);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = accent;
    ctx.lineWidth = hair;
    ctx.beginPath();
    ctx.ellipse(bd.x + bd.w / 2, bd.y + bd.h / 2, bd.w / 2, bd.h / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    /* the year off the footnote if there is one in it, the pair's initials
       if there is not — the badge always says something true */
    var year = (c.footnote || '').match(/(\d{2})(\d{2})/);
    var mono = W.textstack.monogram(st) || 'PT';
    var b1 = year ? year[1] : (mono.replace(/[^A-Za-z]/g, '').charAt(0) || 'P');
    var b2 = year ? year[2] : (mono.replace(/[^A-Za-z]/g, '').charAt(1) || 'T');
    ctx.fillStyle = accent;
    ctx.globalAlpha = 1;
    var bs = Math.min(bd.h * 0.34, bd.w * 0.44);
    T.setFont(ctx, st.bodyFont, bs, { weight: 500 });
    T.draw(ctx, b1, bd.x + bd.w / 2, bd.y + bd.h * 0.46, { align: 'center', tracking: bs * 0.06 });
    T.draw(ctx, b2, bd.x + bd.w / 2, bd.y + bd.h * 0.84, { align: 'center', tracking: bs * 0.06 });
    ctx.restore();

    /* ---------- the head rule ---------- */
    var hy = by(L.head.y);
    var hx0 = bx(L.head.x);
    ctx.save();
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.85;
    T.setFont(ctx, st.bodyFont, mic * 0.86, { weight: 500 });
    var hw = T.measure(ctx, 'pairtone', mic * 0.18);
    T.draw(ctx, 'pairtone', S.x + S.w, hy + mic * 0.3, { align: 'right', tracking: mic * 0.18 });
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1, u(1.3));
    ctx.beginPath();
    ctx.moveTo(hx0 + mic * 1.2, hy);
    ctx.lineTo(S.x + S.w - hw - mic * 0.8, hy);
    ctx.stroke();
    ctx.restore();
    gradStar(ctx, hx0, hy, mic * 0.62, accent, U.mix(accent, ink, 0.4), 0.95, 8);

    /* ---------- the title ---------- */
    var tb = box(L.title);
    var raw = (c.title || c.names || 'pairtone').replace(/\s+/g, ' ').trim().toUpperCase();
    var words = raw.split(' ').filter(Boolean);
    var rows = words.length >= 3 ? 3 : words.length;
    var lines = [];
    var per = Math.ceil(words.length / Math.max(1, rows));
    for (var wi = 0; wi < words.length; wi += per) lines.push(words.slice(wi, wi + per).join(' '));

    /* one size for every line, chosen against the widest of them and
       against the height the table gives the block — flush left, ragged
       right, the way the reference sets it */
    var em = st.headlineScale || 1;
    var tsize = u(600);
    lines.forEach(function (ln) {
      tsize = Math.min(tsize, T.fill(ctx, ln, st.titleFont, tb.w * em, -0.01, { weight: 500 }, u(600)));
    });
    var lead = tsize * 0.86;
    if (lines.length * lead > tb.h) {
      tsize *= tb.h / (lines.length * lead);
      lead = tsize * 0.86;
    }
    T.setFont(ctx, st.titleFont, tsize, { weight: 500 });
    var tink = T.inkBox(ctx, 'H');
    ctx.save();
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.95;
    lines.forEach(function (ln, i) {
      T.setFont(ctx, st.titleFont, tsize, { weight: 500 });
      T.draw(ctx, ln, tb.x, tb.y + tink.asc + i * lead, { align: 'left', tracking: tsize * -0.01 });
    });
    ctx.restore();

    /* ---------- the script line ---------- */
    if (c.caption) {
      var sb = box(L.script);
      var ssize = mic * 1.32;
      var srows;
      for (var si = 0; si < 26; si++) {
        T.setFont(ctx, st.scriptFont, ssize, {});
        srows = T.wrap(ctx, c.caption, sb.w, 0);
        if (srows.length <= 3) break;
        ssize *= 0.94;
      }
      srows = srows.slice(0, 3);
      ctx.save();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.95;
      srows.forEach(function (r, i) {
        T.setFont(ctx, st.scriptFont, ssize, {});
        T.draw(ctx, r, sb.x, sb.y + ssize * (0.9 + i * 1.12), { align: 'left', tracking: 0 });
      });
      ctx.restore();
    }

    /* ---------- the note beside the second window ---------- */
    var nb = box(L.note);
    var ny = nb.y;
    if (st.showNames && c.names) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(1, u(1.4));
      ctx.beginPath();
      ctx.moveTo(nb.x, ny);
      ctx.lineTo(nb.x, ny + mic * 2.6);
      ctx.stroke();
      ctx.restore();
      ny += PO.block(env, nb.x + mic * 0.7, ny, nb.w - mic * 0.7, [c.names], {
        size: mic * 1.05, lead: 1.35, upper: false, alpha: 0.92, color: ink,
        font: st.bodyFont, weight: 500, tracking: 0.01
      }) + mic * 0.9;
    }
    if (st.showTags && c.tags.length) {
      PO.block(env, nb.x + mic * 0.7, ny, nb.w - mic * 0.7,
        [c.tags.map(function (t) { return t.toLowerCase(); }).join(', ')], {
          size: mic * 0.92, lead: 1.4, upper: false, alpha: 0.95, color: accent,
          font: st.bodyFont, tracking: 0.01
        });
    }

    /* ---------- the foot ---------- */
    var fb = box(L.foot);
    if (c.footnote) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, u(1.4));
      ctx.beginPath();
      ctx.moveTo(fb.x, fb.y);
      ctx.lineTo(fb.x, fb.y + mic * 1.5);
      ctx.stroke();
      ctx.restore();
      PO.block(env, fb.x + mic * 0.7, fb.y, fb.w - mic * 0.7, [c.footnote], {
        size: mic * 0.95, lead: 1.4, upper: false, alpha: 0.9, color: ink,
        font: st.bodyFont, tracking: 0.02
      });
    }
    var bb = box(L.bars);
    barcode(ctx, bb.x, bb.y, bb.w, bb.h, st.seed, ink, 0.8);

    /* ---------- the row of crosses in the margin ---------- */
    for (var k = 0; k < L.marks.n; k++) {
      crossMark(ctx, bx(L.marks.x), by(L.marks.y + k * L.marks.step), mic * 0.34,
        accent, 0.8, Math.max(1, u(1.6)));
    }

    /* ---------- optional scatter, clear of everything ---------- */
    if (env.decoBudget) {
      var avoid = [box(L.title), box(L.note), box(L.foot)];
      frames.forEach(function (b) {
        var fr = box(b);
        avoid.push({ x: fr.x - u(14), y: fr.y - u(14), w: fr.w + u(28), h: fr.h + u(28) });
      });
      D.scatter(env, {
        avoid: avoid, kinds: st.motifs, colors: [ink, accent],
        hero: accent, rMin: 16, rMax: 34, bigRatio: 0.2, stratify: true,
        /* This page has six keep-out zones, so a stratified field runs out
           of room and the sampler relaxes its way down to the floor —
           measured at 0.53 of the summed radii on a 16-inch canvas. Asking
           for 1.3x the radii means even the last relaxed pass still leaves
           0.8x, which is clear of anything the eye reads as touching. */
        sep: 1.3,
        alphaMin: 0.45, alphaMax: 0.9, pad: u(50)
      });
    }
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'aura',
    label: 'Aura',
    blurb: '커다란 제목 + 번호 붙은 사진창 3개 + 리본과 별. 포스터처럼.',
    deco: true,
    type: ['titleFont', 'scriptFont', 'bodyFont', 'headlineScale', 'microScale'],
    defaults: {
      titleFont: 'didone', scriptFont: 'petitformal', bodyFont: 'familjen',
      headlineStyle: 'stack',
      photoShape: 'rect', tone: 'wash', toneAmount: 0.42,
      feather: 0, decoCount: 0, motifs: ['sparkle'],
      grain: 1.1, vignette: 0.04
    },
    draw: draw
  });
})(window.PT = window.PT || {});
