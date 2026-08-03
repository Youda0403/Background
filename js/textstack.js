/* Resolves the user's fields into the strings a layout draws.
   Placement and sizing belong to poster.js. */
(function (W) {
  'use strict';
  var T = W.type, U = W.util;

  var SEPARATORS = [
    { id: 'x', label: '×', glyph: ' × ' },
    { id: 'heart', label: '♡', glyph: ' ♡ ' },
    { id: 'amp', label: '&', glyph: ' & ' },
    { id: 'dot', label: '·', glyph: ' · ' },
    { id: 'plus', label: '+', glyph: ' + ' },
    { id: 'slash', label: '/', glyph: ' / ' },
    { id: 'star', label: '✦', glyph: ' ✦ ' },
    { id: 'dash', label: '—', glyph: ' — ' },
    { id: 'space', label: 'space', glyph: '   ' }
  ];
  var SEP_BY_ID = {};
  SEPARATORS.forEach(function (s) { SEP_BY_ID[s.id] = s; });

  function initials(s) {
    return String(s).split(/[\s._-]+/).filter(Boolean)
      .map(function (w) { return w.charAt(0).toUpperCase(); }).join('');
  }

  function joinNames(st) {
    var a = st.nameA.trim(), b = st.nameB.trim();
    var glyph = (SEP_BY_ID[st.sep] || SEP_BY_ID.x).glyph;
    if (a && b) return a + glyph + b;
    return a || b;
  }

  function monogram(st) {
    var a = st.nameA.trim(), b = st.nameB.trim();
    var glyph = (SEP_BY_ID[st.sep] || SEP_BY_ID.x).glyph;
    if (a && b) return initials(a) + glyph + initials(b);
    return initials(a || b || st.pairName);
  }

  /* What actually gets drawn, in order. */
  function build(st) {
    var out = { title: '', names: '', caption: '', footnote: '', tags: [] };
    var joined = joinNames(st);

    /* One field, drawn as written. There used to be a mode chip deciding
       whether the big type was the pair name, the two names or the
       initials — three ways to say the same thing, and it made the field
       below it mean something different depending on a setting elsewhere.
       Whatever is typed in the main field is what gets set large; the
       names are their own line, and the initials are furniture. */
    out.title = String(st.pairName || '').trim();
    if (st.showNames && joined) out.names = joined;

    /* Clearing the main field is now something a user can do — it used to
       need the "없음" chip. Rather than leave every layout to fall back to
       the word "pairtone", the names move up and take the big type, and
       the names line steps aside so the same string is not set twice. */
    if (!out.title && out.names) { out.title = out.names; out.names = ''; }

    out.caption = st.caption.trim();
    out.footnote = st.footnote.trim();
    out.tags = String(st.tags || '').split(',').map(function (s) { return s.trim(); })
      .filter(Boolean).slice(0, 8);
    return out;
  }

  W.textstack = {
    separators: SEPARATORS, build: build,
    joinNames: joinNames, monogram: monogram, initials: initials
  };
})(window.PT = window.PT || {});
