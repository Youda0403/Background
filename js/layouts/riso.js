/* RISO — overprinted colour blocks, torn edges, poster furniture.
   Looks like an exhibition flyer, which is exactly the cover we want. */
(function (W) {
  'use strict';
  var P = W.prim, U = W.util, D = W.deco, TS = W.textstack, C = W.compose, T = W.type;

  /* Rough, hand-cut edge. */
  function torn(ctx, x, y, w, h, rand, amp) {
    var step = Math.max(6, Math.min(w, h) / 14);
    ctx.beginPath();
    var px = x, py = y;
    ctx.moveTo(px, py);
    function edge(tx, ty, n) {
      for (var i = 1; i <= n; i++) {
        var t = i / n;
        var ox = (rand() - 0.5) * amp, oy = (rand() - 0.5) * amp;
        ctx.lineTo(px + (tx - px) * t + ox, py + (ty - py) * t + oy);
      }
      px = tx; py = ty;
    }
    var n1 = Math.max(3, Math.round(w / step));
    var n2 = Math.max(3, Math.round(h / step));
    edge(x + w, y, n1);
    edge(x + w, y + h, n2);
    edge(x, y + h, n1);
    edge(x, y, n2);
    ctx.closePath();
  }

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, rand = env.rand;

    ctx.fillStyle = pal.base;
    ctx.fillRect(0, 0, w, h);

    var g = C.place(env, {
      margin: 104,
      widthFrac: { tall: 0.74, phone: 0.76, tablet: 0.62, square: 0.68, wide: 0.44 },
      gap: 92,
      bias: 0.34,
      align: 'left',
      textFrac: 0.78
    });

    /* --- overprint blocks --- */
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';

    /* full-bleed band: vertical on portrait, horizontal on wide */
    ctx.globalAlpha = 0.85 * st.washStrength;
    ctx.fillStyle = pal.soft[0];
    if (env.tier === 'wide') {
      ctx.fillRect(0, h * 0.18, w, h * 0.46);
    } else {
      ctx.fillRect(w * 0.30, 0, w * 0.44, h);
    }

    /* two offset panels */
    ctx.globalAlpha = 0.7 * st.washStrength;
    ctx.fillStyle = pal.soft[1] || pal.inks[1];
    var b1 = env.tier === 'wide'
      ? { x: w * 0.04, y: h * 0.06, w: w * 0.3, h: h * 0.3 }
      : { x: w * 0.02, y: h * 0.05, w: w * 0.44, h: h * 0.17 };
    torn(ctx, b1.x, b1.y, b1.w, b1.h, rand, u(9));
    ctx.fill();

    ctx.globalAlpha = 0.6 * st.washStrength;
    ctx.fillStyle = pal.soft[2] || pal.inks[3];
    var b2 = env.tier === 'wide'
      ? { x: w * 0.7, y: h * 0.6, w: w * 0.28, h: h * 0.34 }
      : { x: w * 0.56, y: h * 0.74, w: w * 0.46, h: h * 0.2 };
    torn(ctx, b2.x, b2.y, b2.w, b2.h, rand, u(9));
    ctx.fill();
    ctx.restore();

    /* --- photo panel --- */
    if (g.photo) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = pal.inks[0];
      var off = u(16);
      ctx.fillRect(g.photo.x + off, g.photo.y + off, g.photo.w, g.photo.h);
      ctx.restore();
      env.drawPhoto(g.photo);
    }

    /* --- poster rules around the type --- */
    var tw = g.text.w, tx = g.text.x, ty = g.text.y;
    ctx.save();
    ctx.globalAlpha = 0.85 * env.decoAlpha;
    ctx.strokeStyle = pal.text;
    ctx.lineWidth = Math.max(1, u(2.6));
    ctx.beginPath();
    ctx.moveTo(tx, ty - u(34));
    ctx.lineTo(tx + tw, ty - u(34));
    ctx.stroke();
    ctx.restore();

    TS.drawStack(env, g.text, {});

    /* --- credit block, bottom edge --- */
    var credits = env.content.tags.slice(0, 3);
    if (st.showTags && credits.length) {
      var size = u(st.bodySize) * 0.46 * U.lerp(0.88, 1, env.emphasis);
      ctx.save();
      ctx.fillStyle = pal.text;
      ctx.globalAlpha = 0.75;
      T.setFont(ctx, 'mono', size, {});
      var cy = h - u(96);
      credits.forEach(function (line, i) {
        T.draw(ctx, line.toUpperCase(), u(104), cy + i * size * 1.7,
          { align: 'left', tracking: size * 0.14 });
      });
      /* register mark */
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = pal.inks[1];
      ctx.fillRect(w - u(140), cy - size, u(36), u(36));
      ctx.restore();
    }

    /* --- silver / ink stars over the print --- */
    D.scatter(env, {
      count: 14, avoid: g.avoid, kinds: st.motifs, colors: pal.inks,
      rMin: 14, rMax: 30, bigRatio: 0.3, minDist: 110,
      alphaMin: 0.55, alphaMax: 1, outlineRatio: 0.15, lineW: 3,
      speckle: st.glitter
    });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'riso',
    label: 'Riso',
    blurb: '리소 인쇄 포스터 무드. 전시 굿즈처럼 보여요.',
    defaults: { photoShape: 'rect', tone: 'duo', feather: 0, paperStyle: 'none', auraShape: 'none', overprint: 0.5 },
    draw: draw
  });
})(window.PT = window.PT || {});
