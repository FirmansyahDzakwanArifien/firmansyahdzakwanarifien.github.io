/* CTF page: checks submitted flags against the SHA-256 hashes in #ctf-data and keeps
   progress in this browser only (localStorage). */
(function () {
  var KEY = 'ctf-solved';
  var challenges = JSON.parse(document.getElementById('ctf-data').textContent || '[]');
  var list = document.getElementById('ctf-list');
  var form = document.getElementById('ctf-form');
  var input = document.getElementById('ctf-input');
  var msg = document.getElementById('ctf-msg');

  function loadSolved() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }

  var solved = loadSolved();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(solved)); } catch (e) { /* progress lasts for this page view */ }
  }

  function sha256(text) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render() {
    var points = 0;
    var total = 0;
    list.innerHTML = challenges.map(function (c) {
      var done = solved.indexOf(c.id) >= 0;
      total += c.points;
      if (done) { points += c.points; }
      return '<li class="ctf-item' + (done ? ' solved' : '') + '">' +
        '<i class="ctf-icon fas ' + (done ? 'fa-flag-checkered' : 'fa-flag') + '"></i>' +
        '<div><p class="ctf-title">' + esc(c.title) + '</p><span class="ctf-cat">' + esc(c.category) + (done ? ' · captured' : '') + '</span></div>' +
        '<span class="ctf-points">' + c.points + ' pts</span>' +
        '<details class="ctf-hint"><summary>Hint</summary><p>' + esc(c.hint) + '</p></details>' +
        '</li>';
    }).join('');
    var count = challenges.filter(function (c) { return solved.indexOf(c.id) >= 0; }).length;
    document.getElementById('ctf-score').textContent = count + ' / ' + challenges.length + ' flags · ' + points + ' / ' + total + ' pts';
    document.getElementById('ctf-bar').style.width = (challenges.length ? (count / challenges.length) * 100 : 0) + '%';
    document.getElementById('ctf-done').hidden = !challenges.length || count < challenges.length;
  }

  function say(text, kind) {
    msg.textContent = text;
    msg.className = 'ctf-msg ' + (kind || '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var flag = input.value.trim();
    if (!/^cyphera\{[^}]+\}$/.test(flag)) {
      say('Flags look like cyphera{...}.', 'bad');
      return;
    }
    if (!window.crypto || !crypto.subtle) {
      say('Your browser cannot check flags here (needs HTTPS and Web Crypto).', 'bad');
      return;
    }
    sha256(flag).then(function (hash) {
      var hit = challenges.filter(function (c) { return c.hash === hash; })[0];
      if (!hit) {
        say('Not a valid flag. Keep digging.', 'bad');
      } else if (solved.indexOf(hit.id) >= 0) {
        say('Already captured: ' + hit.title + '.', 'ok');
      } else {
        solved.push(hit.id);
        save();
        say('Captured "' + hit.title + '" (+' + hit.points + ' pts).', 'ok');
        input.value = '';
        render();
      }
    });
  });

  document.getElementById('ctf-reset').addEventListener('click', function () {
    solved = [];
    save();
    say('Progress reset.', '');
    render();
  });

  render();
})();
