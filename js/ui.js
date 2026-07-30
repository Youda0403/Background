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

  var TIER_KO = {
    tall: '폰 (길쭉)', phone: '폰', tablet: '패드', square: '정사각', wide: '와이드'
  };

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
    opts.push({ group: '직접 입력', items: [{ v: 'custom', l: '커스텀 사이즈…' }] });
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
      toast('그리기에 실패했어요 — 다른 설정으로 시도해 보세요.');
      return;
    }
    var d = info.full;
    sizeLabel.textContent = d.w + ' × ' + d.h;
    tierLabel.textContent = TIER_KO[C.tierOf(d.h / d.w)] || '';
    canvas.classList.toggle('flat', !W.photo.has());
    stageTip.textContent = W.photo.has()
      ? '프리뷰를 드래그하면 사진 위치, 스크롤하면 확대 · 더블클릭하면 초기화'
      : '아래에서 사진을 추가해 보세요. 사진 없이도 완성돼요.';
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
        title: '무드', hint: '원클릭 프리셋 12종',
        items: [
          { t: 'cards', key: 'look', options: lookCards, grid: 'lookGrid', cardClass: 'lookCard' },
          {
            t: 'slider', key: 'subtlety', label: '일코 농도', min: 0, max: 1, step: 0.01,
            fmt: function (v) { return v < 0.25 ? '당당하게' : v < 0.55 ? '적당히' : v < 0.8 ? '은은하게' : '아무도 몰라'; }
          },
          { t: 'note', text: '무드를 고르면 레이아웃·팔레트·폰트·질감이 한 번에 바뀌어요. 적어둔 문구, 사진, 기기 사이즈는 그대로 유지됩니다. 일코 농도를 올리면 글씨가 작아지고 장식이 옅어져서 밖에서 열어도 안전한 배경화면이 돼요.' }
        ]
      },
      {
        title: '사이즈', hint: '폰 · 패드 · 데스크탑',
        items: [
          { t: 'select', key: 'presetId', label: '기기', options: presetOptions },
          {
            t: 'row', items: [
              { t: 'number', key: 'customW', label: '가로 (px)', min: 64, max: 8000, when: function (s) { return s.presetId === 'custom'; } },
              { t: 'number', key: 'customH', label: '세로 (px)', min: 64, max: 8000, when: function (s) { return s.presetId === 'custom'; } }
            ]
          },
          { t: 'chips', key: 'orientation', label: '방향', options: [{ v: 'portrait', l: '세로' }, { v: 'landscape', l: '가로' }] },
          { t: 'toggle', key: 'safeShift', label: '잠금화면 시계·독 영역 피하기' },
          {
            t: 'custom',
            render: function () {
              var el = W.controls.el;
              var wrap = el('div', 'field');
              wrap.appendChild(el('span', 'fieldLabel', '여러 기기 한 번에 저장'));
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
                  btn.textContent = '세트 저장 (' + batchTargets.length + ')';
                  btn.disabled = !batchTargets.length;
                });
                chips.appendChild(b);
              });
              wrap.appendChild(chips);
              var btn = el('button', 'btn sm', '세트 저장 (' + batchTargets.length + ')');
              btn.type = 'button';
              btn.style.alignSelf = 'flex-start';
              btn.addEventListener('click', function () { downloadSet(btn); });
              wrap.appendChild(btn);
              wrap.appendChild(el('p', 'note', '같은 디자인을 기기별 해상도에 맞춰 다시 배치해서 저장해요 — 폰이랑 패드 커플 세트 완성.'));
              return wrap;
            }
          }
        ]
      },
      {
        title: '문구', hint: '영문 추천 · 전부 선택사항',
        items: [
          {
            t: 'chips', key: 'titleMode', label: '메인 문구', options: [
              { v: 'pair', l: '페어명' }, { v: 'names', l: '두 이름' },
              { v: 'monogram', l: '이니셜' }, { v: 'none', l: '없음' }
            ]
          },
          { t: 'text', key: 'pairName', label: '페어명', ph: '예: Sunrise Duo', maxlength: 40 },
          {
            t: 'row', items: [
              { t: 'text', key: 'nameA', label: '이름 A', ph: 'Aki', maxlength: 24 },
              { t: 'text', key: 'nameB', label: '이름 B', ph: 'Ren', maxlength: 24 }
            ]
          },
          { t: 'chips', key: 'sep', label: '이름 사이 기호', options: idLabel(W.textstack.separators) },
          { t: 'toggle', key: 'showNames', label: '이름 줄 표시' },
          { t: 'textarea', key: 'caption', label: '캡션', ph: 'two halves of the same daydream' },
          { t: 'note', text: '배경화면에 들어가는 글자라 영문이 제일 예쁘게 나와요. 태그·풋노트 같은 작은 글자는 아래 「세부 조정」에 있어요.' }
        ]
      },
      {
        title: '사진', hint: '팔레트에 맞게 자동 보정',
        items: [
          {
            t: 'custom',
            render: function () {
              var el = W.controls.el;
              var wrap = el('div', 'field');
              var zone = el('label', 'dropZone');
              zone.appendChild(el('b', null, '사진 추가하기'));
              zone.appendChild(el('span', null, '클릭하거나, 프리뷰에 사진을 끌어다 놓아도 돼요'));
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
              var reset = el('button', 'btn sm', '가운데로');
              reset.type = 'button';
              reset.addEventListener('click', function () {
                st.ox = 0.5; st.oy = 0.5; st.zoom = 1;
                panel.refresh(); draw();
              });
              var remove = el('button', 'btn sm', '삭제');
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
          { t: 'cards', key: 'photoShape', label: '프레임', options: idLabel(W.frames.shapes), grid: 'palGrid', when: W.photo.has },
          { t: 'chips', key: 'tone', label: '톤 (필터)', options: idLabel(S.tones), when: W.photo.has },
          { t: 'slider', key: 'toneAmount', label: '톤 강도', min: 0, max: 1, step: 0.01, when: function (s) { return W.photo.has() && /duo|wash/.test(s.tone); } },
          { t: 'slider', key: 'halftoneCells', label: '망점 촘촘함', min: 14, max: 130, step: 1, fmt: function (v) { return Math.round(v); }, when: function (s) { return W.photo.has() && s.tone === 'halftone'; } },
          {
            t: 'row', items: [
              { t: 'slider', key: 'zoom', label: '확대', min: 1, max: 3, step: 0.01, when: W.photo.has },
              { t: 'slider', key: 'photoRotate', label: '기울기', min: -12, max: 12, step: 0.5, when: W.photo.has }
            ]
          },
          {
            t: 'row', items: [
              { t: 'slider', key: 'feather', label: '가장자리 페이드', min: 0, max: 0.9, step: 0.01, when: function (s) { return W.photo.has() && s.tone !== 'halftone'; } },
              { t: 'slider', key: 'opacity', label: '불투명도', min: 0.1, max: 1, step: 0.01, when: W.photo.has }
            ]
          },
          { t: 'note', text: '듀오톤·망점 필터는 사진을 팔레트 잉크로 다시 인쇄해서, 사진이 배경화면 위에 붙은 게 아니라 그림 안에 들어간 것처럼 보이게 해줘요. 밝기·대비 같은 세밀한 보정은 「세부 조정」에 있습니다.', when: W.photo.has }
        ]
      },
      {
        title: '세부 조정 · 디자인', hint: '레이아웃 · 팔레트 · 장식', open: false,
        items: [
          { t: 'cards', key: 'layout', label: '레이아웃', options: layoutCards },
          { t: 'cards', key: 'palette', label: '팔레트', options: paletteCards, grid: 'palGrid' },
          { t: 'chips', key: 'motifs', label: '흩뿌릴 모티프', options: idLabel(S.motifKinds), multi: true },
          { t: 'slider', key: 'decoDensity', label: '모티프 밀도', min: 0, max: 2, step: 0.01 },
          { t: 'toggle', key: 'glitter', label: '큰 별에 글리터 채우기' },
          { t: 'chips', key: 'auraShape', label: '아우라 모양', options: [{ v: 'heart', l: '하트' }, { v: 'puff', l: '별' }, { v: 'blob', l: '블롭' }, { v: 'circle', l: '원' }, { v: 'clover', l: '클로버' }, { v: 'none', l: '없음' }], when: function (s) { return s.layout === 'aura'; } },
          { t: 'chips', key: 'paperStyle', label: '종이 질감', options: [{ v: 'none', l: '민무늬' }, { v: 'dots', l: '도트' }, { v: 'grid', l: '모눈' }, { v: 'lines', l: '줄노트' }], when: function (s) { return s.layout !== 'riso'; } },
          { t: 'chips', key: 'cardStyle', label: '글자 뒤 카드', options: [{ v: 'none', l: '없음' }, { v: 'round', l: '둥근' }, { v: 'square', l: '각진' }, { v: 'ellipse', l: '타원' }], when: function (s) { return s.layout === 'paper'; } },
          { t: 'toggle', key: 'swirl', label: '점 소용돌이', when: function (s) { return s.layout === 'paper'; } },
          { t: 'toggle', key: 'border', label: '점선 테두리', when: function (s) { return s.layout === 'sticker'; } },
          { t: 'toggle', key: 'doodleOutline', label: '낙서에 테두리선', when: function (s) { return s.layout === 'sticker'; } },
          { t: 'slider', key: 'washStrength', label: '컬러 워시', min: 0, max: 1.6, step: 0.01 },
          { t: 'slider', key: 'grain', label: '그레인 (필름 질감)', min: 0, max: 3, step: 0.01 },
          { t: 'slider', key: 'vignette', label: '비네트 (가장자리 어둡게)', min: 0, max: 0.5, step: 0.01 },
          {
            t: 'custom',
            render: function () {
              var el = W.controls.el;
              var wrap = el('div', 'field');
              var row = el('div', 'fieldRow');
              row.appendChild(el('span', 'fieldLabel', '배치'));
              var v = el('span', 'fieldVal', '');
              row.appendChild(v);
              wrap.appendChild(row);
              var b = el('button', 'btn sm', '장식 다시 흩뿌리기');
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
      },
      {
        title: '세부 조정 · 사진', hint: '보정 · 블렌드', open: false,
        items: [
          { t: 'note', text: '사진을 추가하면 조절할 수 있어요.', when: function () { return !W.photo.has(); } },
          { t: 'select', key: 'photoRatio', label: '프레임 비율', options: C.ratios.map(function (r) { return { v: r.id, l: r.label }; }), when: W.photo.has },
          {
            t: 'row', items: [
              { t: 'slider', key: 'brightness', label: '밝기', min: -0.5, max: 0.5, step: 0.01, when: W.photo.has },
              { t: 'slider', key: 'contrast', label: '대비', min: 0.4, max: 2, step: 0.01, when: W.photo.has }
            ]
          },
          {
            t: 'row', items: [
              { t: 'slider', key: 'saturation', label: '채도', min: 0, max: 2, step: 0.01, when: W.photo.has },
              { t: 'slider', key: 'blur', label: '몽글몽글 (블러)', min: 0, max: 1, step: 0.01, when: W.photo.has }
            ]
          },
          { t: 'select', key: 'blend', label: '블렌드 모드', options: S.blends.map(function (b) { return { v: b.id, l: b.label }; }), when: W.photo.has },
          { t: 'slider', key: 'overprint', label: '리소 겹인쇄', min: 0, max: 1, step: 0.01, when: W.photo.has },
          { t: 'toggle', key: 'photoRing', label: '프레임에 얇은 라인', when: W.photo.has },
          { t: 'toggle', key: 'polaroid', label: '폴라로이드 카드', when: function (s) { return W.photo.has() && s.layout === 'sticker'; } }
        ]
      },
      {
        title: '세부 조정 · 글자', hint: '폰트 · 자간 · 작은 글자', open: false,
        items: [
          {
            t: 'row', items: [
              { t: 'select', key: 'titleFont', label: '메인 폰트', options: fontOptions },
              { t: 'select', key: 'bodyFont', label: '보조 폰트', options: fontOptions }
            ]
          },
          {
            t: 'row', items: [
              { t: 'slider', key: 'titleSize', label: '메인 크기', min: 30, max: 180, step: 1, fmt: function (v) { return Math.round(v); } },
              { t: 'slider', key: 'titleTrack', label: '메인 자간', min: -20, max: 200, step: 1, fmt: function (v) { return Math.round(v); } }
            ]
          },
          {
            t: 'chips', key: 'titleCase', label: '메인 대소문자', options: [
              { v: 'none', l: '그대로' }, { v: 'upper', l: 'UPPER' },
              { v: 'lower', l: 'lower' }, { v: 'title', l: 'Title' }
            ]
          },
          { t: 'toggle', key: 'titleItalic', label: '메인 이탤릭' },
          {
            t: 'row', items: [
              { t: 'slider', key: 'bodySize', label: '보조 크기', min: 14, max: 70, step: 1, fmt: function (v) { return Math.round(v); } },
              { t: 'slider', key: 'bodyTrack', label: '보조 자간', min: 0, max: 300, step: 1, fmt: function (v) { return Math.round(v); } }
            ]
          },
          {
            t: 'chips', key: 'bodyCase', label: '보조 대소문자', options: [
              { v: 'none', l: '그대로' }, { v: 'upper', l: 'UPPER' }, { v: 'lower', l: 'lower' }
            ]
          },
          { t: 'toggle', key: 'captionRule', label: '캡션에 밑줄' },
          { t: 'text', key: 'footnote', label: '풋노트 (작은 글자)', ph: 'since 2024', maxlength: 32 },
          { t: 'text', key: 'tags', label: '흩뿌림 태그 (쉼표로 구분)', ph: 'love, always, ours', maxlength: 80 },
          { t: 'toggle', key: 'showTags', label: '태그 흩뿌리기' },
          { t: 'note', text: '태그는 (love) 처럼 괄호에 담겨 여백에 작게 흩어져요 — 둘만 알아보는 문장을 숨기기 좋아요.' }
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
      toast('사진 추가 완료 — 톤 필터로 팔레트에 맞춰보세요.');
    }).catch(function () {
      toast('이미지 파일로 읽을 수 없었어요.');
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
    btn.textContent = '만드는 중…';
    R.toBlob(st).then(function (blob) {
      saveBlob(blob, R.slug(st) + '.png');
      toast(R.slug(st) + '.png 저장 완료');
    }).catch(function (e) {
      console.error(e);
      toast('저장에 실패했어요 — 사이즈를 줄여보세요.');
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
        toast('배경화면 ' + done + '장 저장 완료');
        return;
      }
      var id = queue.shift();
      st.presetId = id;
      btn.textContent = (done + 1) + '/' + (done + queue.length + 1) + ' 만드는 중…';
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
      toast('새 무드 등장 — 마음에 안 들면 한 번 더!');
    });
    document.getElementById('btnCopyLink').addEventListener('click', function () {
      var url = location.origin + location.pathname + '#' + S.serialize(st);
      var ok = function () { toast('링크 복사 완료 — 열면 이 배경화면이 그대로 복원돼요.'); };
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
