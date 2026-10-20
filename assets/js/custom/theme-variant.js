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
