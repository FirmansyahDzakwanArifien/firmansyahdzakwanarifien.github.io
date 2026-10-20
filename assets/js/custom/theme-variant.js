/* Optional "hacker" theme variant. Loaded synchronously in <head> so the variant is applied before
   first paint. Toggled from the terminal ("theme hacker"), the command palette, or the "x" shortcut. */
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
