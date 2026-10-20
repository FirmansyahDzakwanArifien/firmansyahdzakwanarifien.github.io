/* Site-wide behaviour that used to live in inline event handlers (kept out of the HTML for the CSP). */
(function () {
  /* [data-print]: print the page (CV "Print / Save as PDF" button). */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-print]')) {
      window.print();
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
