/* SPINE — the pair name set as one justified block over a full-bleed
   field, closed by a solid accent square, with the two names tracked out
   beneath it to the same measure; then a ruled strip of numbered cells.

   The previous version laid the name out as a table of single letters —
   one letter per cell, a fixed number of columns per aspect tier. That
   guaranteed even spacing and nothing else. A four-letter name was broken
   across two rows for no reason, every letter floated alone in a cell far
   wider than itself, and the per-row weight ramp read as the second line
   being set in a different font. Even, but not a word.

   What replaces it takes the evenness from the edges instead of from the
   cells. Every line is **justified to the same measure**, so the block is
   a true rectangle: one left edge, one right edge, one size, one weight.
   The name is never broken inside a word — the lines are whole words,
   split by a balancer that minimises the widest line, so the tracking
   needed to justify stays small and the block reads as one mass.

   The number of lines is not fixed. It is the largest that still fits the
   band, which is what lets the same design carry a two-letter name and a
   four-word one: a short name comes out as one line at full width, a long
   one stacks until the block fills the page. A one-word name is always one
   line, however tall the band is — filling space is not a reason to cut a
   word in half.

   The block is anchored to the foot, so it grows upward and the picture
   keeps the top of the page whatever the name does. The names line is set
   to the same measure underneath, which is what stops a short title from
   leaving the lockup stranded, and the accent square closes the last line
   as if it were the final glyph — the palette gets area to land on, and it
   lands inside the type rather than beside it. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  var REF = 200;              /* the size natural widths are measured at */
  var TITLE_WEIGHT = 500;

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content;
    var mic = PO.micro(env);
    var m = PO.margins(env);

    /* THE spacing unit. Every gap on this page is g or a multiple. */
    var g = U.clamp(m.inner * 0.035, u(14), u(46));

    /* ---------- the ground ---------- */
    var deep = U.mix(pal.duo[0], pal.duo[1], 0.32);
    if (env.hasPhoto) {
      env.drawPhoto({ x: 0, y: 0, w: w, h: h });
    } else {
      /* The block is anchored to the foot, so on a one-word name the open
         half of the page is the top. That is where a field with no
         photograph in it needs its incident — washes placed low would sit
         behind the type and leave the void flat. */
      ctx.fillStyle = U.mix(pal.duo[0], pal.base, 0.22);
      ctx.fillRect(0, 0, w, h);
      P.wash(ctx, w * 0.28, h * 0.22, env.S * 1.05, pal.soft[0], 0.62 * st.washStrength);
      P.wash(ctx, w * 0.82, h * 0.46, env.S * 0.9, pal.soft[1] || pal.soft[0], 0.5 * st.washStrength);
    }

    ctx.save();
    ctx.globalAlpha = U.clamp(0.18 + st.scrim * 0.5, 0.18, 0.6);
    ctx.fillStyle = deep;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    /* The veil is weighted to the two ends, where the rail and the cells
       are set and an uploaded photograph is as likely to be sky as it is
       to be shadow. The middle is left alone: that is where the picture
       should still be a picture. */
    if (env.hasPhoto) {
      ctx.save();
      var top = ctx.createLinearGradient(0, 0, 0, h * 0.3);
      top.addColorStop(0, U.rgba(deep, 0.42));
      top.addColorStop(1, U.rgba(deep, 0));
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, w, h * 0.3);
      var bot = ctx.createLinearGradient(0, h * 0.55, 0, h);
      bot.addColorStop(0, U.rgba(deep, 0));
      bot.addColorStop(1, U.rgba(deep, 0.6));
      ctx.fillStyle = bot;
      ctx.fillRect(0, h * 0.55, w, h * 0.45);
      ctx.restore();
    }

    var onField = U.onColor(deep);
    var accent = PO.accentOn(pal, deep);

    var initials = W.textstack.monogram(st) || 'PT';
    var namesLine = (st.showNames && c.names) ? c.names.toUpperCase() : '';
    var titleRaw = (c.title || 'pairtone').replace(/\s+/g, ' ').trim();
    var words = titleRaw.toUpperCase().split(' ').filter(Boolean);
    if (!words.length) words = ['PAIRTONE'];

    /* ---------- the foot, measured before the block is given its band --- */
    var cells = [];
    if (c.caption) cells.push(c.caption);
    if (c.footnote) cells.push(c.footnote);
    if (st.showTags && c.tags.length) {
      cells.push(c.tags.map(function (t) { return '(' + t.toLowerCase() + ')'; }).join('  '));
    }
    if (!cells.length && namesLine) cells.push(namesLine);
    if (!cells.length) cells.push(titleRaw);
    cells = cells.slice(0, 3);

    var n = cells.length;
    var footCellW = (m.inner - g * (n - 1)) / n;
    var footBodyH = 0;
    if (!env.micro) {
      cells.forEach(function (body) {
        footBodyH = Math.max(footBodyH, PO.block(env, 0, 0, footCellW, [body], {
          size: mic * 0.78, lead: 1.5, upper: false, measure: true, font: st.bodyFont
        }));
      });
    }
    var footH = env.micro ? 0 : mic * 1.9 + footBodyH;
    var footTop = h - m.bottom - footH;

    var bandTop = m.top + (env.micro ? mic * 0.8 : mic * 1.9) + g;
    var bandBottom = env.micro ? h - m.bottom - mic * 1.8 : footTop - g * 1.6;

    /* ---------- the names line, set to the measure ---------- */
    var nameSize = mic * 1.05;
    var nameTrack = 0, nameCap = 0, namesH = 0;
    var showNamesLine = !!namesLine && !env.micro;
    if (showNamesLine) {
      T.setFont(ctx, st.bodyFont, nameSize, { weight: 500 });
      var natural = T.measure(ctx, namesLine, 0);
      nameTrack = namesLine.length > 1
        ? U.clamp((m.inner - natural) / (namesLine.length - 1), 0, nameSize * 2.4) : 0;
      nameCap = T.inkBox(ctx, namesLine).asc;
      namesH = nameCap + g * 1.3;
    }

    var titleBottom = bandBottom - namesH;
    var titleBand = Math.max(titleBottom - bandTop, u(70));

    /* ---------- natural widths, measured once at a reference size ------- */
    T.setFont(ctx, st.titleFont, REF, { weight: TITLE_WEIGHT });
    var capAt1 = T.inkBox(ctx, 'H').asc / REF;
    var spaceAt1 = ctx.measureText(' ').width / REF;
    var wordAt1 = words.map(function (s) { return T.measure(ctx, s, 0) / REF; });

    function segAt1(i, j) {
      var t = 0;
      for (var k = i; k < j; k++) { t += wordAt1[k]; if (k > i) t += spaceAt1; }
      return t;
    }

    /* Split the words into L lines so the WIDEST line is as narrow as it
       can be. Balanced lines are what keep the justification tracking
       small, and small tracking is what makes the block read as a word
       rather than as letters that happen to share a row. The final line
       carries the accent square, so it is measured one cap wider. */
    function balance(L) {
      var memo = {};
      function best(i, k) {
        var key = i + '|' + k;
        if (memo[key]) return memo[key];
        if (k === 1) return (memo[key] = { max: segAt1(i, words.length) + capAt1, cuts: [words.length] });
        var out = null;
        for (var j = i + 1; j <= words.length - (k - 1); j++) {
          var sub = best(j, k - 1);
          var mx = Math.max(segAt1(i, j), sub.max);
          if (!out || mx < out.max) out = { max: mx, cuts: [j].concat(sub.cuts) };
        }
        return (memo[key] = out);
      }
      var r = best(0, L);
      if (!r) return null;
      var lines = [], prev = 0;
      r.cuts.forEach(function (cut) { lines.push(words.slice(prev, cut).join(' ')); prev = cut; });

      /* How hard each line has to be stretched to reach the measure, as a
         fraction of the type size. Fitting the band is not enough on its
         own: three words give three lines, and a two-letter word like "of"
         alone on a line has one gap to absorb the whole shortfall, which
         blows it apart. Two balanced lines are better than three ragged
         ones, so an arrangement that needs more than half an em of
         tracking anywhere is not offered. */
      var worst = 0;
      T.setFont(ctx, st.titleFont, REF, { weight: TITLE_WEIGHT });
      lines.forEach(function (line, i) {
        var isLast = i === lines.length - 1;
        var natural = T.measure(ctx, line, 0) / REF + (isLast ? capAt1 : 0);
        var gaps = line.length - (isLast ? 0 : 1);
        if (gaps <= 0) { if (natural < r.max * 0.98) worst = Infinity; return; }
        worst = Math.max(worst, (r.max - natural) / gaps);
      });
      return { lines: lines, max: r.max, stretch: worst };
    }

    /* More lines means shorter lines, which means a larger shared size and
       a taller block — both monotonic — so the best arrangement is simply
       the largest line count that still fits the band. A single word can
       only ever be one line: filling space is not a reason to cut a word
       in half, which is how a four-letter name ended up broken in two. */
    var maxL = Math.min(words.length, env.micro ? 2 : 4);
    var pick = null;
    for (var L = 1; L <= maxL; L++) {
      var b = balance(L);
      if (!b) break;
      var size = m.inner / b.max;
      var capH = capAt1 * size;
      var lineH = capH * 1.26;
      var blockH = capH + (L - 1) * lineH;
      var ok = blockH <= titleBand && b.stretch <= 0.5;
      if (L === 1 || ok) pick = { lines: b.lines, size: size, capH: capH, lineH: lineH, h: blockH };
      if (L > 1 && blockH > titleBand) break;
    }

    /* only a single line can overflow the band — nothing shorter to fall
       back to, so it gives up width instead */
    if (pick.h > titleBand) {
      var k = titleBand / pick.h;
      pick.size *= k; pick.capH *= k; pick.lineH *= k; pick.h = titleBand;
    }

    /* ---------- the block ---------- */
    var square = pick.capH;
    var last = pick.lines.length - 1;
    T.setFont(ctx, st.titleFont, pick.size, { weight: TITLE_WEIGHT });

    pick.lines.forEach(function (line, i) {
      var isLast = i === last;
      T.setFont(ctx, st.titleFont, pick.size, { weight: TITLE_WEIGHT });
      var natW = T.measure(ctx, line, 0) + (isLast ? square : 0);
      var gaps = line.length - (isLast ? 0 : 1);
      var track = gaps > 0 ? U.clamp((m.inner - natW) / gaps, 0, pick.size * 0.9) : 0;
      var base = titleBottom - (last - i) * pick.lineH;

      ctx.save();
      ctx.fillStyle = onField;
      ctx.globalAlpha = 0.96;
      T.setFont(ctx, st.titleFont, pick.size, { weight: TITLE_WEIGHT });
      T.draw(ctx, line, m.left, base, { align: 'left', tracking: track });
      ctx.restore();

      if (!isLast) return;
      /* the accent square, set as the final glyph of the last line: same
         height as the capitals, sitting on the same baseline */
      T.setFont(ctx, st.titleFont, pick.size, { weight: TITLE_WEIGHT });
      var sx = m.left + T.measure(ctx, line, track) + track;
      ctx.save();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.95;
      ctx.fillRect(sx, base - square, square, square);
      ctx.restore();

      var iSize = T.fit(ctx, initials, st.titleFont, square * 0.4, square * 0.72, 0.04, { weight: 700 });
      T.setFont(ctx, st.titleFont, iSize, { weight: 700 });
      var iInk = T.inkBox(ctx, initials);
      ctx.save();
      ctx.fillStyle = U.onColor(accent);
      T.draw(ctx, initials, sx + square / 2, base - square / 2 + (iInk.asc - iInk.desc) / 2,
        { align: 'center', tracking: iSize * 0.04 });
      ctx.restore();
    });

    if (showNamesLine) {
      ctx.save();
      ctx.fillStyle = onField;
      ctx.globalAlpha = 0.85;
      T.setFont(ctx, st.bodyFont, nameSize, { weight: 500 });
      T.draw(ctx, namesLine, m.left, bandBottom, { align: 'left', tracking: nameTrack });
      ctx.restore();
    }

    if (env.micro) {
      PO.microFoot(env, { m: m, color: onField });
      return;
    }

    /* ---------- furniture ---------- */
    PO.rail(env, m.top + mic * 1.0, [initials, null, 'pairtone'],
      { m: m, size: mic * 0.76, alpha: 0.7, color: onField });

    /* A ceiling on the same measure as the foot rule. A short name leaves
       the top of the page open by design, and two rules turn that opening
       into a framed field instead of into the space left over after the
       type was placed. */
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = onField;
    ctx.lineWidth = Math.max(1, u(1.2));
    ctx.beginPath();
    ctx.moveTo(m.left, bandTop);
    ctx.lineTo(w - m.right, bandTop);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(1, u(2.5));
    ctx.beginPath();
    ctx.moveTo(m.left, footTop);
    ctx.lineTo(w - m.right, footTop);
    ctx.stroke();
    ctx.restore();

    cells.forEach(function (body, i) {
      var x = m.left + (footCellW + g) * i;
      ctx.save();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.95;
      T.setFont(ctx, 'dmmono', mic * 0.68, {});
      T.draw(ctx, '0' + (i + 1), x, footTop + mic * 1.3, { align: 'left', tracking: mic * 0.08 });
      ctx.restore();
      PO.block(env, x, footTop + mic * 1.9, footCellW, [body], {
        size: mic * 0.78, lead: 1.5, upper: false, alpha: 0.8,
        font: st.bodyFont, color: onField
      });
    });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'spine',
    label: 'Spine',
    blurb: '페어명을 폭에 꽉 맞춘 한 덩어리로 짜고, 사진은 배경으로 꽉 채워요. 이름이 길든 짧든 좌우가 딱 맞습니다.',
    defaults: {
      titleFont: 'didone', scriptFont: 'delafield', bodyFont: 'spacegrotesk',
      headlineStyle: 'stack',
      photoShape: 'rect', tone: 'duo', toneAmount: 0.95,
      feather: 0, scrim: 0.3, motifs: ['sparkle'], decoCount: 0,
      grain: 1.5, vignette: 0.12
    },
    draw: draw
  });
})(window.PT = window.PT || {});
