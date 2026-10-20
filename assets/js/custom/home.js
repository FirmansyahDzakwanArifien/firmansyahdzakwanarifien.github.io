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
    var stillSet = img.getAttribute('srcset');
    /* srcset would win over src, so it is removed while the animation plays. */
    card.addEventListener('mouseenter', function() { img.removeAttribute('srcset'); img.src = img.dataset.gif; });
    card.addEventListener('mouseleave', function() { if (stillSet) { img.setAttribute('srcset', stillSet); } img.src = still; });
  });

  /* Uptime badges: read the Upptime summary; badges stay invisible (space kept) if it cannot be loaded. */
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
          badge.classList.remove('is-pending');
        });
      })
      .catch(function() {});
  }
})();

/* GitHub heatmap: one shared caption shows the hovered day (cheaper than a <title> per cell). */
(function() {
  var cal = document.querySelector('.gh-calendar');
  var tip = document.getElementById('gh-tip');
  if (!cal || !tip) { return; }
  var fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  cal.addEventListener('mouseover', function(e) {
    var d = e.target.getAttribute && e.target.getAttribute('data-d');
    if (d) { tip.textContent = fmt.format(new Date(d + 'T00:00:00')); }
  });
})();

/* Profile card CTF banner: show this visitor's progress (stored by /ctf/ in localStorage). */
(function() {
  var banner = document.querySelector('.hero-ctf');
  if (!banner) { return; }
  var total = Number(banner.dataset.ctfTotal) || 0;
  var found = 0;
  try { found = (JSON.parse(localStorage.getItem('ctf-solved')) || []).length; } catch (e) { found = 0; }
  if (!found || !total) { return; }
  var label = banner.querySelector('[data-ctf-progress]');
  if (found >= total) {
    banner.classList.add('is-done');
    label.textContent = 'All ' + total + ' found ✓';
  } else {
    label.textContent = found + '/' + total + ' found →';
  }
})();
