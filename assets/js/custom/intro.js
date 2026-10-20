/* Terminal intro; loaded synchronously right after #intro so the page never flashes first. */
(function () {
  var root = document.getElementById('intro');
  if (!root) { return; }

  var KEY = 'intro-seen';
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var styled = window.getComputedStyle(root).position === 'fixed';
  if (seen || reduced || !styled) { root.remove(); return; }

  try { sessionStorage.setItem(KEY, '1'); } catch (e) {}

  var html = document.documentElement;
  var lines = root.querySelectorAll('.intro-line');
  var timers = [];
  var done = false;

  root.style.display = '';
  html.classList.add('intro-lock');

  function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }

  function finish() {
    if (done) { return; }
    done = true;
    timers.forEach(window.clearTimeout);
    root.classList.add('is-done');
    html.classList.remove('intro-lock');
    later(function () { root.remove(); }, 600);
    ['keydown', 'wheel', 'touchstart'].forEach(function (type) {
      window.removeEventListener(type, finish);
    });
  }

  /* Reveal lines one by one; commands are typed out character by character. */
  function show(i) {
    if (i >= lines.length) { later(finish, 650); return; }
    var line = lines[i];
    var typed = line.querySelector('[data-type]');
    line.classList.add('is-on');
    if (!typed) { later(function () { show(i + 1); }, 160); return; }
    var text = typed.textContent;
    var n = 0;
    typed.textContent = '';
    (function type() {
      typed.textContent = text.slice(0, ++n);
      if (n < text.length) { later(type, 38); } else { later(function () { show(i + 1); }, 220); }
    })();
  }

  root.addEventListener('click', finish);
  ['keydown', 'wheel', 'touchstart'].forEach(function (type) {
    window.addEventListener(type, finish, { passive: true });
  });

  later(function () { show(0); }, 250);
})();
