/* Homelab page: shows a node's role and details on hover, focus, or tap, and draws the node icons. */
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
    panel.innerHTML = '<h3>' + esc(n.label) + '</h3><p class="hl-role">' + esc(n.role || '') + '</p>' +
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
})();
