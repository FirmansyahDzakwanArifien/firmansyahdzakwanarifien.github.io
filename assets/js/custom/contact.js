/* Contact page: copy-email buttons and a message composer that opens the visitor's own email app
   (mailto:), so no third-party form service ever sees the message. */
(function () {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (!btn) { return; }
    e.preventDefault();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(btn.dataset.copy).then(function () {
        if (window.siteToast) { window.siteToast('Copied: ' + btn.dataset.copy); }
      });
    }
  });

  var form = document.getElementById('compose');
  if (!form) { return; }
  var security = document.getElementById('compose-security');
  /* form.elements, not form.name: that would be the form's own name attribute. */
  function field(name) { return form.elements[name]; }

  field('topic').addEventListener('change', function () {
    security.hidden = field('topic').value !== 'Security report';
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = field('name').value.trim();
    var org = field('org').value.trim();
    var subject = '[' + field('topic').value + '] ' + name + (org ? ' (' + org + ')' : '');
    var body = field('message').value.trim() + '\n\n--\n' + name + (org ? '\n' + org : '') + '\nSent via cyphera.my.id/contact';
    location.href = 'mailto:' + form.dataset.to +
      '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();
