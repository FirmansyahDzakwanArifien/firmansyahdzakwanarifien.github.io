/* Homelab section: node details on hover, focus, or tap; SVG node icons; and the section tabs. */
(function () {
  var nodes = JSON.parse(document.getElementById('hl-data').textContent || '[]');
  var panel = document.getElementById('hl-panel');
  var byId = {};
  nodes.forEach(function (n) { byId[n.id] = n; });

  /* Font Awesome glyphs by name; SVG <text> cannot use the CSS classes directly. */
  var GLYPHS = {
    server: '\uf233', 'shield-halved': '\uf3ed', 'network-wired': '\uf6ff', cloud: '\uf0c2',
    desktop: '\uf390', database: '\uf1c0', eye: '\uf06e', router: '\uf8da', laptop: '\uf109',
    'hard-drive': '\uf0a0', wifi: '\uf1eb', lock: '\uf023', 'chart-line': '\uf201', box: '\uf466',
    brain: '\uf5dc', 'diagram-project': '\uf542', bell: '\uf0f3'
  };
  document.querySelectorAll('.hl-icon').forEach(function (el) {
    el.textContent = GLYPHS[el.dataset.icon] || GLYPHS.server;
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function show(el) {
    var n = byId[el.dataset.node];
    if (!n) { return; }
    document.querySelectorAll('.hl-node.is-active').forEach(function (x) { x.classList.remove('is-active'); });
    el.classList.add('is-active');
    panel.innerHTML = '<h4>' + esc(n.label) + '</h4><p class="hl-role">' + esc(n.role || '') + '</p>' +
      (n.details && n.details.length ? '<ul>' + n.details.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' : '');
  }

  document.querySelectorAll('.hl-node').forEach(function (el) {
    el.addEventListener('mouseenter', function () { show(el); });
    el.addEventListener('focus', function () { show(el); });
    el.addEventListener('click', function () { show(el); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(el); }
    });
  });

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
