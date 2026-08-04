/* Declarative control panel. A spec describes the sections; this file
   builds the DOM once and then only pushes values back in, so typing in
   a text field is never interrupted by a re-render. */
(function (W) {
  'use strict';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* A "?" chip that reveals a short plain-language note. Jargon is
     unavoidable in a design tool; hiding the explanation behind a tap
     keeps the panel calm. */
  function helpChip(text) {
    var wrap = el('span', 'helpWrap');
    var btn = el('button', 'helpBtn', '?');
    btn.type = 'button';
    btn.setAttribute('aria-label', '설명 보기');
    btn.setAttribute('aria-expanded', 'false');
    var pop = el('span', 'helpPop', text);
    pop.hidden = true;

    function closeAll() {
      Array.prototype.forEach.call(document.querySelectorAll('.helpPop'), function (o) {
        o.hidden = true;
      });
      Array.prototype.forEach.call(document.querySelectorAll('.helpBtn'), function (o) {
        o.setAttribute('aria-expanded', 'false');
      });
    }

    /* The bubble is positioned in viewport coordinates and clamped to the
       screen. Absolute positioning meant a chip near an edge pushed its
       bubble out of view, and no amount of CSS could see the viewport. */
    function place() {
      var r = btn.getBoundingClientRect();
      pop.style.maxWidth = Math.min(288, window.innerWidth - 24) + 'px';
      pop.style.left = '0px';
      pop.style.top = '0px';
      var pr = pop.getBoundingClientRect();
      var left = r.left + r.width / 2 - pr.width / 2;
      left = Math.max(12, Math.min(left, window.innerWidth - pr.width - 12));
      var top = r.bottom + 8;
      if (top + pr.height > window.innerHeight - 12) {
        top = Math.max(12, r.top - pr.height - 8);
      }
      pop.style.left = Math.round(left) + 'px';
      pop.style.top = Math.round(top) + 'px';
      /* point the arrow back at the button */
      var arrow = Math.max(10, Math.min(r.left + r.width / 2 - left, pr.width - 10));
      pop.style.setProperty('--arrow', Math.round(arrow) + 'px');
      pop.classList.toggle('below', top < r.top);
    }

    btn.addEventListener('pointerdown', function (e) {
      /* stop the browser focusing the button — focusing an element the
         page has scrolled past is what used to yank the panel */
      e.preventDefault();
    });
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var open = pop.hidden;
      closeAll();
      if (!open) return;
      pop.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      place();
    });
    window.addEventListener('scroll', function () { if (!pop.hidden) place(); }, true);
    window.addEventListener('resize', function () { if (!pop.hidden) place(); });

    wrap.appendChild(btn);
    wrap.appendChild(pop);
    return wrap;
  }

  /* Puts the label and its help chip side by side as SIBLINGS. Nesting a
     button inside <label for="..."> makes a click activate the label,
     which focuses the field and scrolls the panel — so the chip has to
     live outside the label element. */
  function withHelp(labelNode, item) {
    if (!item.help) return labelNode;
    var row = el('span', 'labelRow');
    row.appendChild(labelNode);
    row.appendChild(helpChip(item.help));
    return row;
  }

  function optionsOf(item, st) {
    return typeof item.options === 'function' ? item.options(st) : item.options;
  }

  function build(root, spec, api) {
    root.innerHTML = '';
    var updaters = [];

    spec.forEach(function (sec) {
      var wrap = el('section', 'section' + (sec.open === false ? ' closed' : ''));
      var head = el('button', 'sectionHead');
      head.type = 'button';
      head.setAttribute('aria-expanded', sec.open === false ? 'false' : 'true');
      var titleWrap = el('div');
      titleWrap.appendChild(el('h2', null, sec.title));
      if (sec.hint) titleWrap.appendChild(el('div', 'hint', sec.hint));
      head.appendChild(titleWrap);
      head.appendChild(el('span', 'chev', '▾'));
      head.addEventListener('click', function () {
        var closed = wrap.classList.toggle('closed');
        head.setAttribute('aria-expanded', closed ? 'false' : 'true');
      });
      wrap.appendChild(head);

      var body = el('div', 'sectionBody');
      sec.items.forEach(function (item) {
        var built = buildItem(item, api, updaters);
        if (built) body.appendChild(built);
      });
      wrap.appendChild(body);
      root.appendChild(wrap);

      /* A whole section can be conditional, not just a field. Decoration
         is drawn by three of the six layouts; on the others the sliders
         moved and nothing happened, which reads as a broken control
         rather than as one that does not apply. */
      if (sec.when) updaters.push(function (st) { wrap.hidden = !sec.when(st); });
    });

    document.addEventListener('click', function () {
      Array.prototype.forEach.call(root.querySelectorAll('.helpPop'), function (o) {
        o.hidden = true;
      });
      Array.prototype.forEach.call(root.querySelectorAll('.helpBtn'), function (o) {
        o.setAttribute('aria-expanded', 'false');
      });
    });

    function refresh() {
      var st = api.state();
      updaters.forEach(function (u) { u(st); });
    }
    refresh();
    return { refresh: refresh };
  }

  function buildItem(item, api, updaters) {
    var node;

    switch (item.t) {
      case 'row': {
        node = el('div', item.cols === 3 ? 'grid3' : 'grid2');
        item.items.forEach(function (sub) {
          var b = buildItem(sub, api, updaters);
          if (b) node.appendChild(b);
        });
        break;
      }

      case 'note': {
        node = el('p', 'note', item.text);
        break;
      }

      case 'slider': {
        node = el('div', 'field');
        var row = el('div', 'fieldRow');
        row.appendChild(withHelp(el('span', 'fieldLabel', item.label), item));
        var val = el('span', 'fieldVal');
        row.appendChild(val);
        node.appendChild(row);
        var input = document.createElement('input');
        input.type = 'range';
        input.min = item.min; input.max = item.max; input.step = item.step;
        input.setAttribute('aria-label', item.label);
        input.addEventListener('input', function () {
          api.set(item.key, parseFloat(input.value));
        });
        node.appendChild(input);
        updaters.push(function (st) {
          var v = st[item.key];
          if (document.activeElement !== input) input.value = v;
          val.textContent = item.fmt ? item.fmt(v) : String(Math.round(v * 100) / 100);
        });
        break;
      }

      case 'select': {
        node = el('div', 'field');
        var labEl = el('label', null, item.label);
        var lab = withHelp(labEl, item);
        var sel = document.createElement('select');
        labEl.setAttribute('for', 'c_' + item.key);
        sel.id = 'c_' + item.key;
        node.appendChild(lab);
        node.appendChild(sel);
        var lastSig = '';
        sel.addEventListener('change', function () {
          var v = sel.value;
          api.set(item.key, item.numeric ? parseFloat(v) : v);
        });
        updaters.push(function (st) {
          var opts = optionsOf(item, st);
          var sig = JSON.stringify(opts);
          if (sig !== lastSig) {
            lastSig = sig;
            sel.innerHTML = '';
            opts.forEach(function (o) {
              if (o.group) {
                var g = document.createElement('optgroup');
                g.label = o.group;
                o.items.forEach(function (i2) {
                  var op = document.createElement('option');
                  op.value = i2.v; op.textContent = i2.l;
                  g.appendChild(op);
                });
                sel.appendChild(g);
              } else {
                var op2 = document.createElement('option');
                op2.value = o.v; op2.textContent = o.l;
                sel.appendChild(op2);
              }
            });
          }
          if (String(sel.value) !== String(st[item.key])) sel.value = st[item.key];
        });
        break;
      }

      case 'text':
      case 'number':
      case 'textarea': {
        node = el('div', 'field');
        var l2El = el('label', null, item.label);
        var l2 = withHelp(l2El, item);
        var inp = item.t === 'textarea' ? document.createElement('textarea')
          : document.createElement('input');
        if (item.t === 'number') { inp.type = 'number'; inp.min = item.min; inp.max = item.max; }
        else if (item.t === 'text') inp.type = 'text';
        if (item.rows) inp.rows = item.rows;
        if (item.ph) inp.placeholder = item.ph;
        if (item.maxlength) inp.maxLength = item.maxlength;
        inp.id = 'c_' + item.key;
        l2El.setAttribute('for', inp.id);
        node.appendChild(l2);
        node.appendChild(inp);
        inp.addEventListener('input', function () {
          api.set(item.key, item.t === 'number' ? parseFloat(inp.value) : inp.value);
        });
        updaters.push(function (st) {
          if (document.activeElement !== inp && String(inp.value) !== String(st[item.key])) {
            inp.value = st[item.key];
          }
        });
        break;
      }

      case 'toggle': {
        node = el('div', 'toggleRow');
        var tlab = el('label', 'toggle');
        tlab.appendChild(el('span', null, item.label));
        node.appendChild(tlab);
        if (item.help) node.appendChild(helpChip(item.help));
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        tlab.appendChild(cb);
        tlab.appendChild(el('i', 'switch'));
        cb.addEventListener('change', function () { api.set(item.key, cb.checked); });
        updaters.push(function (st) { cb.checked = !!st[item.key]; });
        break;
      }

      case 'chips': {
        node = el('div', 'field');
        node.appendChild(withHelp(el('span', 'fieldLabel', item.label), item));
        var chips = el('div', 'chips');
        node.appendChild(chips);
        var btns = [];
        optionsOf(item, null).forEach(function (o) {
          var b = el('button', 'chip', o.l);
          b.type = 'button';
          b.addEventListener('click', function () {
            if (item.multi) {
              var cur = api.state()[item.key].slice();
              var i = cur.indexOf(o.v);
              if (i >= 0) { if (cur.length > 1) cur.splice(i, 1); }
              else cur.push(o.v);
              api.set(item.key, cur);
            } else {
              api.set(item.key, o.v);
            }
          });
          btns.push({ b: b, v: o.v });
          chips.appendChild(b);
        });
        updaters.push(function (st) {
          var cur = st[item.key];
          btns.forEach(function (x) {
            var on = item.multi ? cur.indexOf(x.v) >= 0 : cur === x.v;
            x.b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        });
        break;
      }

      case 'cards': {
        node = el('div', 'field');
        if (item.label) node.appendChild(withHelp(el('span', 'fieldLabel', item.label), item));
        var grid = el('div', item.grid || 'cardGrid');
        node.appendChild(grid);
        var cardBtns = [];
        optionsOf(item, null).forEach(function (o) {
          var b = el('button', 'card' + (item.cardClass ? ' ' + item.cardClass : ''));
          b.type = 'button';
          if (o.colors) {
            var sw = el('div', 'swatchRow');
            o.colors.forEach(function (c) {
              var i2 = el('i');
              i2.style.background = c;
              sw.appendChild(i2);
            });
            b.appendChild(sw);
          }
          b.appendChild(el('strong', null, o.l));
          if (o.blurb) b.appendChild(el('em', null, o.blurb));
          b.addEventListener('click', function () { api.set(item.key, o.v, item.commit); });
          cardBtns.push({ b: b, v: o.v });
          grid.appendChild(b);
        });
        updaters.push(function (st) {
          cardBtns.forEach(function (x) {
            x.b.setAttribute('aria-pressed', st[item.key] === x.v ? 'true' : 'false');
          });
        });
        break;
      }

      case 'custom': {
        node = item.render(api);
        if (item.update) updaters.push(function (st) { item.update(st, node); });
        break;
      }

      default:
        return null;
    }

    if (item.when) {
      updaters.push(function (st) {
        node.hidden = !item.when(st);
      });
    }
    return node;
  }

  W.controls = { build: build, el: el, helpChip: helpChip };
})(window.PT = window.PT || {});
