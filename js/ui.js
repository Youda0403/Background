/* Wiring: state ↔ controls ↔ canvas, plus photo input, export and
   share links. */
(function (W) {
  'use strict';
  var U = W.util, S = W.state, R = W.render, T = W.type, C = W.compose;

  var STORE_KEY = 'pairtone.v1';
  /* The settled preview renders at the real output resolution (within a
     pixel budget) so that what you see is literally the file you save.
     While dragging we drop to a cheap size for smoothness. */
  var PREVIEW_PIXELS = 4.2e6;
  var PREVIEW_DRAG_MAX = 820;
  var dragging = false;

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
    var groups = [];
    T.fonts.forEach(function (f) {
      var g = groups.filter(function (x) { return x.group === f.group; })[0];
      if (!g) { g = { group: f.group, items: [] }; groups.push(g); }
      g.items.push({ v: f.id, l: f.label });
    });
    return groups;
  }

  function scriptFontOptions() {
    return T.fonts.filter(function (f) { return f.group === '필기체'; })
      .map(function (f) { return { v: f.id, l: f.label }; });
  }

  function idLabel(list) {
    return list.map(function (x) { return { v: x.id, l: x.label }; });
  }

  /* ---------- render ---------- */

  /* Two-stage preview. Every change paints a cheap version immediately so
     sliders stay live; once you stop, we repaint at the real output
     resolution, which makes the settled preview pixel-identical to the
     file you save. */
  function paint(opts) {
    var info;
    try {
      info = R.render(canvas, st, opts);
    } catch (e) {
      console.error(e);
      toast('그리기에 실패했어요 — 다른 설정으로 시도해 보세요.');
      return null;
    }
    var d = info.full;
    sizeLabel.textContent = d.w + ' × ' + d.h;
    tierLabel.textContent = TIER_KO[C.tierOf(d.h / d.w)] || '';
    canvas.classList.toggle('flat', !W.photo.has());
    stageTip.textContent = W.photo.has()
      ? '프리뷰를 드래그하면 사진 위치, 스크롤하면 확대 · 더블클릭하면 초기화'
      : '아래에서 사진을 추가해 보세요. 사진 없이도 완성돼요.';
    return info;
  }

  var paintFast = U.raf(function () {
    paint({ maxSize: PREVIEW_DRAG_MAX, guides: true });
  });

  var paintExact = U.debounce(function () {
    if (dragging) return;
    paint({ maxPixels: PREVIEW_PIXELS, guides: true });
  }, 190);

  function draw() {
    paintFast();
    paintExact();
    persist();
  }

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

  var HELP = {
    look: '레이아웃·팔레트·폰트·질감을 한 번에 정해주는 완성된 디자인이에요. 눌러보고 마음에 드는 걸 고르면 끝.',
    subtlety: '올릴수록 제목이 작아지고 장식이 옅어져요. 최대로 올리면 그냥 전시 포스터처럼 보여서 밖에서 열어도 티가 안 나요.',
    layout: '사진과 글자를 어떤 구조로 배치할지 정해요. 구조마다 성격이 완전히 달라요.',
    palette: '이 디자인에 쓰이는 색 조합. 사진 색보정도 여기 색을 따라가요.',
    headlineStyle: '제목 두 줄을 어떤 조합으로 짤지 정해요. 예를 들어 첫 줄은 필기체, 둘째 줄은 굵은 고딕처럼요.',
    headlineScale: '제목 글자 크기. 레이아웃이 알아서 여백에 맞춰주니까 크게 키워도 안 넘쳐요.',
    microScale: '작은 글자(캡션·날짜·태그) 크기를 한 번에 조절해요.',
    tone: '사진을 팔레트 색으로 다시 인쇄하는 방식이에요.\n· 원본: 그대로\n· 워시: 팔레트 색에 물들이기\n· 듀오톤: 밝고 어두운 부분을 팔레트 두 색으로 바꾸기\n· 흑백\n· 망점: 신문 인쇄처럼 점으로 표현\n듀오톤·망점이 사진을 그림 안에 녹여줘요.',
    toneAmount: '위에서 고른 톤을 얼마나 세게 적용할지. 0이면 원본, 1이면 완전히 팔레트 색.',
    halftoneCells: '망점 하나하나의 크기. 숫자가 클수록 점이 작고 촘촘해서 사진이 선명해져요.',
    photoRatio: '사진 틀의 가로:세로 비율. 「자동」은 레이아웃이 남는 공간에 맞춰 알아서 잡아요.',
    photoShape: '사진을 어떤 모양으로 오릴지 정해요.',
    feather: '사진 가장자리를 흐릿하게 번지게 해서 배경에 녹아들게 해요. 0이면 딱 떨어지는 사각형.',
    blend: '사진과 배경을 섞는 방식. 「곱하기」는 어두운 부분만 남아서 도장 찍은 느낌, 「스크린」은 반대로 밝은 부분만 남아요.',
    overprint: '리소 인쇄에서 판이 살짝 어긋나 겹쳐 찍힌 느낌. 올리면 사진이 한 겹 더 밀려 찍혀요.',
    grain: '필름·복사기 같은 거친 입자 질감. 올리면 디지털 느낌이 사라져요.',
    vignette: '네 가장자리를 살짝 어둡게 해서 시선을 가운데로 모아요.',
    washStrength: '배경에 깔리는 색 번짐의 진하기.',
    scrim: '사진 아래쪽을 어둡게(또는 밝게) 덮어서 그 위에 올라가는 글자가 읽히게 해줘요.',
    bleed: '켜면 사진이 여백 없이 화면을 꽉 채워요. 끄면 종이 여백과 모서리 표시가 생겨요.',
    motifs: '여백에 흩뿌릴 작은 그림들. 여러 개 골라도 돼요.',
    decoDensity: '흩뿌린 장식을 몇 개나 놓을지.',
    glitter: '큰 별 안을 반짝이는 은박 질감으로 채워요.',
    seed: '장식이 놓이는 자리를 다시 뽑아요. 디자인은 그대로고 위치만 바뀌어요.',
    safeShift: '잠금화면 시계와 아래 독 버튼이 가리는 영역을 비워두고 배치해요.',
    tags: '(love) 처럼 괄호에 담겨 아래쪽 줄에 작게 들어가요. 쉼표로 여러 개 넣을 수 있어요.',
    sep: '두 이름 사이에 들어갈 기호.',
    titleMode: '가장 큰 글자로 무엇을 넣을지 정해요.',
    caption: '사진 옆이나 아래에 작게 들어가는 문장. 길면 자동으로 줄바꿈돼요.',
    footnote: '날짜나 기념일처럼 아주 작게 들어가는 한 줄.',
    strike: '제목 위로 줄을 하나 그어서 도장 찍은 듯한 인쇄물 느낌을 줘요.',
    burst: '제목 뒤에 가시 모양 별을 크게 깔아요.',
    sideLabel: '오른쪽 세로 방향으로 작은 글자를 넣어요.',
    batch: '고른 기기들 해상도로 각각 다시 배치해서 한꺼번에 저장해요.'
  };

  function spec() {
    return [
      {
        title: '무드', hint: '완성된 디자인 16종',
        items: [
          { t: 'cards', key: 'look', options: lookCards, grid: 'lookGrid', cardClass: 'lookCard', help: HELP.look },
          {
            t: 'slider', key: 'subtlety', label: '일코 농도', min: 0, max: 1, step: 0.01, help: HELP.subtlety,
            fmt: function (v) { return v < 0.25 ? '당당하게' : v < 0.55 ? '적당히' : v < 0.8 ? '은은하게' : '아무도 몰라'; }
          }
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
          { t: 'toggle', key: 'safeShift', label: '시계·독 영역 피하기', help: HELP.safeShift },
          {
            t: 'custom',
            render: function () {
              var el = W.controls.el;
              var wrap = el('div', 'field');
              var lab = el('span', 'fieldLabel', '여러 기기 한 번에 저장');
              lab.appendChild(document.createTextNode(' '));
              lab.appendChild(W.controls.helpChip(HELP.batch));
              wrap.appendChild(lab);
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
              return wrap;
            }
          }
        ]
      },
      {
        title: '문구', hint: '영문 추천 · 전부 선택사항',
        items: [
          {
            t: 'chips', key: 'titleMode', label: '메인 문구', help: HELP.titleMode, options: [
              { v: 'pair', l: '페어명' }, { v: 'names', l: '두 이름' },
              { v: 'monogram', l: '이니셜' }, { v: 'none', l: '없음' }
            ]
          },
          { t: 'text', key: 'pairName', label: '페어명', ph: '예: Spirit of Nature', maxlength: 40 },
          { t: 'note', text: '페어명에 띄어쓰기가 있으면 첫 단어와 나머지가 두 줄로 나뉘어요 — 「Spirit」 / 「of Nature.」처럼요.' },
          {
            t: 'row', items: [
              { t: 'text', key: 'nameA', label: '이름 A', ph: 'Aki', maxlength: 24 },
              { t: 'text', key: 'nameB', label: '이름 B', ph: 'Ren', maxlength: 24 }
            ]
          },
          { t: 'chips', key: 'sep', label: '이름 사이 기호', help: HELP.sep, options: idLabel(W.textstack.separators) },
          { t: 'toggle', key: 'showNames', label: '이름 줄 표시' },
          { t: 'textarea', key: 'caption', label: '캡션', help: HELP.caption, ph: 'two halves of the same daydream' },
          { t: 'text', key: 'footnote', label: '풋노트', help: HELP.footnote, ph: 'since 2024', maxlength: 32 },
          { t: 'text', key: 'tags', label: '태그', help: HELP.tags, ph: 'love, always, ours', maxlength: 80 },
          { t: 'toggle', key: 'showTags', label: '태그 표시' }
        ]
      },
      {
        title: '사진', hint: '팔레트 색으로 자동 보정',
        items: [
          {
            t: 'custom',
            render: function () {
              var el = W.controls.el;
              var wrap = el('div', 'field');
              var zone = el('label', 'dropZone');
              zone.appendChild(el('b', null, '사진 추가하기'));
              zone.appendChild(el('span', null, '클릭하거나, 프리뷰에 끌어다 놓아도 돼요'));
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
          { t: 'chips', key: 'tone', label: '톤', help: HELP.tone, options: idLabel(S.tones), when: W.photo.has },
          { t: 'slider', key: 'toneAmount', label: '톤 강도', min: 0, max: 1, step: 0.01, help: HELP.toneAmount, when: function (s) { return W.photo.has() && /duo|wash/.test(s.tone); } },
          { t: 'slider', key: 'halftoneCells', label: '망점 촘촘함', min: 14, max: 130, step: 1, fmt: function (v) { return Math.round(v); }, help: HELP.halftoneCells, when: function (s) { return W.photo.has() && s.tone === 'halftone'; } },
          { t: 'select', key: 'photoRatio', label: '사진 비율', help: HELP.photoRatio, options: C.ratios.map(function (r) { return { v: r.id, l: r.label }; }), when: W.photo.has },
          { t: 'cards', key: 'photoShape', label: '사진 모양', help: HELP.photoShape, options: idLabel(W.frames.shapes), grid: 'palGrid', when: function (s) { return W.photo.has() && s.layout === 'aura'; } },
          {
            t: 'row', items: [
              { t: 'slider', key: 'zoom', label: '확대', min: 1, max: 3, step: 0.01, when: W.photo.has },
              { t: 'slider', key: 'feather', label: '가장자리 번짐', min: 0, max: 0.9, step: 0.01, help: HELP.feather, when: function (s) { return W.photo.has() && s.tone !== 'halftone'; } }
            ]
          },
          { t: 'note', text: '사진 없이도 디자인은 완성돼요. 넣으면 팔레트 색으로 다시 인쇄돼서 그림 안에 녹아들어요.' }
        ]
      },
      {
        title: '디자인 다듬기', hint: '레이아웃 · 팔레트 · 글자', open: false,
        items: [
          { t: 'cards', key: 'layout', label: '레이아웃', help: HELP.layout, options: layoutCards },
          { t: 'cards', key: 'palette', label: '팔레트', help: HELP.palette, options: paletteCards, grid: 'palGrid' },
          { t: 'chips', key: 'headlineStyle', label: '제목 조합', help: HELP.headlineStyle, options: idLabel(S.headlineStyles) },
          {
            t: 'row', items: [
              { t: 'select', key: 'titleFont', label: '제목 폰트', options: fontOptions },
              { t: 'select', key: 'scriptFont', label: '필기체 폰트', options: scriptFontOptions, when: function (s) { return /script|caps/i.test(s.headlineStyle); } }
            ]
          },
          { t: 'select', key: 'bodyFont', label: '작은 글자 폰트', options: fontOptions },
          {
            t: 'row', items: [
              { t: 'slider', key: 'headlineScale', label: '제목 크기', min: 0.6, max: 1.35, step: 0.01, help: HELP.headlineScale },
              { t: 'slider', key: 'microScale', label: '작은 글자 크기', min: 0.7, max: 1.6, step: 0.01, help: HELP.microScale }
            ]
          },
          {
            t: 'chips', key: 'titleCase', label: '제목 대소문자', options: [
              { v: 'none', l: '그대로' }, { v: 'upper', l: 'UPPER' },
              { v: 'lower', l: 'lower' }, { v: 'title', l: 'Title' }
            ]
          },
          { t: 'toggle', key: 'bleed', label: '사진 꽉 채우기', help: HELP.bleed, when: function (s) { return s.layout === 'lyric'; } },
          { t: 'slider', key: 'scrim', label: '글자 뒤 어둡게', min: 0, max: 0.8, step: 0.01, help: HELP.scrim, when: function (s) { return s.layout === 'lyric'; } },
          { t: 'toggle', key: 'burst', label: '제목 뒤 가시별', help: HELP.burst, when: function (s) { return s.layout === 'lyric'; } },
          { t: 'toggle', key: 'strike', label: '제목에 줄 긋기', help: HELP.strike, when: function (s) { return s.layout === 'zine'; } },
          { t: 'toggle', key: 'sideLabel', label: '세로 측면 글자', help: HELP.sideLabel, when: function (s) { return s.layout === 'editorial'; } },
          { t: 'chips', key: 'auraShape', label: '아우라 모양', options: [{ v: 'heart', l: '하트' }, { v: 'puff', l: '별' }, { v: 'blob', l: '블롭' }, { v: 'circle', l: '원' }, { v: 'clover', l: '클로버' }, { v: 'none', l: '없음' }], when: function (s) { return s.layout === 'aura'; } }
        ]
      },
      {
        title: '질감 · 장식', hint: '그레인 · 모티프', open: false,
        items: [
          { t: 'chips', key: 'motifs', label: '모티프', help: HELP.motifs, options: idLabel(S.motifKinds), multi: true },
          { t: 'slider', key: 'decoDensity', label: '장식 개수', min: 0, max: 2, step: 0.01, help: HELP.decoDensity },
          { t: 'toggle', key: 'glitter', label: '별에 은박 반짝임', help: HELP.glitter },
          {
            t: 'row', items: [
              { t: 'slider', key: 'grain', label: '거친 입자', min: 0, max: 3, step: 0.01, help: HELP.grain },
              { t: 'slider', key: 'vignette', label: '가장자리 어둡게', min: 0, max: 0.5, step: 0.01, help: HELP.vignette }
            ]
          },
          { t: 'slider', key: 'washStrength', label: '색 번짐', min: 0, max: 1.6, step: 0.01, help: HELP.washStrength },
          {
            t: 'custom',
            render: function () {
              var el = W.controls.el;
              var wrap = el('div', 'field');
              var row = el('div', 'fieldRow');
              var lab = el('span', 'fieldLabel', '장식 자리');
              lab.appendChild(document.createTextNode(' '));
              lab.appendChild(W.controls.helpChip(HELP.seed));
              row.appendChild(lab);
              var v = el('span', 'fieldVal', '');
              row.appendChild(v);
              wrap.appendChild(row);
              var b = el('button', 'btn sm', '다시 흩뿌리기');
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
        title: '사진 세부 보정', hint: '밝기 · 블렌드', open: false,
        items: [
          { t: 'note', text: '사진을 추가하면 조절할 수 있어요.', when: function () { return !W.photo.has(); } },
          {
            t: 'row', items: [
              { t: 'slider', key: 'brightness', label: '밝기', min: -0.5, max: 0.5, step: 0.01, when: W.photo.has },
              { t: 'slider', key: 'contrast', label: '대비', min: 0.4, max: 2, step: 0.01, when: W.photo.has }
            ]
          },
          {
            t: 'row', items: [
              { t: 'slider', key: 'saturation', label: '채도', min: 0, max: 2, step: 0.01, when: W.photo.has },
              { t: 'slider', key: 'blur', label: '흐림', min: 0, max: 1, step: 0.01, when: W.photo.has }
            ]
          },
          {
            t: 'row', items: [
              { t: 'slider', key: 'opacity', label: '불투명도', min: 0.1, max: 1, step: 0.01, when: W.photo.has },
              { t: 'slider', key: 'photoRotate', label: '기울기', min: -12, max: 12, step: 0.5, when: W.photo.has }
            ]
          },
          { t: 'select', key: 'blend', label: '블렌드 모드', help: HELP.blend, options: S.blends.map(function (b) { return { v: b.id, l: b.label }; }), when: W.photo.has },
          { t: 'slider', key: 'overprint', label: '겹쳐 인쇄', min: 0, max: 1, step: 0.01, help: HELP.overprint, when: W.photo.has }
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
    var lastX = 0, lastY = 0;

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
        draw();
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
