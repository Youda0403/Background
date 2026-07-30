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
        row.appendChild(el('span', 'fieldLabel', item.label));
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
        var lab = el('label', null, item.label);
        var sel = document.createElement('select');
        lab.setAttribute('for', 'c_' + item.key);
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
        var l2 = el('label', null, item.label);
        var inp = item.t === 'textarea' ? document.createElement('textarea')
          : document.createElement('input');
        if (item.t === 'number') { inp.type = 'number'; inp.min = item.min; inp.max = item.max; }
        else if (item.t === 'text') inp.type = 'text';
        if (item.ph) inp.placeholder = item.ph;
        if (item.maxlength) inp.maxLength = item.maxlength;
        inp.id = 'c_' + item.key;
        l2.setAttribute('for', inp.id);
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
        node = el('label', 'toggle');
        node.appendChild(el('span', null, item.label));
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        node.appendChild(cb);
        node.appendChild(el('i', 'switch'));
        cb.addEventListener('change', function () { api.set(item.key, cb.checked); });
        updaters.push(function (st) { cb.checked = !!st[item.key]; });
        break;
      }

      case 'chips': {
        node = el('div', 'field');
        node.appendChild(el('span', 'fieldLabel', item.label));
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
        if (item.label) node.appendChild(el('span', 'fieldLabel', item.label));
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

  W.controls = { build: build, el: el };
})(window.PT = window.PT || {});
