/* Pre-paint state, loaded synchronously in <head> so nothing flashes on load:
   - the optional "hacker" theme variant (terminal "theme hacker", command palette, or "x");
   - the minimized desktop sidebar (sidebar button, command palette, or "[");
   - the home page intro splash. */
(function () {
  var KEY = 'theme-variant';
  var root = document.documentElement;

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function apply(variant) {
    if (variant === 'hacker') {
      root.setAttribute('data-variant', 'hacker');
    } else {
      root.removeAttribute('data-variant');
    }
  }

  apply(read());

  /* Intro splash (home page): decide before first paint, so CSS can show it without waiting for
     intro.js, which is deferred. Shown once per session and never with reduced motion. */
  try {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced && sessionStorage.getItem('intro-seen') !== '1') {
      root.classList.add('intro-active');
    }
  } catch (e) { /* storage blocked: skip the intro */ }

  /* Minimized sidebar: html[data-sidebar='collapsed']. Only desktop widths use it (see _sidebar.scss). */
  var SB_KEY = 'sidebar';

  function applySidebar(state) {
    if (state === 'collapsed') {
      root.setAttribute('data-sidebar', 'collapsed');
    } else {
      root.removeAttribute('data-sidebar');
    }
    var btn = document.getElementById('sidebar-collapse');
    if (btn) {
      var collapsed = state === 'collapsed';
      var label = collapsed ? 'Maximize sidebar' : 'Minimize sidebar';
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      btn.setAttribute('aria-label', label);
      btn.title = label + ' ( [ )';
      var text = btn.querySelector('span');
      if (text) { text.textContent = collapsed ? 'Maximize' : 'Minimize'; }
    }
  }

  try { applySidebar(localStorage.getItem(SB_KEY)); } catch (e) { /* storage blocked: start expanded */ }

  window.SiteSidebar = {
    collapsed: function () { return root.getAttribute('data-sidebar') === 'collapsed'; },
    set: function (collapsed) {
      var sidebar = document.getElementById('sidebar');
      /* Collapsing with the cursor on the sidebar would keep it open (hover); wait for the cursor to leave. */
      if (collapsed && sidebar && sidebar.matches(':hover')) { sidebar.classList.add('no-peek'); }
      applySidebar(collapsed ? 'collapsed' : 'expanded');
      try {
        if (collapsed) { localStorage.setItem(SB_KEY, 'collapsed'); } else { localStorage.removeItem(SB_KEY); }
      } catch (e) { /* storage blocked: applies to this page view only */ }
    },
    toggle: function () {
      this.set(!this.collapsed());
      return this.collapsed();
    },
    sync: function () { applySidebar(this.collapsed() ? 'collapsed' : 'expanded'); }
  };

  window.ThemeVariant = {
    get: function () { return root.getAttribute('data-variant') || 'default'; },
    set: function (variant) {
      apply(variant);
      try {
        if (variant === 'hacker') { localStorage.setItem(KEY, 'hacker'); } else { localStorage.removeItem(KEY); }
      } catch (e) { /* storage blocked: the variant still applies to this page view */ }
    },
    toggle: function () {
      this.set(this.get() === 'hacker' ? 'default' : 'hacker');
      return this.get();
    }
  };
})();
