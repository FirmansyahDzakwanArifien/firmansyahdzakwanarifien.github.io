/* Homelab section: node details on hover, focus, or tap; SVG node icons; the draggable topology editor;
   and the section tabs. */
(function () {
  var data = JSON.parse(document.getElementById('hl-data').textContent || '{}');
  var nodes = data.nodes || [];
  var links = data.links || [];
  var bounds = data.boundaries || [];
  var panel = document.getElementById('hl-panel');
  var byId = {};
  nodes.forEach(function (n) { byId[n.id] = n; });

  /* Font Awesome glyphs by name; SVG <text> cannot use the CSS classes directly. */
  var GLYPHS = {
    server: '', 'shield-halved': '', 'network-wired': '', cloud: '',
    desktop: '', database: '', eye: '', router: '', laptop: '',
    'hard-drive': '', wifi: '', lock: '', 'chart-line': '', box: '',
    brain: '', 'diagram-project': '', bell: ''
  };
  document.querySelectorAll('.hl-icon').forEach(function (el) {
    el.textContent = GLYPHS[el.dataset.icon] || GLYPHS.server;
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Shows a node in the side panel and highlights the links that touch it. */
  function show(el) {
    var n = byId[el.dataset.node];
    if (!n) { return; }
    document.querySelectorAll('.hl-node.is-active').forEach(function (x) { x.classList.remove('is-active'); });
    el.classList.add('is-active');
    document.querySelectorAll('.hl-link, .hl-link-label').forEach(function (x) {
      var l = links[x.dataset.link];
      x.classList.toggle('is-hot', !!l && (l.from === n.id || l.to === n.id));
    });
    panel.innerHTML = '<h4>' + esc(n.label) + '</h4><p class="hl-role">' + esc(n.role || '') + '</p>' +
      (n.details && n.details.length ? '<ul>' + n.details.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' : '');
  }

  var dragging = false;
  document.querySelectorAll('.hl-node').forEach(function (el) {
    el.addEventListener('mouseenter', function () { if (!dragging) { show(el); } });
    el.addEventListener('focus', function () { show(el); });
    el.addEventListener('click', function () { show(el); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(el); }
    });
  });

  editor();

  /* Topology editor, in the spirit of draw.io: drag nodes (links, arrows, and network frames follow),
     drag the empty canvas to pan, zoom with the buttons or Ctrl + scroll, move the focused node with the
     arrow keys. The layout is kept in this browser only (localStorage); Reset returns to _data/homelab.yml. */
  function editor() {
    var svg = document.querySelector('.hl-map');
    var bar = document.querySelector('.hl-toolbar');
    if (!svg || !bar || !svg.getScreenCTM || !svg.dataset.canvas) { return; }
    var NW = 82, NH = 22, GAP = 5, GRID = 10;
    var size = svg.dataset.canvas.split(' ').map(Number);
    var CW = size[0], CH = size[1];
    var zoomLabel = bar.querySelector('output');
    var els = {}, pos = {}, view;

    /* The stored layout is tied to the published one, so editing homelab.yml discards old drafts. */
    var sig = nodes.map(function (n) { return n.id + ':' + n.x + ',' + n.y; }).join('|');
    var hash = 5381;
    for (var i = 0; i < sig.length; i++) { hash = ((hash << 5) + hash + sig.charCodeAt(i)) | 0; }
    var KEY = 'hl-layout-' + (hash >>> 0).toString(36);

    svg.querySelectorAll('.hl-node').forEach(function (g) {
      els[g.dataset.node] = g;
      g.setAttribute('aria-describedby', 'hl-map-hint');
    });

    function defaults() {
      pos = {};
      nodes.forEach(function (n) { pos[n.id] = { x: n.x, y: n.y }; });
      view = { x: 0, y: 0, w: CW };
    }

    function load() {
      defaults();
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) { saved = null; }
      if (!saved || typeof saved !== 'object') { return; }
      Object.keys(saved.pos || {}).forEach(function (id) {
        var p = saved.pos[id];
        if (pos[id] && p && isFinite(p[0]) && isFinite(p[1])) { pos[id] = { x: p[0], y: p[1] }; }
      });
      var v = saved.view;
      if (v && isFinite(v[0]) && isFinite(v[1]) && v[2] > 0) { view = { x: v[0], y: v[1], w: v[2] }; }
    }

    function save() {
      var out = {};
      Object.keys(pos).forEach(function (id) { out[id] = [pos[id].x, pos[id].y]; });
      try { localStorage.setItem(KEY, JSON.stringify({ pos: out, view: [view.x, view.y, view.w] })); } catch (e) { /* private mode */ }
    }

    function setView() {
      svg.setAttribute('viewBox', [view.x, view.y, view.w, view.w * CH / CW].map(function (v) { return Math.round(v * 10) / 10; }).join(' '));
      zoomLabel.textContent = Math.round(CW / view.w * 100) + '%';
    }

    /* Frame around a list of nodes: node box + pad, plus extra room at the bottom for the label. */
    function frame(b) {
      var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
      (b.nodes || []).forEach(function (id) {
        var p = pos[id];
        if (!p) { return; }
        x1 = Math.min(x1, p.x - NW); x2 = Math.max(x2, p.x + NW);
        y1 = Math.min(y1, p.y - NH); y2 = Math.max(y2, p.y + NH);
      });
      if (x1 === Infinity) { return null; }
      var pad = b.pad === undefined ? 16 : b.pad;
      var bottom = b.bottom === undefined ? pad : b.bottom;
      return { x: x1 - pad, y: y1 - pad, w: x2 - x1 + 2 * pad, h: y2 - y1 + pad + bottom };
    }

    function render() {
      Object.keys(els).forEach(function (id) {
        if (pos[id]) { els[id].setAttribute('transform', 'translate(' + (pos[id].x - NW) + ' ' + (pos[id].y - NH) + ')'); }
      });
      bounds.forEach(function (b, i) {
        var f = frame(b);
        var rect = svg.querySelector('rect[data-boundary="' + i + '"]');
        var text = svg.querySelector('text[data-boundary="' + i + '"]');
        if (!f || !rect) { return; }
        rect.setAttribute('x', f.x); rect.setAttribute('y', f.y);
        rect.setAttribute('width', f.w); rect.setAttribute('height', f.h);
        if (text) { text.setAttribute('x', f.x + 14); text.setAttribute('y', f.y + f.h - 12); }
      });
      links.forEach(function (l, i) {
        var a = pos[l.from], b = pos[l.to];
        var line = svg.querySelector('line[data-link="' + i + '"]');
        var text = svg.querySelector('text[data-link="' + i + '"]');
        if (!a || !b || !line) { return; }
        /* Clip the centre-to-centre line to both node boxes so the arrowheads sit on the edges. */
        var dx = b.x - a.x, dy = b.y - a.y;
        var t = Math.min(dx ? (NW + GAP) / Math.abs(dx) : Infinity, dy ? (NH + GAP) / Math.abs(dy) : Infinity);
        var hidden = !(t < 0.5);
        line.style.display = hidden ? 'none' : '';
        if (text) { text.style.display = hidden ? 'none' : ''; }
        if (hidden) { return; }
        line.setAttribute('x1', a.x + dx * t); line.setAttribute('y1', a.y + dy * t);
        line.setAttribute('x2', b.x - dx * t); line.setAttribute('y2', b.y - dy * t);
        if (!text) { return; }
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        if (Math.abs(dx) < Math.abs(dy) / 4) {
          text.setAttribute('x', mx + 8); text.setAttribute('y', my + 4); text.removeAttribute('text-anchor');
        } else {
          text.setAttribute('x', mx); text.setAttribute('y', my - 8); text.setAttribute('text-anchor', 'middle');
        }
      });
    }

    function zoom(f, cx, cy) {
      var w = Math.min(CW * 4, Math.max(CW / 4, view.w / f));
      var h = view.w * CH / CW;
      if (cx === undefined) { cx = view.x + view.w / 2; cy = view.y + h / 2; }
      var k = w / view.w;
      view = { x: cx - (cx - view.x) * k, y: cy - (cy - view.y) * k, w: w };
      setView();
      save();
    }

    function fit() {
      var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
      Object.keys(pos).forEach(function (id) {
        x1 = Math.min(x1, pos[id].x - NW); x2 = Math.max(x2, pos[id].x + NW);
        y1 = Math.min(y1, pos[id].y - NH); y2 = Math.max(y2, pos[id].y + NH);
      });
      bounds.forEach(function (b) {
        var f = frame(b);
        if (f) { x1 = Math.min(x1, f.x); y1 = Math.min(y1, f.y); x2 = Math.max(x2, f.x + f.w); y2 = Math.max(y2, f.y + f.h); }
      });
      if (x1 === Infinity) { return; }
      var m = 24;
      var w = Math.max(x2 - x1 + 2 * m, (y2 - y1 + 2 * m) * CW / CH);
      view = { x: (x1 + x2) / 2 - w / 2, y: (y1 + y2) / 2 - w * CH / CW / 2, w: w };
      setView();
      save();
    }

    function toSvg(e) {
      var p = svg.createSVGPoint();
      p.x = e.clientX; p.y = e.clientY;
      return p.matrixTransform(svg.getScreenCTM().inverse());
    }

    function snap(v, free) { return free ? Math.round(v) : Math.round(v / GRID) * GRID; }

    var drag = null, pan = null;

    svg.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) { return; }
      var g = e.target.closest('.hl-node');
      if (g && pos[g.dataset.node]) {
        var p = toSvg(e), id = g.dataset.node;
        drag = { g: g, id: id, px: p.x, py: p.y, ox: pos[id].x, oy: pos[id].y, cx: e.clientX, cy: e.clientY, moved: false };
        svg.setPointerCapture(e.pointerId);
        show(g);
      } else if (!g && e.pointerType === 'mouse') {
        e.preventDefault();
        pan = { cx: e.clientX, cy: e.clientY, vx: view.x, vy: view.y, k: view.w / svg.getBoundingClientRect().width };
        svg.setPointerCapture(e.pointerId);
        svg.classList.add('is-panning');
      }
    });

    svg.addEventListener('pointermove', function (e) {
      if (drag) {
        if (!drag.moved) {
          if (Math.abs(e.clientX - drag.cx) + Math.abs(e.clientY - drag.cy) < 4) { return; }
          drag.moved = dragging = true;
          drag.g.classList.add('is-dragging');
          drag.g.parentNode.appendChild(drag.g);
        }
        var p = toSvg(e);
        pos[drag.id] = { x: snap(drag.ox + p.x - drag.px, e.altKey), y: snap(drag.oy + p.y - drag.py, e.altKey) };
        render();
      } else if (pan) {
        view.x = pan.vx - (e.clientX - pan.cx) * pan.k;
        view.y = pan.vy - (e.clientY - pan.cy) * pan.k;
        setView();
      }
    });

    function end() {
      if (drag) {
        drag.g.classList.remove('is-dragging');
        if (drag.moved) {
          save();
          drag.g.focus({ preventScroll: true });
        }
      }
      if (pan) { svg.classList.remove('is-panning'); save(); }
      drag = pan = null;
      dragging = false;
    }
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);

    svg.addEventListener('wheel', function (e) {
      if (!e.ctrlKey && !e.metaKey) { return; }
      e.preventDefault();
      var p = toSvg(e);
      zoom(Math.exp(-e.deltaY * 0.0015), p.x, p.y);
    }, { passive: false });

    svg.addEventListener('keydown', function (e) {
      var g = e.target.closest('.hl-node');
      var step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!g || !step || !pos[g.dataset.node]) { return; }
      e.preventDefault();
      var d = e.shiftKey ? GRID * 4 : e.altKey ? 1 : GRID;
      var p = pos[g.dataset.node];
      pos[g.dataset.node] = { x: p.x + step[0] * d, y: p.y + step[1] * d };
      render();
      save();
    });

    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-hl]');
      if (!b) { return; }
      var act = b.dataset.hl;
      if (act === 'zoom-in') { zoom(1.25); }
      else if (act === 'zoom-out') { zoom(1 / 1.25); }
      else if (act === 'fit') { fit(); }
      else if (act === 'reset') {
        defaults();
        try { localStorage.removeItem(KEY); } catch (err) { /* private mode */ }
        render();
        setView();
      }
    });

    load();
    render();
    setView();
    svg.classList.add('hl-editable');
    bar.hidden = false;
  }

  /* Tabs (Topology, Pipeline, Progress, Results). Without JavaScript every pane stays visible. */
  var tablist = document.querySelector('.hl-tabs');
  if (!tablist) { return; }
  var tabs = [].slice.call(tablist.querySelectorAll('[role="tab"]'));
  tablist.closest('.hl-section').classList.add('hl-tabbed');
  tablist.hidden = false;

  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) { tab.focus(); }
  }

  tablist.addEventListener('click', function (e) {
    var tab = e.target.closest('[role="tab"]');
    if (tab) { select(tab); }
  });
  tablist.addEventListener('keydown', function (e) {
    var i = tabs.indexOf(document.activeElement);
    if (i < 0) { return; }
    var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) { return; }
    e.preventDefault();
    select(tabs[(next + tabs.length) % tabs.length], true);
  });

  /* Deep links such as /labs/#hl-pane-results open that tab. */
  var linked = location.hash && tabs.filter(function (t) { return '#' + t.getAttribute('aria-controls') === location.hash; })[0];
  select(linked || tabs[0]);
})();
