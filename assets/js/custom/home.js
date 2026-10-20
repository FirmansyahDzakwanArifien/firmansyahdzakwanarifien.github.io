/* Home page: experience filter, featured GIF previews, and uptime badges. */
(function() {
  /* Experience filter; the cards themselves are native <details name="exp"> accordions. */
  var filters = document.querySelector('.exp-filters');
  var cards = document.querySelectorAll('.exp-card');

  filters.addEventListener('click', function(e) {
    var btn = e.target.closest('.exp-filter-btn');
    if (!btn) return;
    var cat = btn.dataset.filter;
    filters.querySelector('.active').classList.remove('active');
    btn.classList.add('active');
    cards.forEach(function(card) {
      var hide = cat !== 'all' && card.dataset.cat !== cat;
      card.hidden = hide;
      if (hide) card.open = false;
    });
  });

  /* Swap a featured screenshot for its animated GIF on hover; the GIF only loads on first hover. */
  document.querySelectorAll('.feat-card img[data-gif]').forEach(function(img) {
    var card = img.closest('.feat-card');
    var still = img.src;
    card.addEventListener('mouseenter', function() { img.src = img.dataset.gif; });
    card.addEventListener('mouseleave', function() { img.src = still; });
  });

  /* Uptime badges: read the Upptime summary; badges stay hidden if it cannot be loaded. */
  var badges = document.querySelectorAll('[data-uptime]');
  if (badges.length && window.fetch) {
    fetch('https://raw.githubusercontent.com/FirmansyahDzakwanArifien/upptime/master/history/summary.json')
      .then(function(res) { return res.ok ? res.json() : []; })
      .then(function(sites) {
        badges.forEach(function(badge) {
          var site = sites.filter(function(s) { return s.name === badge.dataset.uptime; })[0];
          if (!site) { return; }
          var up = site.status === 'up';
          badge.classList.toggle('down', !up);
          badge.textContent = (up ? 'Online' : 'Down') + ' · ' + site.uptime + ' uptime';
          badge.title = 'Monitored by status.cyphera.my.id';
          badge.hidden = false;
        });
      })
      .catch(function() {});
  }
})();
