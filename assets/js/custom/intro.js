/* Terminal intro. Whether it shows is decided in <head> (theme-variant.js adds html.intro-active,
   and CSS displays #intro), so this script can be deferred without the page flashing first. */
(function () {
  var root = document.getElementById('intro');
  if (!root) { return; }

  var html = document.documentElement;
  if (!html.classList.contains('intro-active')) { root.remove(); return; }

  try { sessionStorage.setItem('intro-seen', '1'); } catch (e) {}

  var lines = root.querySelectorAll('.intro-line');
  var timers = [];
  var done = false;


  function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }

  function finish() {
    if (done) { return; }
    done = true;
    timers.forEach(window.clearTimeout);
    root.classList.add('is-done');
    html.classList.add('intro-closing'); /* unlock scrolling now; the overlay fades out */
    later(function () {
      root.remove();
      html.classList.remove('intro-active', 'intro-closing');
    }, 600);
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
