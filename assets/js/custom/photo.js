/* Album timeline and lightbox; reads its data from the #gphoto-data JSON block. */
(function () {
  var data = JSON.parse(document.getElementById('gphoto-data').textContent);
  var lightbox = document.getElementById('gphotoLightbox');
  var figure = document.getElementById('gphotoLbFigure');
  var titleEl = document.getElementById('gphotoLbTitle');
  var metaEl = document.getElementById('gphotoLbMeta');
  var eventEl = document.getElementById('gphotoLbEvent');
  var captionEl = document.getElementById('gphotoLbCaption');
  var currentIndex = 0;

  /* The lightbox image is created at runtime (rather than emitted as static
     markup) so the build-time content refactor doesn't wrap it in a link. */
  var lbImg = document.createElement('img');
  lbImg.alt = '';
  figure.insertBefore(lbImg, figure.firstChild);

  function render(index) {
    if (!data.length) return;
    currentIndex = (index + data.length) % data.length;
    var item = data[currentIndex];

    lbImg.src = item.src;
    lbImg.alt = item.alt || item.title || '';
    titleEl.textContent = item.title || '';
    metaEl.textContent = [item.date, item.location].filter(Boolean).join(' · ');
    eventEl.textContent = item.event || '';
    eventEl.hidden = !item.event;
    captionEl.textContent = item.caption || '';
    captionEl.hidden = !item.caption;
  }

  function open(index) {
    render(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* Build the timeline grid client-side, from the same data used by the
     lightbox, so thumbnails are never plain image tags in the built markup
     (that would otherwise get auto-wrapped into a link to the raw image). */
  var timeline = document.getElementById('gphotoTimeline');
  var emptyState = document.getElementById('gphotoEmpty');

  if (!data.length) {
    emptyState.hidden = false;
  } else {
    var currentMonth = null;
    var grid = null;

    data.forEach(function (item, index) {
      if (item.month !== currentMonth) {
        currentMonth = item.month;

        var heading = document.createElement('h2');
        heading.className = 'gphoto-date-heading';
        heading.textContent = item.month;
        timeline.appendChild(heading);

        grid = document.createElement('div');
        grid.className = 'gphoto-grid';
        timeline.appendChild(grid);
      }

      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'gphoto-tile';
      tile.setAttribute('aria-label', item.title || '');

      var thumb = document.createElement('img');
      thumb.src = item.src;
      thumb.alt = item.alt || item.title || '';
      thumb.loading = 'lazy';
      tile.appendChild(thumb);

      tile.addEventListener('click', function () {
        open(index);
      });

      grid.appendChild(tile);
    });
  }

  document.querySelectorAll('[data-gphoto-close]').forEach(function (el) {
    el.addEventListener('click', close);
  });

  document.getElementById('gphotoPrev').addEventListener('click', function () {
    render(currentIndex - 1);
  });

  document.getElementById('gphotoNext').addEventListener('click', function () {
    render(currentIndex + 1);
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') render(currentIndex - 1);
    if (e.key === 'ArrowRight') render(currentIndex + 1);
  });

  /* Swipe left/right to navigate on touch devices. */
  var touchStartX = null;
  var touchStartY = null;

  lightbox.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  lightbox.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStartX;
    var dy = t.clientY - touchStartY;
    touchStartX = null;

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      render(dx < 0 ? currentIndex + 1 : currentIndex - 1);
    }
  }, { passive: true });
})();
