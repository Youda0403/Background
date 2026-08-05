/* COLUMN — a receipt, printed on a slip of torn paper and laid on the
   photograph.

   It used to be a dictionary column: a plain rectangle of paper with a
   headword, an etymology and a caption. The idea was right — a piece of
   real paper on a real photograph — but a rectangle full of paragraphs is
   a panel, not an object, and it had to lean on scattered motifs to stop
   the rest of the page reading as empty. Motifs are decoration; a slip of
   paper with a torn top and bottom edge, a barcode and a total is a
   THING, and things need no sprinkles around them.

   The receipt is also the only form of small type everybody can already
   read. It has a header, a rule, a column of items with dotted leaders, a
   total, a memo and a footer, and every one of those slots wants exactly
   what this app already collects: the pair name is the shop, the two
   names are the items, the tags are the extras, the caption is the memo,
   the footnote is the line at the foot of the ticket.

   Everything is measured before anything is drawn: the slip is exactly as
   tall as its own contents, and if the contents cannot fit the band the
   whole ticket is set one notch smaller rather than overflowing. */
(function (W) {
  'use strict';
  var U = W.util, P = W.prim, PO = W.poster, T = W.type;

  /* The slip: a rectangle whose top and bottom edges are torn into teeth.
     The teeth eat `tooth` into the paper at each end, so the printable
     area starts at y + tooth and ends at y + h - tooth. */
  function slipPath(ctx, x, y, w, h, tooth) {
    var n = Math.max(6, Math.round(w / (tooth * 1.9)));
    var step = w / n, i;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (i = 0; i < n; i++) {
      ctx.lineTo(x + step * (i + 0.5), y + tooth);
      ctx.lineTo(x + step * (i + 1), y);
    }
    ctx.lineTo(x + w, y + h);
    for (i = n; i > 0; i--) {
      ctx.lineTo(x + step * (i - 0.5), y + h - tooth);
      ctx.lineTo(x + step * (i - 1), y + h);
    }
    ctx.closePath();
  }

  function hair(ctx, x, w, y, weight, color, alpha, dash) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.restore();
  }

  /* The dotted leader between a line item and its figure. */
  function leader(ctx, x1, x2, y, size, color, alpha) {
    if (x2 - x1 < size * 1.4) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    var gap = size * 0.5, r = Math.max(0.7, size * 0.05);
    for (var x = x1 + gap; x < x2 - gap * 0.5; x += gap) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* One size for every line item, chosen so the longest of them clears its
     figure. Fitting each row on its own would set a two-letter name larger
     than a six-letter one, which is the one thing a receipt never does. */
  function rowSize(ctx, rows, size, wIn, min) {
    var s = size;
    for (var i = 0; i < 60; i++) {
      T.setFont(ctx, 'dmmono', s, {});
      var ok = true;
      for (var k = 0; k < rows.length; k++) {
        var need = T.measure(ctx, rows[k][0], s * 0.02)
          + T.measure(ctx, rows[k][1], s * 0.02) + s * 2.4;
        if (need > wIn) { ok = false; break; }
      }
      if (ok || s <= min) break;
      s *= 0.96;
    }
    return Math.max(s, min);
  }

  function itemRow(ctx, x, wIn, base, label, value, size, ink, dotAlpha) {
    T.setFont(ctx, 'dmmono', size, {});
    var tr = size * 0.02;
    /* the shared row size has a floor, so one freakishly long tag still
       has to be stopped from printing into its own figure */
    var budget = wIn - (value ? T.measure(ctx, value, tr) : 0) - size * 1.4;
    var lab = label;
    if (T.measure(ctx, lab, tr) > budget) {
      while (lab.length > 2 && T.measure(ctx, lab + '…', tr) > budget) lab = lab.slice(0, -1);
      lab += '…';
    }
    ctx.save();
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.92;
    var lb = T.draw(ctx, lab, x, base, { align: 'left', tracking: size * 0.02 });
    var vb = value
      ? T.draw(ctx, value, x + wIn, base, { align: 'right', tracking: size * 0.02 })
      : null;
    ctx.restore();
    leader(ctx, lb.x + lb.w + size * 0.5, vb ? vb.x - size * 0.5 : x + wIn,
      base - size * 0.24, size, ink, dotAlpha);
  }

  /* A paperclip, drawn as the two strokes of wire it is: a long U with a
     shorter inverted U inside it. Small enough that only the silhouette
     has to be right. */
  function paperclip(ctx, cx, cy, w, hh, color, alpha, lw) {
    var ro = w / 2, ri = ro * 0.46;
    var yB = cy + hh / 2 - ro, yT = cy - hh / 2 + ri;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - ro, cy - hh / 2);
    ctx.lineTo(cx - ro, yB);
    ctx.arc(cx, yB, ro, Math.PI, 0, false);
    ctx.lineTo(cx + ro, cy - hh / 2 + ro * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + ri, cy + hh / 2 - ro * 1.3);
    ctx.lineTo(cx + ri, yT);
    ctx.arc(cx, yT, ri, 0, Math.PI, true);
    ctx.lineTo(cx - ri, cy + hh / 2 - ro * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  /* The other paper on the desk.

     The open half beside the ticket has to hold its side of the page, and
     a single centred mark could not: a rubber stamp read as a novelty and
     scattered sparkles read as litter. What balances a piece of paper is
     more paper. These are slips seen from across the desk — the ruled
     lines are lines, not text, because a second block of readable words
     over there would compete with the ticket for the eye. */
  function paperSlip(env, cx, cy, w, hh, rot, card, opts) {
    var ctx = env.ctx, u = env.u;
    opts = opts || {};
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = u(20);
    ctx.shadowOffsetY = u(7);
    /* opaque: at 93% the sheet under this one showed through where they
       overlapped, and two papers you can see through each other are not a
       pile, they are a double exposure */
    ctx.fillStyle = card.paper;
    if (opts.torn) slipPath(ctx, -w / 2, -hh / 2, w, hh, opts.tooth || u(8));
    else { ctx.beginPath(); ctx.rect(-w / 2, -hh / 2, w, hh); }
    ctx.fill();
    ctx.restore();

    var pad = w * 0.11;
    var top = -hh / 2 + pad * 1.5, bot = hh / 2 - pad * 1.5;
    if (opts.bar) bot -= hh * 0.26;
    var lines = opts.lines || [0.7, 0.5];
    var step = (bot - top) / Math.max(1, lines.length - (lines.length > 1 ? 1 : 0));
    ctx.save();
    ctx.strokeStyle = card.sub;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = Math.max(1, u(2.4));
    lines.forEach(function (fr, i) {
      var yy = lines.length > 1 ? top + step * i : (top + bot) / 2;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + pad, yy);
      ctx.lineTo(-w / 2 + pad + (w - pad * 2) * fr, yy);
      ctx.stroke();
    });
    ctx.restore();
    if (opts.bar) {
      barcode(ctx, -w / 2 + pad, hh / 2 - pad * 1.4 - hh * 0.15,
        w - pad * 2, hh * 0.15, opts.bar, card.ink, 0.5);
    }
    /* clipped to the sheet's top edge — inside the same transform, so it
       stays on the paper whatever angle the paper is at */
    /* the clip goes over the sheet's top edge, folded end uppermost, which
       is how one actually sits on a pile */
    if (opts.clip) {
      ctx.save();
      ctx.translate(w * 0.28, -hh / 2 + w * 0.02);
      ctx.scale(1, -1);
      paperclip(ctx, 0, 0, w * 0.105, w * 0.3, card.ink, 0.7, Math.max(2, u(4.4)));
      ctx.restore();
    }
    ctx.restore();
  }

  function barcode(ctx, x, y, wTot, hTot, bars, color, alpha) {
    var sum = 0, i;
    for (i = 0; i < bars.length; i++) sum += bars[i];
    var unit = wTot / sum;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    var cx = x;
    for (i = 0; i < bars.length; i++) {
      var bw = bars[i] * unit;
      if (i % 2 === 0) ctx.fillRect(cx, y, Math.max(1, bw * 0.9), hTot);
      cx += bw;
    }
    ctx.restore();
  }

  function draw(env) {
    var ctx = env.ctx, w = env.w, h = env.h, u = env.u;
    var st = env.st, pal = env.pal, c = env.content, rand = env.rand;

    /* ---- the photo field fills everything ---- */
    var field = { x: 0, y: 0, w: w, h: h };
    if (env.hasPhoto) {
      env.drawPhoto(field);
    } else {
      ctx.fillStyle = U.mix(pal.duo[0], pal.base, 0.35);
      ctx.fillRect(0, 0, w, h);
      P.wash(ctx, w * 0.3, h * 0.3, env.S * 0.9, pal.soft[0], 0.5 * st.washStrength);
      P.wash(ctx, w * 0.8, h * 0.75, env.S * 0.8, pal.soft[1] || pal.soft[0], 0.4 * st.washStrength);
    }

    var m = PO.margins(env);
    var mic = PO.micro(env);
    var wide = env.tier === 'wide';
    var onField = U.onColor(U.mix(pal.duo[0], pal.duo[1], 0.4));
    /* the slip is a piece of paper, not a tinted panel — on a dark palette
       `pal.base` put a navy box on a navy field and it vanished */
    var card = PO.stock(pal);
    /* the paper is light even when the page is dark, so the accent has to
       be resolved against the paper, not against the palette's page */
    var accent = PO.accentOn(pal, card.paper);

    if (env.micro) {
      /* a watch face gets the title alone, centred on the field */
      PO.headline(env, { x: m.left, y: env.band.top + (env.band.bottom - env.band.top) * 0.34, w: m.inner },
        { align: 'center', color: onField, maxH: h * 0.34 });
      PO.microFoot(env, { m: m, color: onField });
      return;
    }

    /* ---- the random parts, drawn once ----
       The serial and the barcode come off the seeded stream, so they must
       be taken before the measure/draw passes: consuming the stream inside
       a pass that runs a different number of times at different canvas
       sizes is how a preview and an export stop matching. */
    var serial = '';
    for (var d = 0; d < 4; d++) serial += Math.floor(rand() * 10);
    var bars = [];
    for (var q = 0; q < 47; q++) bars.push(0.45 + rand() * 1.55);

    /* ---- what the ticket says ---- */
    var shop = 'pairtone';
    var title = (c.title || 'pairtone').replace(/\s+/g, ' ').trim().toUpperCase();
    var mono = W.textstack.monogram(st) || 'PT';
    var nameA = st.nameA.trim(), nameB = st.nameB.trim();

    var items = [];
    if (nameA) items.push([nameA.toLowerCase(), '01']);
    if (nameB) items.push([nameB.toLowerCase(), '01']);
    if (!items.length) items.push([(c.title || 'pairtone').toLowerCase(), '01']);
    if (st.showTags) {
      c.tags.slice(0, 4).forEach(function (t) { items.push(['+ ' + t.toLowerCase(), '01']); });
    }
    var totalRow = ['total', (nameA && nameB) ? '01 pair' : '01 item'];
    var footLine = [(st.showNames && c.names) ? c.names : mono, c.footnote]
      .filter(Boolean).join('   ·   ').toLowerCase();

    /* ---- geometry ---- */
    /* A receipt is narrow — that is most of what makes it read as one. The
       per-mille cap is what holds that on a desktop canvas, where a third
       of the width is a poster panel rather than a till roll. */
    var colW = Math.min(w * (wide ? 0.34 : env.tier === 'tablet' || env.tier === 'square' ? 0.42 : 0.5),
      u(430));
    var bandH = env.band.bottom - env.band.top;
    var tooth = u(10);

    /* Build the whole ticket as a list of drawing operations keyed to a
       running height, so it can be measured, rejected and rebuilt one
       notch smaller without ever being painted. */
    function build(k) {
      var ops = [];
      var mi = mic * k;
      var pd = u(30) * k;
      var wIn = colW - pd * 2;
      var y = tooth + pd * 0.9;

      function at(yy, fn) { ops.push(function (x) { fn(x, yy); }); }

      /* — the shop line — */
      at(y + mi * 0.78, function (x, yy) {
        ctx.save();
        ctx.fillStyle = card.sub;
        ctx.globalAlpha = 0.8;
        var s = T.fit(ctx, shop, 'dmmono', mi * 0.7, wIn, 0.34, {});
        T.draw(ctx, shop, x + wIn / 2, yy, { align: 'center', tracking: s * 0.34 });
        ctx.restore();
      });
      y += mi * 1.5;

      /* — the name of the ticket — */
      var tLines = [title];
      var ts = T.fit(ctx, title, st.titleFont, mi * 2.4, wIn, 0.08, {});
      if (ts < mi * 1.45) {
        /* Long names get set over as many as three lines rather than
           shrunk to nothing — but the wrap is REFITTED until it takes
           three, instead of having the tail sliced off: a title cut to fit
           the shop board is a title the user typed and did not get. */
        ts = mi * 1.45;
        for (var wp = 0; wp < 7; wp++) {
          T.setFont(ctx, st.titleFont, ts, {});
          tLines = T.wrap(ctx, title, wIn, ts * 0.08);
          if (tLines.length <= 3) break;
          ts *= 0.88;
        }
        var longest = tLines[0];
        tLines.forEach(function (l) {
          if (T.measure(ctx, l, ts * 0.08) > T.measure(ctx, longest, ts * 0.08)) longest = l;
        });
        ts = T.fit(ctx, longest, st.titleFont, ts, wIn, 0.08, {});
      }
      tLines.forEach(function (line, i) {
        at(y + ts * 0.92 + i * ts * 1.24, function (x, yy) {
          ctx.save();
          ctx.fillStyle = card.ink;
          T.setFont(ctx, st.titleFont, ts, {});
          T.draw(ctx, line, x + wIn / 2, yy, { align: 'center', tracking: ts * 0.08 });
          ctx.restore();
        });
      });
      y += tLines.length * ts * 1.24 + mi * 0.5;

      /* — serial line, between two hairlines — */
      at(y, function (x, yy) { hair(ctx, x, wIn, yy, Math.max(1, u(1.2)), card.ink, 0.4); });
      y += mi * 1.0;
      at(y + mi * 0.7, function (x, yy) {
        ctx.save();
        ctx.fillStyle = card.sub;
        ctx.globalAlpha = 0.85;
        T.setFont(ctx, 'dmmono', mi * 0.72, {});
        T.draw(ctx, 'no. ' + serial, x, yy, { align: 'left', tracking: mi * 0.1 });
        T.draw(ctx, mono, x + wIn, yy, { align: 'right', tracking: mi * 0.1 });
        ctx.restore();
      });
      y += mi * 1.25;
      at(y, function (x, yy) {
        hair(ctx, x, wIn, yy, Math.max(1, u(1.2)), card.ink, 0.4);
        hair(ctx, x, wIn, yy + Math.max(2, u(3.4)), Math.max(1, u(1.2)), card.ink, 0.4);
      });
      y += mi * 1.15;

      /* — the items — */
      var rs = rowSize(ctx, items.concat([totalRow]), mi * 0.95, wIn, mi * 0.6);
      at(y + rs * 0.8, function (x, yy) {
        ctx.save();
        ctx.fillStyle = card.sub;
        ctx.globalAlpha = 0.72;
        T.setFont(ctx, 'dmmono', rs * 0.76, {});
        T.draw(ctx, 'item', x, yy, { align: 'left', tracking: rs * 0.14 });
        T.draw(ctx, 'qty', x + wIn, yy, { align: 'right', tracking: rs * 0.14 });
        ctx.restore();
      });
      y += rs * 1.35;
      at(y, function (x, yy) {
        hair(ctx, x, wIn, yy, Math.max(1, u(1.2)), card.ink, 0.32, [u(6), u(5)]);
      });
      y += rs * 0.75;
      items.forEach(function (it) {
        at(y + rs * 0.82, function (x, yy) {
          itemRow(ctx, x, wIn, yy, it[0], it[1], rs, card.ink, 0.4);
        });
        y += rs * 1.62;
      });
      /* no rule between the last item and the total — the bar is the
         division, and a dashed line landing on its edge read as a seam */
      y += rs * 0.55;

      /* — the total, reversed out of a bar of the palette's colour —
         A receipt puts its emphasis here and nowhere else, so this is
         where the second ink belongs. It was a line of accent type with a
         rule under the figure, which is about four hundred coloured
         pixels: the accent audit put this layout at 0.02% of the page,
         one notch off "the palette shows a colour the render does not
         contain". A filled bar is the same idea, printed. */
      var totS = rs * 1.2;
      var barH = totS * 1.72;
      at(y, function (x, yy) {
        var pad2 = totS * 0.5;
        ctx.save();
        ctx.globalAlpha = 0.94;
        ctx.fillStyle = accent;
        ctx.fillRect(x - pad2 * 0.6, yy, wIn + pad2 * 1.2, barH);
        ctx.restore();

        var rev = U.onColor(accent);
        var base = yy + barH * 0.66;
        T.setFont(ctx, 'dmmono', totS, { weight: 500 });
        ctx.save();
        ctx.fillStyle = rev;
        var lb = T.draw(ctx, totalRow[0], x, base, { align: 'left', tracking: totS * 0.14 });
        var vb = T.draw(ctx, totalRow[1], x + wIn, base, { align: 'right', tracking: totS * 0.06 });
        ctx.restore();
        leader(ctx, lb.x + lb.w + totS * 0.5, vb.x - totS * 0.5, base - totS * 0.24,
          totS, rev, 0.45);
      });
      y += barH + totS * 0.7;

      /* — the memo — */
      if (c.caption) {
        at(y + mi * 0.68, function (x, yy) {
          ctx.save();
          ctx.fillStyle = card.sub;
          ctx.globalAlpha = 0.7;
          T.setFont(ctx, 'dmmono', mi * 0.68, {});
          T.draw(ctx, 'memo', x, yy, { align: 'left', tracking: mi * 0.16 });
          ctx.restore();
        });
        y += mi * 1.35;
        var capH = PO.block(env, 0, 0, wIn, [c.caption], {
          size: mi * 0.88, lead: 1.55, upper: false, measure: true, font: st.bodyFont
        });
        at(y, function (x, yy) {
          PO.block(env, x, yy, wIn, [c.caption], {
            size: mi * 0.88, lead: 1.55, upper: false, alpha: 0.9,
            font: st.bodyFont, color: card.ink
          });
        });
        y += capH + mi * 1.1;
      }

      /* — the barcode and the foot — */
      at(y, function (x, yy) {
        hair(ctx, x, wIn, yy, Math.max(1, u(1.2)), card.ink, 0.32, [u(6), u(5)]);
      });
      y += mi * 1.2;
      var bcH = mi * 2.0;
      at(y, function (x, yy) {
        barcode(ctx, x + wIn * 0.08, yy, wIn * 0.84, bcH, bars, card.ink, 0.88);
      });
      y += bcH + mi * 0.95;
      if (footLine) {
        at(y, function (x, yy) {
          ctx.save();
          ctx.fillStyle = card.sub;
          ctx.globalAlpha = 0.9;
          var s = T.fit(ctx, footLine, 'dmmono', mi * 0.74, wIn, 0.2, {});
          T.draw(ctx, footLine, x + wIn / 2, yy, { align: 'center', tracking: s * 0.2 });
          ctx.restore();
        });
        y += mi * 1.3;
      }

      return { h: y + pd * 0.9 + tooth, ops: ops, pd: pd };
    }

    /* Measure, and if the ticket is taller than the band it may print in,
       set the whole thing smaller and measure again. Four passes is
       plenty — each one lands close, because the height is very nearly
       linear in the scale.

       The slip is then made exactly as tall as what came back, never
       shorter: the contents are drawn inside a clip of its own outline, so
       a slip cut to the band would not overflow, it would silently swallow
       whatever did not fit — and a clipped line is still a drawn line, as
       every audit that only looks for ink off the page has found out. */
    /* The two rails hold the head and the foot of the page. They are not
       ornament: on a 21:9 phone the ticket is a small island in the middle
       of a very tall canvas, and without them a third of the page above it
       was one unbroken empty rectangle. */
    var railTop = env.band.top + mic * 1.0;
    var railBot = h - m.bottom - mic * 0.3;
    var slotTop = railTop + mic * 1.8;
    var slotH = Math.max(u(200), railBot - mic * 2.2 - slotTop);

    var target = Math.min(slotH, h - u(28));
    var k = 1, plan = build(1);
    for (var pass = 0; pass < 4 && plan.h > target; pass++) {
      k *= Math.max(0.45, (target / plan.h) * 0.99);
      plan = build(k);
    }
    var colH = plan.h;

    var col = {
      /* the slip's right edge sits on the poster margin, so it lines up
         with every other layout's measure instead of drifting towards the
         trim */
      x: w - colW - m.right,
      y: U.clamp(slotTop + (slotH - colH) / 2, u(14),
        Math.max(u(14), h - colH - u(14))),
      w: colW, h: colH
    };

    /* ---- the open half: the rest of the desk ----
       The ticket sits against the right margin, so the left half has to
       carry its own weight or the page tips. It is held by two more slips
       of the same paper and a card under a clip, laid out at fixed
       fractions of the open field rather than scattered — the eye reads
       three pieces of paper at three angles as a desk, and the same three
       at random as a mess. The tear line crosses the whole field between
       them, which is also what stops a 3:1 header leaving one unbroken
       empty rectangle beside the slip. */
    var fieldX = m.left, fieldW = col.x - u(34) - m.left;
    var fieldTop = slotTop, fieldH = (railBot - mic * 2.2) - slotTop;
    /* below the pile, not under it — at 0.60 the clipped sheet covered the
       line and left the words "cut here" sitting on their own */
    var cutY = fieldTop + fieldH * 0.67;
    var hasCut = fieldW > u(220);

    /* one module for all of it: the ticket's own width, shrunk if the open
       field is too small to take the papers at full size */
    var ps = Math.min(1, fieldW / (colW * 0.86), fieldH / (colW * 1.7));
    var papers = ps > 0.52 ? [
      { x: 0.34, y: 0.13, w: 0.56, h: 0.34, rot: -0.11, lines: [0.72, 0.46, 0.6] },
      { x: 0.60, y: 0.35, w: 0.70, h: 0.92, rot: 0.07, torn: true, clip: true,
        lines: [0.68, 0.5, 0.74], bar: bars.slice(0, 21) },
      { x: 0.42, y: 0.83, w: 0.70, h: 0.30, rot: -0.05, lines: [0.64, 0.42] }
    ] : [];
    papers.forEach(function (pp) {
      pp.cx = fieldX + fieldW * pp.x;
      pp.cy = fieldTop + fieldH * pp.y;
      pp.pw = colW * pp.w * ps;
      pp.ph = colW * pp.h * ps;
    });

    /* ---- optional silhouettes on the open half ----
       Off by default now. The ticket is the decoration; a field of
       sparkles around it was competing with it rather than framing it, and
       the count slider is where anybody who wants them can put them back.
       They stay clear of the ticket and of the note under it. */
    W.deco.scatter(env, {
      kinds: st.motifs,
      colors: [onField],
      hero: accent,
      avoid: [
        { x: col.x - u(34), y: col.y - u(34), w: col.w + u(68), h: col.h + u(68) },
        { x: 0, y: 0, w: w, h: railTop + mic },
        { x: 0, y: railBot - mic * 1.4, w: w, h: h - railBot + mic * 1.4 },
        hasCut ? { x: fieldX - u(20), y: cutY - mic * 1.2, w: fieldW + u(40), h: mic * 2.4 }
          : { x: 0, y: 0, w: 0, h: 0 }
      ].concat(papers.map(function (pp) {
        return { x: pp.cx - pp.pw * 0.62, y: pp.cy - pp.ph * 0.62,
          w: pp.pw * 1.24, h: pp.ph * 1.24 };
      })),
      rMin: 22, rMax: 52, bigRatio: 0.22, sep: 0.95,
      alphaMin: 0.28, alphaMax: 0.6,
      pad: u(80)
    });

    /* the tear line first, then the paper on top of it — ink is under
       paper everywhere else on this page and it should be here too */
    if (hasCut) {
      ctx.save();
      ctx.fillStyle = onField;
      ctx.globalAlpha = 0.6;
      var cutS = mic * 0.62;
      T.setFont(ctx, 'dmmono', cutS, {});
      var cb = T.draw(ctx, 'cut here', fieldX, cutY + cutS * 0.36,
        { align: 'left', tracking: cutS * 0.2 });
      ctx.restore();
      hair(ctx, cb.x + cb.w + cutS * 1.1, fieldW - cb.w - cutS * 1.1, cutY,
        Math.max(1, u(1.4)), onField, 0.45, [u(9), u(7)]);
    }

    papers.forEach(function (pp) {
      paperSlip(env, pp.cx, pp.cy, pp.pw, pp.ph, pp.rot, card, {
        torn: pp.torn, clip: pp.clip, lines: pp.lines, bar: pp.bar, tooth: tooth * 0.8
      });
    });

    /* ---- the paper ---- */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.26)';
    ctx.shadowBlur = u(26);
    ctx.shadowOffsetY = u(9);
    ctx.fillStyle = card.paper;
    slipPath(ctx, col.x, col.y, col.w, col.h, tooth);
    ctx.fill();
    ctx.restore();

    /* the thermal-paper tint: one very faint wash down the slip, so the
       stock is not a flat swatch */
    ctx.save();
    slipPath(ctx, col.x, col.y, col.w, col.h, tooth);
    ctx.clip();
    P.wash(ctx, col.x + col.w * 0.5, col.y + col.h * 0.86, col.w * 1.1,
      card.ink, 0.05);
    ctx.restore();

    ctx.save();
    slipPath(ctx, col.x, col.y, col.w, col.h, tooth);
    ctx.clip();
    ctx.translate(0, col.y);
    plan.ops.forEach(function (op) { op(col.x + plan.pd); });
    ctx.restore();

    /* ---- head and foot ---- */
    PO.rail(env, railTop, [(st.showNames && c.names) ? c.names : mono, null, 'pairtone'],
      { m: m, size: mic * 0.72, alpha: 0.72, color: onField });
    PO.rail(env, railBot, ['customer copy', null, 'please keep this receipt'],
      { m: m, size: mic * 0.68, alpha: 0.6, color: onField });
  }

  W.layoutRegistry = W.layoutRegistry || [];
  W.layoutRegistry.push({
    id: 'column',
    label: 'Column',
    blurb: '사진 위에 올린 영수증 한 장. 촘촘한 작은 글씨와 바코드까지.',
    deco: true,
    defaults: {
      titleFont: 'dmserif', scriptFont: 'petitformal', bodyFont: 'spacemono',
      headlineStyle: 'stack',
      photoShape: 'rect', tone: 'duo', toneAmount: 0.95,
      feather: 0, motifs: ['sparkle'], decoCount: 0,
      grain: 1.3, vignette: 0.05
    },
    draw: draw
  });
})(window.PT = window.PT || {});
