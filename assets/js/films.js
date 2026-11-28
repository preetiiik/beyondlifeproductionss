/* Beyond Life · Films section — pinned horizontal scroll
   While the section is on screen it stays pinned and vertical scrolling
   moves the films sideways. When the last card is reached, the page
   continues to the next section. No dependencies.                     */
(function () {
  'use strict';
  var section = document.querySelector('.bl-films');
  if (!section) return;
  var track = section.querySelector('.bl-films__track');
  var desktopFilms = window.matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)').matches;
  var films = [].slice.call(track.querySelectorAll('.bl-film'));
  var counter = document.getElementById('films-now');
  var bar = document.getElementById('films-bar');
  var vimeoFilms = [].slice.call(section.querySelectorAll('.bl-film--vimeo'));
  var sectionVisible = false;
  function syncVimeo() {
    vimeoFilms.forEach(function (film) {
      var player = film.querySelector('iframe');
      if (document.fullscreenElement === player) return;
      if (sectionVisible && film.classList.contains('is-active')) {
        if (!player.getAttribute('src')) player.src = player.dataset.src;
      } else if (player.getAttribute('src')) {
        player.classList.remove('is-ready');
        player.removeAttribute('src');
      }
    });
  }
  if (vimeoFilms.length) {
    document.addEventListener('fullscreenchange', syncVimeo);
    vimeoFilms.forEach(function (film) {
      var player = film.querySelector('iframe');
      player.addEventListener('load', function () {
        if (player.getAttribute('src')) player.classList.add('is-ready');
      });
      new MutationObserver(syncVimeo).observe(film, { attributes: true, attributeFilter: ['class'] });
    });
    new IntersectionObserver(function (entries) { sectionVisible = entries[0].isIntersecting; syncVimeo(); }, { threshold: 0.2 }).observe(section.querySelector('.bl-films__sticky'));
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(min-width: 561px) and (max-width: 900px)').matches;

  if (reduce) {
    // swipeable row instead; mark whichever card is in view as active
    var vp = section.querySelector('.bl-films__viewport');
    var prev = section.querySelector('[data-film-prev]');
    var next = section.querySelector('[data-film-next]');
    var selected = 0;
    var mark = function () {
      var left = vp.getBoundingClientRect().left;
      var best = 0, d = Infinity;
      films.forEach(function (f, i) { var x = Math.abs(f.getBoundingClientRect().left - left); if (x < d) { d = x; best = i; } });
      films.forEach(function (f, i) { f.classList.toggle('is-active', i === best); });
      selected = best;
      if (prev) prev.disabled = best === 0;
      if (next) next.disabled = best === films.length - 1;
      if (counter) counter.textContent = ('0' + Math.min(best + 1, films.length - 1)).slice(-2);
      if (bar) bar.style.transform = 'scaleX(' + (best / (films.length - 1)) + ')';
    };
    vp.addEventListener('scroll', mark, { passive: true });
    function goToFilm(index) {
      var target = films[Math.max(0, Math.min(index, films.length - 1))];
      var padding = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      var left = vp.scrollLeft + target.getBoundingClientRect().left - vp.getBoundingClientRect().left - padding;
      vp.scrollTo({ left: left, behavior: 'auto' });
      mark();
    }
    if (prev) prev.addEventListener('click', function () { goToFilm(selected - 1); });
    if (next) next.addEventListener('click', function () { goToFilm(selected + 1); });
    films.forEach(function (film) {
      var link = film.querySelector('a.bl-film__media');
      if (link && link.getAttribute('href') === '#') link.addEventListener('click', function (event) { event.preventDefault(); });
    });
    mark();
    return;
  }

  var vh, distance, start, length, active = -1, stops = [];
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var mobilePrev = section.querySelector('[data-film-prev]');
  var mobileNext = section.querySelector('[data-film-next]');

  function measure() {
    vh = window.innerHeight;
    track.style.transform = 'none';
    var pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    // Stop when the final message is centered in the viewport.
    var last = films[films.length - 1];
    var firstLeft = desktopFilms ? films[0].offsetLeft : pad;
    distance = desktopFilms ? Math.max(0, last.offsetLeft - firstLeft) : Math.max(0, last.offsetLeft + last.offsetWidth / 2 - section.clientWidth / 2);
    // where each card sits on that journey (0–1), used to decide the active card
    stops = films.map(function (f, i) { return i === films.length - 1 ? 1 : (distance ? clamp((f.offsetLeft - firstLeft) / distance, 0, 1) : 0); });
    length = distance * (desktopFilms ? 2 : 1);
    section.style.height = (section.querySelector('.bl-films__sticky').offsetHeight + length) + 'px';
    start = section.getBoundingClientRect().top + window.scrollY;
    update();
  }

  // eased position so the movement feels smooth even with a notched mouse wheel
  var current = 0, target = 0, raf = null;
  function update() {
    var p = clamp((window.scrollY - start) / (length || 1), 0, 1);
    target = p * distance;
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    current += (target - current) * 0.12;
    if (Math.abs(target - current) < 0.3) current = target;
    track.style.transform = 'translate3d(' + (-current).toFixed(1) + 'px,0,0)';
    var p = distance ? current / distance : 0;
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
    var idx = 0;
    stops.forEach(function (stop, i) {
      if (i === 0) return;
      var lead = (films[i].offsetWidth * 0.2) / (distance || 1);
      if (p >= Math.max(0, stop - lead)) idx = i;
    });
    if (idx !== active) {
      active = idx;
      if (mobilePrev) mobilePrev.disabled = idx === 0;
      if (mobileNext) mobileNext.disabled = idx === films.length - 1;
      if (counter) counter.textContent = ('0' + Math.min(idx + 1, vimeoFilms.length)).slice(-2);
      films.forEach(function (f, i) { f.classList.toggle('is-active', i === idx); });
    }
    raf = current === target ? null : requestAnimationFrame(tick);
  }

  window.addEventListener('scroll', update, { passive: true });
  function movePageTo(y) {
    if (window.beyondLifeLenis) window.beyondLifeLenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }
  function moveFilm(direction) {
    var index = clamp(active + direction, 0, films.length - 1);
    movePageTo(start + stops[index] * length);
  }
  if (mobilePrev) mobilePrev.addEventListener('click', function () { moveFilm(-1); });
  if (mobileNext) mobileNext.addEventListener('click', function () { moveFilm(1); });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(measure, 120); });
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if (!desktopFilms && 'ResizeObserver' in window) {
    var stickyFrame = section.querySelector('.bl-films__sticky');
    var lastFrameHeight = 0;
    new ResizeObserver(function () {
      var height = stickyFrame.offsetHeight;
      if (height !== lastFrameHeight) {
        lastFrameHeight = height;
        measure();
      }
    }).observe(stickyFrame);
  }
  measure();

  // keyboard: when a film link is focused, bring it into view
  films.forEach(function (f, i) {
    var link = f.querySelector('a');
    if (!link) return;
    link.addEventListener('click', function (event) {
      event.preventDefault();
      if (i !== active) window.scrollTo({ top: start + stops[i] * length, behavior: 'smooth' });
    });
    link.addEventListener('focus', function () {
      window.scrollTo({ top: start + stops[i] * length, behavior: 'smooth' });
    });
  });
})();
