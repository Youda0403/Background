/* GRID — a crossword of highlighted cells spelling your words, laid over
   a full-bleed monochrome photo. The most deniable of the set: it reads
   as a typographic experiment.
   Reference grammar: lyric-crossword and modular type posters. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  /* Pack words into rows of at most `cols` cells, one cell per glyph and
     one blank cell between words. */
  function packRows(sources, cols) {
    var rows = [];
    sources.forEach(function (src, gi) {
      var words = String(src || '').split(/\s+/).filter(Boolean);
      if (!words.length) return;
      var cur = [];
      var curLen = 0;
      words.forEach(function (raw) {
        var word = raw.replace(/[^\p{L}\p{N}'&×♡+·/-]/gu, '').toUpperCase();
        if (!word) return;
        if (word.length > cols) word = word.slice(0, cols);
        var need = curLen ? curLen + 1 + word.length : word.length;
        if (need > cols && cur.length) {
          rows.push({ words: cur, len: curLen, group: gi });
          cur = [word]; curLen = word.length;
        } else {
          cur.push(word); curLen = need;
        }
      });
      if (cur.length) rows.push({ words: cur, len: curLen, group: gi });
      rows.push(null);   /* blank spacer row between groups */
    });
    while (rows.length && rows[rows.length - 1] === null) rows.pop();
    return rows;
  }

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content, rand = env.rand;

    PO.paper(env);
    var m = PO.margins(env);
    var mic = PO.micro(env);

    /* ---- plate ---- */
    var top = m.top + mic * 2.2;
    var bottom = h - m.bottom - mic * 2.6;
    var plate = { x: m.left, y: top, w: m.inner, h: bottom - top };

    if (env.hasPhoto) {
      env.drawPhoto(plate);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.5 * st.washStrength;
      ctx.fillStyle = pal.soft[0];
      ctx.fillRect(plate.x, plate.y, plate.w, plate.h);
      ctx.restore();
    }

    /* ---- lattice ---- */
    var cols = env.tier === 'wide' ? 16 : env.tier === 'tablet' || env.tier === 'square' ? 11 : 9;
    var cell = plate.w / cols;
    /* Row count from the plate's proportions, computed so it cannot flip
       between the preview and the export. */
    var rowsFit = Math.max(4, Math.floor((plate.h / plate.w) * cols + 1e-4));
    var gridH = rowsFit * cell;
    var gy = plate.y + (plate.h - gridH) / 2;

    ctx.save();
    ctx.globalAlpha = 0.42 * env.decoAlpha;
    ctx.strokeStyle = pal.text;
    ctx.lineWidth = Math.max(1, u(1.1));
    ctx.beginPath();
    for (var i = 0; i <= cols; i++) {
      ctx.moveTo(plate.x + i * cell, gy);
      ctx.lineTo(plate.x + i * cell, gy + gridH);
    }
    for (var j = 0; j <= rowsFit; j++) {
      ctx.moveTo(plate.x, gy + j * cell);
      ctx.lineTo(plate.x + plate.w, gy + j * cell);
    }
    ctx.stroke();
    ctx.restore();

    /* ---- words into cells ---- */
    var sources = [c.title];
    if (st.showNames && c.names) sources.push(c.names);
    if (c.caption && !env.micro) sources.push(c.caption);

    /* Drop whole phrases until the block fits — a sentence cut off
       mid-word looks like a bug rather than a decision. */
    var rows = packRows(sources, cols);
    while (rows.length > rowsFit && sources.length > 1) {
      sources.pop();
      rows = packRows(sources, cols);
    }
    if (rows.length > rowsFit) rows = rows.slice(0, rowsFit);

    /* sit the block a little above centre, like the reference */
    var startRow = Math.max(0, Math.round((rowsFit - rows.length) * 0.36));
    var hi = pal.inks[2] || pal.inks[0];
    var letterInk = U.onColor(hi) === '#1a1a1a' ? '#1a1a1a' : '#f7f7f5';

    ctx.save();
    rows.forEach(function (row, ri) {
      if (!row) return;
      var r = startRow + ri;
      if (r >= rowsFit) return;
      /* alternate the run's anchor so the block interlocks */
      var slack = cols - row.len;
      var mode = Math.floor(rand() * 3);
      var col = slack <= 0 ? 0 : mode === 0 ? 0 : mode === 1 ? slack : Math.round(slack / 2);
      var cy = gy + r * cell;

      row.words.forEach(function (word, wi) {
        if (wi) col += 1;
        for (var k = 0; k < word.length && col < cols; k++, col++) {
          var cx = plate.x + col * cell;
          ctx.globalAlpha = 0.92;
          ctx.fillStyle = hi;
          ctx.fillRect(cx + u(0.6), cy + u(0.6), cell - u(1.2), cell - u(1.2));

          var size = cell * 0.6;
          T.setFont(ctx, st.bodyFont, size, { weight: 500 });
          ctx.globalAlpha = 1;
          ctx.fillStyle = letterInk;
          ctx.textBaseline = 'middle';
          var gw = ctx.measureText(word[k]).width;
          ctx.fillText(word[k], cx + cell / 2 - gw / 2, cy + cell * 0.54);
        }
      });
    });
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.5 * env.decoAlpha;
    ctx.strokeStyle = pal.text;
    ctx.lineWidth = Math.max(1, u(1.4));
    ctx.strokeRect(plate.x, plate.y, plate.w, plate.h);
    ctx.restore();

    /* ---- rails ---- */
    PO.rail(env, m.top + mic, ['“' + (c.title || 'pairtone') + '”', null, c.names || c.footnote],
      { m: m, size: mic, alpha: 0.8, font: st.bodyFont });
    PO.rail(env, h - m.bottom + mic * 0.1, [null, c.footnote, null],
      { m: m, size: mic * 0.9, alpha: 0.7 });
    PO.tagRail(env, h - m.bottom - mic * 1.2, { m: m, size: mic * 0.88, alpha: 0.55 });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'grid',
    label: 'Grid',
    blurb: '글자를 격자 칸에 채운 타이포 포스터. 일코 최강.',
    defaults: {
      photoShape: 'rect', photoRatio: 'free', tone: 'mono', toneAmount: 1,
      feather: 0, motifs: ['sparkle'],
      decoDensity: 0, vignette: 0.06, grain: 1.2
    },
    draw: draw
  });
})(window.PT = window.PT || {});
