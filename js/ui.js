/* Wiring: state ↔ controls ↔ canvas, plus photo input, export and
   share links. */
(function (W) {
  'use strict';
  var U = W.util, S = W.state, R = W.render, T = W.type, C = W.compose;

  var STORE_KEY = 'pairtone.v1';
  var PREVIEW_MAX = 760;

  var st = null;
  var panel = null;
  var canvas = document.getElementById('preview');
  var sizeLabel = document.getElementById('sizeLabel');
  var tierLabel = document.getElementById('tierLabel');
  var stageTip = document.getElementById('stageTip');
  var dropHint = document.getElementById('dropHint');
  var guideToggle = document.getElementById('guideToggle');
  var toastEl = document.getElementById('toast');
  var fileInput = null;
  var photoNameEl = null;
  var batchTargets = ['ip-16pm', 'gx-ultra', 'pad-pro11'];

  /* ---------- helpers ---------- */

  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  function presetOptions() {
    var opts = W.presets.groups.map(function (g) {
      return {
        group: g.group,
        items: g.items.map(function (i) {
          return { v: i.id, l: i.label + ' · ' + i.w + '×' + i.h };
        })
      };
    });
    opts.push({ group: 'Custom', items: [{ v: 'custom', l: 'Custom size…' }] });
    return opts;
  }

  function paletteCards() {
    return W.palettes.list.map(function (p) {
      return { v: p.id, l: p.label, colors: [p.base].concat(p.inks.slice(0, 3)) };
    });
  }

  function lookCards() {
    return S.looks.map(function (l) {
      var p = W.palettes.byId[l.st.palette];
      return { v: l.id, l: l.label, colors: [p.base].concat(p.inks.slice(0, 2)) };
    });
  }

  function layoutCards() {
    return (W.layoutRegistry || []).map(function (l) {
      return { v: l.id, l: l.label, blurb: l.blurb };
    });
  }

  function fontOptions() {
    return T.fonts.map(function (f) { return { v: f.id, l: f.label }; });
  }

  function idLabel(list) {
    return list.map(function (x) { return { v: x.id, l: x.label }; });
  }

  /* ---------- render ---------- */

  var draw = U.raf(function () {
    var info;
    try {
      info = R.render(canvas, st, { maxSize: PREVIEW_MAX, guides: true });
    } catch (e) {
      console.error(e);
      toast('Could not draw that — try another setting.');
      return;
    }
    var d = info.full;
    sizeLabel.textContent = d.w + ' × ' + d.h;
    tierLabel.textContent = C.tierOf(d.h / d.w);
    canvas.classList.toggle('flat', !W.photo.has());
    stageTip.textContent = W.photo.has()
      ? 'Drag the preview to reframe · scroll to zoom · double-click to reset'
      : 'Add a photo below, or leave it out — the design works either way.';
    persist();
  });

  var persist = U.debounce(function () {
    var payload = S.serialize(st);
    try { localStorage.setItem(STORE_KEY, payload); } catch (e) { /* private mode */ }
    if (history.replaceState) history.replaceState(null, '', '#' + payload);
    else location.hash = payload;
  }, 400);

  /* ---------- state api ---------- */

  var api = {
    state: function () { return st; },
    get: function (k) { return st[k]; },
    set: function (k, v) {
      if (k === 'look') {
        st = S.applyLook(st, v);
      } else if (k === 'layout') {
        S.applyLayoutDefaults(st, v);
      } else {
        st[k] = v;
      }
      if (panel) panel.refresh();
      draw();
    }
  };

  /* ---------- control spec ---------- */

  function spec() {
    return [
      {
        title: 'Looks', hint: 'twelve starting points',
        items: [
          { t: 'cards', key: 'look', options: lookCards, grid: 'lookGrid', cardClass: 'lookCard' },
          { t: 'note', text: 'A look sets the layout, palette, fonts and texture at once. Your words, photo and canvas size stay put.' }
        ]
      },
      {
        title: 'Canvas', hint: 'phones, tablets, desktops',
        items: [
          { t: 'select', key: 'presetId', label: 'Device', options: presetOptions },
          {
            t: 'row', items: [
              { t: 'number', key: 'customW', label: 'Width', min: 64, max: 8000, when: function (s) { return s.presetId === 'custom'; } },
              { t: 'number', key: 'customH', label: 'Height', min: 64, max: 8000, when: function (s) { return s.presetId === 'custom'; } }
            ]
          },
          { t: 'chips', key: 'orientation', label: 'Orientation', options: [{ v: 'portrait', l: 'Portrait' }, { v: 'landscape', l: 'Landscape' }] },
          { t: 'toggle', key: 'safeShift', label: 'Keep the clock and dock clear' },
          {
            t: 'custom',
            render: function () {
              var el = W.controls.el;
              var wrap = el('div', 'field');
              wrap.appendChild(el('span', 'fieldLabel', 'Export set'));
              var chips = el('div', 'chips');
              var pool = ['ip-15', 'ip-16pm', 'gx-s24', 'gx-ultra', 'pad-pro11', 'pad-11', 'sh-story', 'dt-qhd'];
              pool.forEach(function (id) {
                var p = W.presets.byId[id];
                var b = el('button', 'chip', p.label);
                b.type = 'button';
                b.setAttribute('aria-pressed', batchTargets.indexOf(id) >= 0 ? 'true' : 'false');
                b.addEventListener('click', function () {
                  var i = batchTargets.indexOf(id);
                  if (i >= 0) batchTargets.splice(i, 1); else batchTargets.push(id);
                  b.setAttribute('aria-pressed', batchTargets.indexOf(id) >= 0 ? 'true' : 'false');
                  btn.textContent = 'Download set (' + batchTargets.length + ')';
                  btn.disabled = !batchTargets.length;
                });
                chips.appendChild(b);
              });
              wrap.appendChild(chips);
              var btn = el('button', 'btn sm', 'Download set (' + batchTargets.length + ')');
              btn.type = 'button';
              btn.style.alignSelf = 'flex-start';
              btn.addEventListener('click', function () { downloadSet(btn); });
              wrap.appendChild(btn);
              wrap.appendChild(el('p', 'note', 'Same artwork, recomposed for each size — matching wallpapers across your devices.'));
              return wrap;
            }
          }
        ]
      },
      {
        title: 'Design', hint: 'layout and palette',
        items: [
          { t: 'cards', key: 'layout', label: 'Layout', options: layoutCards },
          { t: 'cards', key: 'palette', label: 'Palette', options: paletteCards, grid: 'palGrid' }
        ]
      },
      {
        title: 'Words', hint: 'English-first, all optional',
        items: [
          {
            t: 'chips', key: 'titleMode', label: 'Headline', options: [
              { v: 'pair', l: 'Pair name' }, { v: 'names', l: 'Both names' },
              { v: 'monogram', l: 'Initials' }, { v: 'none', l: 'No headline' }
            ]
          },
          { t: 'text', key: 'pairName', label: 'Pair name', ph: 'e.g. Sunrise Duo', maxlength: 40 },
          {
            t: 'row', items: [
              { t: 'text', key: 'nameA', label: 'Name A', ph: 'Aki', maxlength: 24 },
              { t: 'text', key: 'nameB', label: 'Name B', ph: 'Ren', maxlength: 24 }
            ]
          },
          { t: 'chips', key: 'sep', label: 'Between the names', options: idLabel(W.textstack.separators) },
          { t: 'toggle', key: 'showNames', label: 'Show the names line' },
          { t: 'textarea', key: 'caption', label: 'Caption', ph: 'two halves of the same daydream' },
          { t: 'text', key: 'footnote', label: 'Footnote', ph: 'since 2024', maxlength: 32 },
          { t: 'text', key: 'tags', label: 'Scattered tags', ph: 'love, always, ours', maxlength: 80 },
          { t: 'toggle', key: 'showTags', label: 'Scatter the tags' },
          { t: 'note', text: 'Tags print small and in brackets, like (love) — the quietest way to say something only you two read.' }
        ]
      },
      {
        title: 'Type', hint: 'fonts and spacing', open: false,
        items: [
          {
            t: 'row', items: [
              { t: 'select', key: 'titleFont', label: 'Headline font', options: fontOptions },
              { t: 'select', key: 'bodyFont', label: 'Body font', options: fontOptions }
            ]
          },
          { t: 'slider', key: 'titleSize', label: 'Headline size', min: 30, max: 180, step: 1, fmt: function (v) { return Math.round(v); } },
          { t: 'slider', key: 'titleTrack', label: 'Headline tracking', min: -20, max: 200, step: 1, fmt: function (v) { return Math.round(v); } },
          {
            t: 'chips', key: 'titleCase', label: 'Headline case', options: [
              { v: 'none', l: 'As typed' }, { v: 'upper', l: 'UPPER' },
              { v: 'lower', l: 'lower' }, { v: 'title', l: 'Title' }
            ]
          },
          { t: 'toggle', key: 'titleItalic', label: 'Italic headline' },
          { t: 'slider', key: 'bodySize', label: 'Body size', min: 14, max: 70, step: 1, fmt: function (v) { return Math.round(v); } },
          { t: 'slider', key: 'bodyTrack', label: 'Body tracking', min: 0, max: 300, step: 1, fmt: function (v) { return Math.round(v); } },
          {
            t: 'chips', key: 'bodyCase', label: 'Body case', options: [
              { v: 'none', l: 'As typed' }, { v: 'upper', l: 'UPPER' }, { v: 'lower', l: 'lower' }
            ]
          },
          { t: 'toggle', key: 'captionRule', label: 'Underline the caption' }
        ]
      },
      {
        title: 'Photo', hint: 'toned to match the artwork',
        items: [
          {
            t: 'custom',
            render: function () {
              var el = W.controls.el;
              var wrap = el('div', 'field');
              var zone = el('label', 'dropZone');
              zone.appendChild(el('b', null, 'Add a photo'));
              zone.appendChild(el('span', null, 'click, or drop one anywhere on the preview'));
              fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.accept = 'image/*';
              fileInput.addEventListener('change', function () {
                if (fileInput.files && fileInput.files[0]) usePhoto(fileInput.files[0]);
              });
              zone.appendChild(fileInput);
              wrap.appendChild(zone);

              var bar = el('div', 'photoBar');
              photoNameEl = el('span', 'name', '');
              var reset = el('button', 'btn sm', 'Recentre');
              reset.type = 'button';
              reset.addEventListener('click', function () {
                st.ox = 0.5; st.oy = 0.5; st.zoom = 1;
                panel.refresh(); draw();
              });
              var remove = el('button', 'btn sm', 'Remove');
              remove.type = 'button';
              remove.addEventListener('click', function () {
                W.photo.clear();
                if (fileInput) fileInput.value = '';
                panel.refresh(); draw();
              });
              bar.appendChild(photoNameEl);
              bar.appendChild(reset);
              bar.appendChild(remove);
              wrap.appendChild(bar);
              wrap._bar = bar;
              return wrap;
            },
            update: function (s, node) {
              var on = W.photo.has();
              node._bar.hidden = !on;
              if (on && photoNameEl) photoNameEl.textContent = W.photo.state.name;
            }
          },
          { t: 'cards', key: 'photoShape', label: 'Frame', options: idLabel(W.frames.shapes), grid: 'palGrid', when: W.photo.has },
          { t: 'select', key: 'photoRatio', label: 'Frame proportion', options: C.ratios.map(function (r) { return { v: r.id, l: r.label }; }), when: W.photo.has },
          { t: 'chips', key: 'tone', label: 'Tone', options: idLabel(S.tones), when: W.photo.has },
          { t: 'slider', key: 'toneAmount', label: 'Tone strength', min: 0, max: 1, step: 0.01, when: function (s) { return W.photo.has() && /duo|wash/.test(s.tone); } },
          { t: 'slider', key: 'halftoneCells', label: 'Halftone dots', min: 14, max: 130, step: 1, fmt: function (v) { return Math.round(v); }, when: function (s) { return W.photo.has() && s.tone === 'halftone'; } },
          {
            t: 'row', items: [
              { t: 'slider', key: 'brightness', label: 'Brightness', min: -0.5, max: 0.5, step: 0.01, when: W.photo.has },
              { t: 'slider', key: 'contrast', label: 'Contrast', min: 0.4, max: 2, step: 0.01, when: W.photo.has }
            ]
          },
          {
            t: 'row', items: [
              { t: 'slider', key: 'saturation', label: 'Saturation', min: 0, max: 2, step: 0.01, when: W.photo.has },
              { t: 'slider', key: 'blur', label: 'Softness', min: 0, max: 1, step: 0.01, when: W.photo.has }
            ]
          },
          {
            t: 'row', items: [
              { t: 'slider', key: 'feather', label: 'Edge fade', min: 0, max: 0.9, step: 0.01, when: function (s) { return W.photo.has() && s.tone !== 'halftone'; } },
              { t: 'slider', key: 'opacity', label: 'Opacity', min: 0.1, max: 1, step: 0.01, when: W.photo.has }
            ]
          },
          {
            t: 'row', items: [
              { t: 'slider', key: 'zoom', label: 'Zoom', min: 1, max: 3, step: 0.01, when: W.photo.has },
              { t: 'slider', key: 'photoRotate', label: 'Tilt', min: -12, max: 12, step: 0.5, when: W.photo.has }
            ]
          },
          { t: 'select', key: 'blend', label: 'Blend', options: S.blends.map(function (b) { return { v: b.id, l: b.label }; }), when: W.photo.has },
          { t: 'slider', key: 'overprint', label: 'Riso overprint', min: 0, max: 1, step: 0.01, when: W.photo.has },
          { t: 'toggle', key: 'photoRing', label: 'Keyline around the frame', when: W.photo.has },
          { t: 'toggle', key: 'polaroid', label: 'Instant-photo card', when: function (s) { return W.photo.has() && s.layout === 'sticker'; } },
          { t: 'note', text: 'Duotone and Halftone reprint the photo in the palette’s own ink, which is what makes a snapshot sit inside the artwork instead of on top of it.' }
        ]
      },
      {
        title: 'Finish', hint: 'texture, motifs, discretion',
        items: [
          { t: 'slider', key: 'subtlety', label: 'Discretion', min: 0, max: 1, step: 0.01, fmt: function (v) { return v < 0.25 ? 'loud and proud' : v < 0.55 ? 'balanced' : v < 0.8 ? 'quiet' : 'nobody will know'; } },
          { t: 'note', text: 'Discretion shrinks the headline and thins out the motifs in one move — slide it up for a wallpaper you can open in a meeting.' },
          { t: 'chips', key: 'motifs', label: 'Motifs', options: idLabel(S.motifKinds), multi: true },
          { t: 'slider', key: 'decoDensity', label: 'Motif density', min: 0, max: 2, step: 0.01 },
          { t: 'toggle', key: 'glitter', label: 'Glitter fill on big stars' },
          { t: 'chips', key: 'auraShape', label: 'Aura shape', options: [{ v: 'heart', l: 'Heart' }, { v: 'puff', l: 'Star' }, { v: 'blob', l: 'Blob' }, { v: 'circle', l: 'Circle' }, { v: 'clover', l: 'Clover' }, { v: 'none', l: 'None' }], when: function (s) { return s.layout === 'aura'; } },
          { t: 'chips', key: 'paperStyle', label: 'Paper', options: [{ v: 'none', l: 'Plain' }, { v: 'dots', l: 'Dots' }, { v: 'grid', l: 'Grid' }, { v: 'lines', l: 'Lines' }], when: function (s) { return s.layout !== 'riso'; } },
          { t: 'chips', key: 'cardStyle', label: 'Card behind the words', options: [{ v: 'none', l: 'None' }, { v: 'round', l: 'Rounded' }, { v: 'square', l: 'Square' }, { v: 'ellipse', l: 'Ellipse' }], when: function (s) { return s.layout === 'paper'; } },
          { t: 'toggle', key: 'swirl', label: 'Beaded swirl', when: function (s) { return s.layout === 'paper'; } },
          { t: 'toggle', key: 'border', label: 'Dashed border', when: function (s) { return s.layout === 'sticker'; } },
          { t: 'toggle', key: 'doodleOutline', label: 'Outline the doodles', when: function (s) { return s.layout === 'sticker'; } },
          { t: 'slider', key: 'washStrength', label: 'Colour wash', min: 0, max: 1.6, step: 0.01 },
          { t: 'slider', key: 'grain', label: 'Grain', min: 0, max: 3, step: 0.01 },
          { t: 'slider', key: 'vignette', label: 'Vignette', min: 0, max: 0.5, step: 0.01 },
          {
            t: 'custom',
            render: function () {
              var el = W.controls.el;
              var wrap = el('div', 'field');
              var row = el('div', 'fieldRow');
              row.appendChild(el('span', 'fieldLabel', 'Arrangement'));
              var v = el('span', 'fieldVal', '');
              row.appendChild(v);
              wrap.appendChild(row);
              var b = el('button', 'btn sm', 'Shuffle the scatter');
              b.type = 'button';
              b.style.alignSelf = 'flex-start';
              b.addEventListener('click', function () {
                st.seed = Math.floor(Math.random() * 9999);
                panel.refresh(); draw();
              });
              wrap.appendChild(b);
              wrap._v = v;
              return wrap;
            },
            update: function (s, node) { node._v.textContent = 'seed ' + s.seed; }
          }
        ]
      }
    ];
  }

  /* ---------- photo input ---------- */

  function usePhoto(file) {
    W.photo.load(file).then(function () {
      st.ox = 0.5; st.oy = 0.5; st.zoom = 1;
      panel.refresh();
      draw();
      toast('Photo added — try Tone to match it to the palette.');
    }).catch(function () {
      toast('That file could not be read as an image.');
    });
  }

  function wireDropZone() {
    var stop = function (e) { e.preventDefault(); e.stopPropagation(); };
    ['dragenter', 'dragover'].forEach(function (ev) {
      document.addEventListener(ev, function (e) {
        if (!e.dataTransfer || !/Files/.test((e.dataTransfer.types || []).join(','))) return;
        stop(e);
        dropHint.hidden = false;
      });
    });
    ['dragleave', 'dragend'].forEach(function (ev) {
      document.addEventListener(ev, function (e) {
        if (e.relatedTarget) return;
        dropHint.hidden = true;
      });
    });
    document.addEventListener('drop', function (e) {
      if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
      stop(e);
      dropHint.hidden = true;
      usePhoto(e.dataTransfer.files[0]);
    });
    document.addEventListener('paste', function (e) {
      var items = (e.clipboardData || {}).items || [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf('image') === 0) {
          usePhoto(items[i].getAsFile());
          break;
        }
      }
    });
  }

  function wireCanvasGestures() {
    var dragging = false, lastX = 0, lastY = 0;

    canvas.addEventListener('pointerdown', function (e) {
      if (!W.photo.has()) return;
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      canvas.classList.add('dragging');
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var rect = canvas.getBoundingClientRect();
      st.ox = U.clamp(st.ox - (e.clientX - lastX) / rect.width * 1.4, 0, 1);
      st.oy = U.clamp(st.oy - (e.clientY - lastY) / rect.height * 1.4, 0, 1);
      lastX = e.clientX; lastY = e.clientY;
      draw();
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      canvas.addEventListener(ev, function () {
        if (!dragging) return;
        dragging = false;
        canvas.classList.remove('dragging');
        panel.refresh();
      });
    });
    canvas.addEventListener('wheel', function (e) {
      if (!W.photo.has()) return;
      e.preventDefault();
      st.zoom = U.clamp(st.zoom * (1 - e.deltaY * 0.0014), 1, 3);
      draw();
      panel.refresh();
    }, { passive: false });
    canvas.addEventListener('dblclick', function () {
      if (!W.photo.has()) return;
      st.ox = 0.5; st.oy = 0.5; st.zoom = 1;
      panel.refresh(); draw();
    });
  }

  /* ---------- export ---------- */

  function saveBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function download(btn) {
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Rendering…';
    R.toBlob(st).then(function (blob) {
      saveBlob(blob, R.slug(st) + '.png');
      toast('Saved ' + R.slug(st) + '.png');
    }).catch(function (e) {
      console.error(e);
      toast('Export failed — try a smaller size.');
    }).then(function () {
      btn.disabled = false;
      btn.textContent = label;
    });
  }

  function downloadSet(btn) {
    if (!batchTargets.length) return;
    var label = btn.textContent;
    btn.disabled = true;
    var queue = batchTargets.slice();
    var original = st.presetId;
    var done = 0;

    function next() {
      if (!queue.length) {
        st.presetId = original;
        btn.disabled = false;
        btn.textContent = label;
        panel.refresh();
        draw();
        toast('Saved ' + done + ' wallpapers.');
        return;
      }
      var id = queue.shift();
      st.presetId = id;
      btn.textContent = 'Rendering ' + (done + 1) + '/' + (done + queue.length + 1) + '…';
      R.toBlob(st).then(function (blob) {
        saveBlob(blob, R.slug(st) + '.png');
        done++;
      }).catch(function (e) { console.error(e); })
        .then(function () { setTimeout(next, 450); });
    }
    next();
  }

  /* ---------- boot ---------- */

  function initialState() {
    var fromHash = location.hash.length > 2 ? S.deserialize(location.hash.slice(1)) : null;
    if (fromHash) return fromHash;
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved) {
        var s = S.deserialize(saved);
        if (s) return s;
      }
    } catch (e) { /* ignore */ }
    return S.create();
  }

  function boot() {
    R.layouts();
    st = initialState();

    panel = W.controls.build(document.getElementById('panelRoot'), spec(), api);

    guideToggle.checked = !!st.showGuides;
    guideToggle.addEventListener('change', function () {
      st.showGuides = guideToggle.checked;
      draw();
    });

    document.getElementById('btnDownload').addEventListener('click', function () {
      download(this);
    });
    document.getElementById('btnRandom').addEventListener('click', function () {
      st = S.randomize(st);
      panel.refresh();
      draw();
      toast('New look — hit it again if it is not the one.');
    });
    document.getElementById('btnCopyLink').addEventListener('click', function () {
      var url = location.origin + location.pathname + '#' + S.serialize(st);
      var ok = function () { toast('Link copied — it rebuilds this exact wallpaper.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(ok, function () { toast(url); });
      } else {
        toast(url);
      }
    });

    wireDropZone();
    wireCanvasGestures();

    window.addEventListener('resize', U.debounce(draw, 200));

    draw();
    /* webfonts land a beat later; redraw so the export matches the screen */
    T.ready().then(draw);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.PT = window.PT || {});
