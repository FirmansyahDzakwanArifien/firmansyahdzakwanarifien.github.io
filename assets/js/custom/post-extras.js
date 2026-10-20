/* Posts and projects: a reading progress bar, and heading "#" anchors that also copy their link. */
(function () {
  var article = document.querySelector('article .content');
  if (!article) { return; }

  var bar = document.createElement('div');
  bar.id = 'read-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  var ticking = false;
  function update() {
    ticking = false;
    var rect = article.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    var progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 1;
    bar.style.transform = 'scaleX(' + progress.toFixed(3) + ')';
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();

  article.addEventListener('click', function (e) {
    var anchor = e.target.closest('a.anchor');
    if (!anchor || !navigator.clipboard) { return; }
    var url = location.origin + location.pathname + anchor.getAttribute('href');
    navigator.clipboard.writeText(url).then(function () {
      if (window.siteToast) { window.siteToast('Link to this section copied'); }
    });
  });
})();
