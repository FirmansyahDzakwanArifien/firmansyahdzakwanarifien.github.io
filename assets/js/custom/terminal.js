---
# Rendered by Jekyll so the terminal can embed the profile data.
---
{%- assign profile = site.data.profile -%}
/* Easter-egg terminal: press ` (or click a [data-term-open] element) to open. Built on first use. */
(function () {
  var DATA = {
    name: {{ profile.name | jsonify }},
    alias: {{ profile.alias | jsonify }},
    headline: {{ profile.headline | jsonify }},
    bio: {{ profile.bio | jsonify }},
    email: {{ profile.email | jsonify }},
    education: {{ profile.education | jsonify }},
    skills: {{ profile.skill_groups | jsonify }},
    links: {{ profile.links | jsonify }},
    projects: {{ profile.projects | jsonify }},
    experience: {{ site.data.experience | jsonify }},
    certs: {{ site.data.certifications | jsonify }},
    labs: {{ site.data.labs | jsonify }},
    support: {{ profile.support | jsonify }},
    contactPage: {{ '/contact/' | relative_url | jsonify }},
    cv: {{ '/cv/' | relative_url | jsonify }},
    home: {{ '/' | relative_url | jsonify }}
  };

  var root = null;
  var out = null;
  var input = null;
  var history = [];
  var cursor = 0;
  var lastFocus = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function link(url, label) {
    var external = /^https?:/.test(url);
    return '<a href="' + esc(url) + '"' + (external ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(label || url) + '</a>';
  }

  function print(html, cls) {
    var line = document.createElement('div');
    line.className = 'term-line' + (cls ? ' ' + cls : '');
    line.innerHTML = html;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  }

  var COMMANDS = {
    help: {
      desc: 'list commands',
      run: function () {
        Object.keys(COMMANDS).forEach(function (name) {
          if (COMMANDS[name].hidden) { return; }
          print('<span class="term-key">' + name + '</span>' + esc(COMMANDS[name].desc));
        });
      }
    },
    whoami: {
      desc: 'who is behind this site',
      run: function () {
        print('<b>' + esc(DATA.name) + '</b> <span class="term-dim">(' + esc(DATA.alias) + ')</span>');
        print(esc(DATA.headline), 'term-dim');
      }
    },
    about: {
      desc: 'short bio',
      run: function () { print(esc(DATA.bio)); }
    },
    experience: {
      desc: 'work history',
      run: function () {
        DATA.experience.forEach(function (job) {
          print('<span class="term-key">' + esc(job.period) + '</span>' + esc(job.role) + ' <span class="term-dim">@ ' + esc(job.company) + '</span>');
        });
      }
    },
    certs: {
      desc: 'certifications & training',
      run: function () {
        DATA.certs.forEach(function (cert) {
          print('<span class="term-ok">[' + esc(cert.badge) + ']</span> ' + link(DATA.home.replace(/\/$/, '') + cert.url, cert.name) + ' <span class="term-dim">' + esc(cert.issuer) + ', ' + cert.year + '</span>');
        });
      }
    },
    labs: {
      desc: 'security writeups & labs',
      run: function () {
        DATA.labs.forEach(function (lab) {
          var url = lab.url.charAt(0) === '/' ? DATA.home.replace(/\/$/, '') + lab.url : lab.url;
          print('<span class="term-key">' + esc(lab.platform) + '</span>' + link(url, lab.title));
        });
      }
    },
    skills: {
      desc: 'skill groups',
      run: function () {
        DATA.skills.forEach(function (group) {
          print('<span class="term-key">' + esc(group.title) + '</span>' + esc(group.tags.join(', ')));
        });
      }
    },
    projects: {
      desc: 'selected projects',
      run: function () {
        DATA.projects.forEach(function (p) {
          print(link(p.url.charAt(0) === '/' ? DATA.home.replace(/\/$/, '') + p.url : p.url, p.name) + ' <span class="term-dim">' + esc(p.kind) + '</span>');
        });
      }
    },
    education: {
      desc: 'studies',
      run: function () {
        print(esc(DATA.education.degree));
        print(esc(DATA.education.school + ' · ' + DATA.education.period), 'term-dim');
      }
    },
    contact: {
      desc: 'how to reach me',
      run: function () {
        DATA.links.forEach(function (l) {
          print('<span class="term-key">' + esc(l.label) + '</span>' + link(l.url, l.value));
        });
      }
    },
    cv: {
      desc: 'open the CV page',
      run: function () { print('opening ' + esc(DATA.cv) + ' ...', 'term-dim'); window.location.href = DATA.cv; }
    },
    clear: {
      desc: 'clear the screen',
      run: function () { out.innerHTML = ''; }
    },
    exit: {
      desc: 'close the terminal',
      run: function () { close(); }
    },
    theme: {
      desc: 'theme [hacker|default|dark|light]',
      run: function (args) {
        var want = (args[0] || '').toLowerCase();
        if (want === 'hacker' || want === 'default') {
          if (window.ThemeVariant) { window.ThemeVariant.set(want); }
          print('theme: ' + want, 'term-ok');
        } else if ((want === 'dark' || want === 'light') && window.Theme && window.Theme.switchable) {
          if ((window.Theme.visualState === 'dark') !== (want === 'dark')) { window.Theme.flip(); }
          print('mode: ' + want, 'term-ok');
        } else {
          print('usage: theme hacker | default | dark | light  <span class="term-dim">(now: ' + esc(window.ThemeVariant ? window.ThemeVariant.get() : 'default') + ')</span>');
        }
      }
    },
    palette: {
      desc: 'open the command palette (Ctrl+K)',
      run: function () { close(); if (window.CommandPalette) { window.CommandPalette.open(); } }
    },
    ctf: {
      desc: 'capture the flag: 5 flags hidden on this site',
      run: function () {
        print('5 flags in the format <span class="term-ok">cyphera{...}</span> are hidden around this site.');
        print('submit them at ' + link(DATA.home.replace(/\/$/, '') + '/ctf/', '/ctf/') + '. one of them is closer than you think.', 'term-dim');
      }
    },
    coffee: {
      desc: 'buy me a coffee',
      run: function () {
        var s = DATA.support || {};
        if (!s.trakteer && !s.kofi) { print('no coffee links yet. a message is just as nice: ' + link(DATA.contactPage, 'contact page')); return; }
        if (s.trakteer) { print('<span class="term-key">Trakteer</span>' + link('https://trakteer.id/' + s.trakteer) + ' <span class="term-dim">QRIS, e-wallet, bank</span>'); }
        if (s.kofi) { print('<span class="term-key">Ko-fi</span>' + link('https://ko-fi.com/' + s.kofi) + ' <span class="term-dim">PayPal, card</span>'); }
      }
    },
    sudo: {
      hidden: true,
      run: function () { print('nice try. this incident will be reported.', 'term-err'); }
    },
    ls: {
      hidden: true,
      run: function (args) {
        var all = args.some(function (a) { return /^-[a-z]*a/.test(a); });
        print((all ? '.  ..  .flag  ' : '') + 'about  certs  contact  cv  education  experience  labs  projects  skills');
      }
    },
    cat: {
      hidden: true,
      run: function (args) {
        var file = args[0];
        if (!file) { print('usage: cat &lt;file&gt;', 'term-dim'); return; }
        if (file === '.flag' || file === './.flag') {
          /* CTF flag 4/5, base64 so it does not show up in a plain-text search of the source. */
          print(atob('Y3lwaGVyYXt0M3JtMW40bF92M2wwYzF0eX0='), 'term-ok');
          return;
        }
        if (COMMANDS[file] && !COMMANDS[file].hidden) { COMMANDS[file].run([]); return; }
        print('cat: ' + esc(file) + ': No such file or directory', 'term-err');
      }
    }
  };

  function exec(raw) {
    var line = raw.trim();
    print('<span class="term-prompt">$</span>' + esc(line));
    if (!line) { return; }
    history.push(line);
    cursor = history.length;
    var parts = line.split(/\s+/);
    var name = parts[0].toLowerCase();
    var args = parts.slice(1);
    if (name === 'rm') { print('permission denied: this portfolio is read-only.', 'term-err'); return; }
    var cmd = COMMANDS[name];
    if (cmd) { cmd.run(args); } else { print(esc(name) + ': command not found. try <span class="term-key">help</span>', 'term-err'); }
  }

  function build() {
    root = document.createElement('div');
    root.id = 'term';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Terminal');
    root.innerHTML =
      '<div class="term-window">' +
        '<div class="term-bar"><i></i><i></i><i></i><span>' + esc(DATA.alias.toLowerCase()) + '@portfolio: ~</span>' +
        '<button type="button" class="term-close" aria-label="Close terminal">esc</button></div>' +
        '<div class="term-out" aria-live="polite"></div>' +
        '<label class="term-input"><span class="term-prompt">$</span>' +
        '<input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Command"></label>' +
      '</div>';
    document.body.appendChild(root);
    out = root.querySelector('.term-out');
    input = root.querySelector('input');

    root.addEventListener('click', function (e) {
      if (e.target === root || e.target.closest('.term-close')) { close(); }
      else if (!e.target.closest('a') && !window.getSelection().toString()) { input.focus(); }
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        exec(input.value);
        input.value = '';
      } else if (e.key === 'ArrowUp' && cursor > 0) {
        e.preventDefault();
        input.value = history[--cursor];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        cursor = Math.min(cursor + 1, history.length);
        input.value = history[cursor] || '';
      } else if (e.key === 'Tab') {
        e.preventDefault();
        var match = Object.keys(COMMANDS).filter(function (n) { return !COMMANDS[n].hidden && n.indexOf(input.value) === 0; });
        if (match.length === 1) { input.value = match[0]; }
        else if (match.length > 1) { print(match.join('  '), 'term-dim'); }
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        out.innerHTML = '';
      }
    });

    print('Welcome to ' + esc(DATA.alias.toLowerCase()) + '@portfolio. Type <span class="term-key">help</span> to get started.', 'term-dim');
  }

  function open() {
    if (!root) { build(); }
    lastFocus = document.activeElement;
    root.classList.add('is-open');
    document.documentElement.classList.add('term-lock');
    input.focus();
  }

  function close() {
    if (!root || !root.classList.contains('is-open')) { return; }
    root.classList.remove('is-open');
    document.documentElement.classList.remove('term-lock');
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  function typing(el) {
    return el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  }

  document.addEventListener('keydown', function (e) {
    var isOpen = root && root.classList.contains('is-open');
    if (e.key === 'Escape' && isOpen) { close(); return; }
    if (e.key === '`' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (isOpen) { e.preventDefault(); close(); }
      else if (!typing(e.target)) { e.preventDefault(); open(); }
    }
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-term-open]')) { open(); }
  });

  window.SiteTerminal = { open: open, close: close };
})();
