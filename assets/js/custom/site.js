/* Site-wide behaviour that used to live in inline event handlers (kept out of the HTML for the CSP),
   plus a small toast helper shared by the other scripts. */
(function () {
  /* window.siteToast(message): brief notice at the bottom of the screen. */
  var toastEl = null;
  var toastTimer = null;
  window.siteToast = function (message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'site-toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2200);
  };

  /* [data-print]: print the page (CV "Print / Save as PDF" button); ?print=1 prints on load. */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-print]')) {
      window.print();
    }
  });
  if (/[?&]print=1\b/.test(location.search) && document.querySelector('[data-print]')) {
    window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 300); });
  }

  /* [data-qris-open]: open the "Traktir kopi" QRIS dialog (_includes/qris-dialog.html). */
  window.openQris = function () {
    var dialog = document.getElementById('qris-dialog');
    if (!dialog) { return false; }
    if (dialog.showModal) { dialog.showModal(); } else { dialog.setAttribute('open', ''); }
    return true;
  };
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-qris-open]')) { e.preventDefault(); window.openQris(); return; }
    /* A click on the dialog's backdrop (outside its box) closes it. */
    if (e.target.id === 'qris-dialog') { e.target.close(); }
  });

  /* Sidebar minimize / maximize (desktop). State and API live in theme-variant.js (runs before paint). */
  var sidebar = document.getElementById('sidebar');
  if (sidebar && window.SiteSidebar) {
    window.SiteSidebar.sync();
    sidebar.addEventListener('mouseleave', function () { sidebar.classList.remove('no-peek'); });
    /* Leaving a link inside the minimized sidebar should not leave it stuck open on touch screens. */
    sidebar.addEventListener('click', function (e) {
      if (e.target.closest('a[href]') && window.SiteSidebar.collapsed()) { sidebar.classList.add('no-peek'); }
    });
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-sidebar-toggle]') && window.SiteSidebar) {
      e.preventDefault();
      var collapsed = window.SiteSidebar.toggle();
      if (!e.target.closest('#sidebar')) {
        window.siteToast(collapsed ? 'Sidebar minimized: hover it to peek' : 'Sidebar maximized');
      }
    }
  });

  /* [data-hide-on-error]: hide an image that fails to load (sidebar avatar). */
  document.querySelectorAll('img[data-hide-on-error]').forEach(function (img) {
    function hide() { img.style.display = 'none'; }
    if (img.complete && img.naturalWidth === 0) {
      hide();
    } else {
      img.addEventListener('error', hide);
    }
  });
})();
