/* Labs page: category filter. */
(function () {
  var filters = document.querySelector('.labs-filters');
  var cards = document.querySelectorAll('.lab-card');
  filters.addEventListener('click', function (e) {
    var btn = e.target.closest('.labs-filter');
    if (!btn) { return; }
    filters.querySelector('.active').classList.remove('active');
    btn.classList.add('active');
    cards.forEach(function (card) {
      card.hidden = btn.dataset.kind !== 'all' && card.dataset.kind !== btn.dataset.kind;
    });
  });
})();
