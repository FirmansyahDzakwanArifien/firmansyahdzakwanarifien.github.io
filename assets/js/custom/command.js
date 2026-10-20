---
# Command palette (Ctrl/Cmd+K) and keyboard shortcuts (?). Rendered by Jekyll for a few site values.
---
(function () {
  var DATA_URL = {{ '/assets/js/data/palette.json' | relative_url | jsonify }};
  var EMAIL = {{ site.social.email | jsonify }};
  var ROUTES = {
    h: {{ '/' | relative_url | jsonify }},
    l: {{ '/labs/' | relative_url | jsonify }},
    c: {{ '/cv/' | relative_url | jsonify }},
    p: {{ '/projects/' | relative_url | jsonify }},
    a: {{ '/album/' | relative_url | jsonify }},
    m: {{ '/milestone/' | relative_url | jsonify }},
    f: {{ '/ctf/' | relative_url | jsonify }},
    k: {{ '/contact/' | relative_url | jsonify }}
  };
  var GROUP_ORDER = ['Actions', 'Pages', 'Labs', 'Projects', 'Certifications', 'Posts'];

  var ACTIONS = [
    { t: 'Open terminal', i: 'fas fa-terminal', h: '`', run: function () { if (window.SiteTerminal) { window.SiteTerminal.open(); } } },
    { t: 'Toggle light / dark mode', i: 'fas fa-circle-half-stroke', h: 'd', run: toggleMode },
    { t: 'Toggle hacker theme', i: 'fas fa-user-secret', h: 'x', run: toggleHacker },
    { t: 'Copy email address', i: 'fas fa-envelope', h: EMAIL, run: copyEmail },
    { t: 'Send a message', i: 'fas fa-pen-to-square', h: 'Contact page', run: function () { location.href = ROUTES.k; } },
    { t: 'Print / save CV as PDF', i: 'fas fa-print', h: 'Opens the CV', run: function () { location.href = ROUTES.c + '?print=1'; } },
    { t: 'Start the CTF', i: 'fas fa-flag', h: 'Find the hidden flags', run: function () { location.href = ROUTES.f; } },
    { t: 'Keyboard shortcuts', i: 'fas fa-keyboard', h: '?', run: function () { openShortcuts(); } }
  ];

  var entries = null;
  var root = null;
  var input = null;
  var list = null;
  var shown = [];
  var active = 0;
  var lastFocus = null;

  function toast(msg) { if (window.siteToast) { window.siteToast(msg); } }

  function toggleMode() {
    if (window.Theme && window.Theme.switchable) { window.Theme.flip(); } else { toast('Color mode is fixed by the site settings'); }
  }

  function toggleHacker() {
    if (!window.ThemeVariant) { return; }
    toast(window.ThemeVariant.toggle() === 'hacker' ? 'Hacker theme on' : 'Hacker theme off');
  }

  function copyEmail() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(EMAIL).then(function () { toast('Email copied: ' + EMAIL); });
    } else {
      location.href = 'mailto:' + EMAIL;
    }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function load() {
    if (entries) { return Promise.resolve(entries); }
    return fetch(DATA_URL)
      .then(function (res) { return res.ok ? res.json() : []; })
      .catch(function () { return []; })
      .then(function (items) {
        entries = ACTIONS.map(function (a) { return { g: 'Actions', t: a.t, i: a.i, h: a.h, run: a.run }; }).concat(items);
        return entries;
      });
  }

  /* Rank: title prefix > word prefix > substring in title > substring in hint/group. */
  function score(entry, q) {
    var t = entry.t.toLowerCase();
    if (!q) { return entry.g === 'Posts' ? 1 : 2; }
    if (t.indexOf(q) === 0) { return 10; }
    if ((' ' + t).indexOf(' ' + q) >= 0) { return 8; }
    if (t.indexOf(q) >= 0) { return 6; }
    if ((entry.h + ' ' + entry.g).toLowerCase().indexOf(q) >= 0) { return 3; }
    return 0;
  }

  function render() {
    var q = input.value.trim().toLowerCase();
    shown = entries
      .map(function (e) { return { e: e, s: score(e, q) }; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) {
        return (GROUP_ORDER.indexOf(a.e.g) - GROUP_ORDER.indexOf(b.e.g)) || (b.s - a.s);
      })
      .slice(0, q ? 40 : 24)
      .map(function (x) { return x.e; });
    active = 0;

    if (!shown.length) {
      list.innerHTML = '<li class="cmdk-empty">No results for "' + esc(q) + '"</li>';
      return;
    }
    var html = '';
    var group = null;
    shown.forEach(function (e, idx) {
      if (e.g !== group) {
        group = e.g;
        html += '<li class="cmdk-group" role="presentation">' + esc(group) + '</li>';
      }
      html += '<li class="cmdk-item" role="option" id="cmdk-' + idx + '" data-idx="' + idx + '">' +
        '<i class="' + esc(e.i || 'fas fa-arrow-right') + '"></i><span>' + esc(e.t) + '</span>' +
        (e.h ? '<span class="cmdk-hint">' + esc(e.h) + '</span>' : '') + '</li>';
    });
    list.innerHTML = html;
    highlight();
  }

  function highlight() {
    list.querySelectorAll('.cmdk-item').forEach(function (el) {
      el.classList.toggle('is-active', Number(el.dataset.idx) === active);
    });
    var cur = list.querySelector('#cmdk-' + active);
    if (cur) {
      cur.scrollIntoView({ block: 'nearest' });
      input.setAttribute('aria-activedescendant', cur.id);
    }
  }

  function choose(idx) {
    var e = shown[idx];
    if (!e) { return; }
    close();
    if (e.run) { e.run(); return; }
    if (/^https?:/.test(e.u) && e.u.indexOf(location.origin) !== 0) {
      window.open(e.u, '_blank', 'noopener');
    } else {
      location.href = e.u;
    }
  }

  function build() {
    root = document.createElement('div');
    root.id = 'cmdk';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Command palette');
    root.innerHTML =
      '<div class="cmdk-box">' +
        '<label class="cmdk-input"><i class="fas fa-magnifying-glass"></i>' +
        '<input type="text" placeholder="Jump to a page, post, lab, or action..." autocomplete="off" spellcheck="false" ' +
        'role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-label="Command"><kbd>Esc</kbd></label>' +
        '<ul class="cmdk-list" id="cmdk-list" role="listbox"></ul>' +
        '<div class="cmdk-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span><span><kbd>?</kbd> shortcuts</span></div>' +
      '</div>';
    document.body.appendChild(root);
    input = root.querySelector('input');
    list = root.querySelector('.cmdk-list');

    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, shown.length - 1); highlight(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); highlight(); }
      else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
    });
    list.addEventListener('mousemove', function (e) {
      var item = e.target.closest('.cmdk-item');
      if (item && Number(item.dataset.idx) !== active) { active = Number(item.dataset.idx); highlight(); }
    });
    list.addEventListener('click', function (e) {
      var item = e.target.closest('.cmdk-item');
      if (item) { choose(Number(item.dataset.idx)); }
    });
    root.addEventListener('click', function (e) { if (e.target === root) { close(); } });
  }

  function open() {
    if (!root) { build(); }
    lastFocus = document.activeElement;
    root.classList.add('is-open');
    document.documentElement.classList.add('cmdk-lock');
    input.value = '';
    input.focus();
    load().then(render);
  }

  function close() {
    if (!root || !root.classList.contains('is-open')) { return; }
    root.classList.remove('is-open');
    document.documentElement.classList.remove('cmdk-lock');
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  /* ---------- Keyboard shortcuts overlay ---------- */

  var help = null;

  function openShortcuts() {
    if (!help) {
      help = document.createElement('div');
      help.id = 'shortcuts';
      help.setAttribute('role', 'dialog');
      help.setAttribute('aria-modal', 'true');
      help.setAttribute('aria-label', 'Keyboard shortcuts');
      var rows = [
        ['<kbd>Ctrl</kbd> <kbd>K</kbd>', 'Command palette'],
        ['<kbd>`</kbd>', 'Terminal'],
        ['<kbd>?</kbd>', 'This help'],
        ['<kbd>g</kbd> <kbd>h</kbd>', 'Home'],
        ['<kbd>g</kbd> <kbd>l</kbd>', 'Labs'],
        ['<kbd>g</kbd> <kbd>p</kbd>', 'Projects'],
        ['<kbd>g</kbd> <kbd>c</kbd>', 'CV'],
        ['<kbd>g</kbd> <kbd>a</kbd>', 'Album'],
        ['<kbd>g</kbd> <kbd>m</kbd>', 'Milestone'],
        ['<kbd>g</kbd> <kbd>f</kbd>', 'CTF'],
        ['<kbd>g</kbd> <kbd>k</kbd>', 'Contact'],
        ['<kbd>d</kbd>', 'Toggle light / dark'],
        ['<kbd>x</kbd>', 'Toggle hacker theme'],
        ['<kbd>Esc</kbd>', 'Close dialogs']
      ];
      help.innerHTML = '<div class="shortcuts-box"><h2>Keyboard shortcuts</h2><dl>' +
        rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl></div>';
      help.addEventListener('click', function (e) { if (e.target === help) { closeShortcuts(); } });
      document.body.appendChild(help);
    }
    help.classList.add('is-open');
  }

  function closeShortcuts() { if (help) { help.classList.remove('is-open'); } }

  function typing(el) {
    return el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  }

  var pendingG = 0;

  document.addEventListener('keydown', function (e) {
    var paletteOpen = root && root.classList.contains('is-open');
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (paletteOpen) { close(); } else { open(); }
      return;
    }
    if (e.key === 'Escape') { close(); closeShortcuts(); return; }
    if (paletteOpen || typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) { return; }
    if (document.querySelector('#term.is-open')) { return; }

    var k = e.key;
    if (pendingG && Date.now() - pendingG < 1200 && ROUTES[k]) {
      pendingG = 0;
      location.href = ROUTES[k];
      return;
    }
    pendingG = 0;
    if (k === 'g') { pendingG = Date.now(); return; }
    if (k === '?') { e.preventDefault(); openShortcuts(); return; }
    if (k === 'd') { toggleMode(); return; }
    if (k === 'x') { toggleHacker(); }
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-cmdk-open]')) { e.preventDefault(); open(); }
  });

  window.CommandPalette = { open: open, close: close };
})();
