/* Beyond Life Productions — Home interactions & motion */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var vh = window.innerHeight, vw = window.innerWidth;

  /* =====================================================
     1. SMOOTH, SLOW SCROLLING (Lenis)
     ===================================================== */
  var lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({
      lerp: 0.065,            // lower = slower, silkier
      wheelMultiplier: 0.8,   // slightly slower wheel
      touchMultiplier: 1.1,
      smoothWheel: true
    });
  }
  var scrollToTarget = function (target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.8, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else if (typeof target === 'number') window.scrollTo(0, target);
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (a.classList.contains('reel__card')) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      scrollToTarget(id === '#top' ? 0 : el);
    });
  });

  var enquiryForm = document.getElementById('enquiry-form');
  if (enquiryForm) enquiryForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!enquiryForm.reportValidity()) return;
    var data = new FormData(enquiryForm);
    var body = ['Name: ' + data.get('name'), 'Partner: ' + data.get('partner'), 'Wedding date: ' + data.get('date'), 'Destination: ' + data.get('destination'), 'Phone: ' + data.get('phone'), 'Email: ' + data.get('email'), 'Interested in: ' + data.get('service')].join('\n');
    window.location.href = 'mailto:hello@beyondlifeproductions.com?subject=' + encodeURIComponent('Wedding enquiry') + '&body=' + encodeURIComponent(body);
  });

  /* =====================================================
     2. MOBILE NAV
     ===================================================== */
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  var setMenu = function (open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  if (toggle) {
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    nav.querySelectorAll('.nav__menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* =====================================================
     3. HERO: intro + video fallback
     ===================================================== */
  var video = document.querySelector('.hero__media');
  if (video) {
    if (reduceMotion) { video.removeAttribute('autoplay'); video.pause(); }
    var src = video.querySelector('source');
    if (src) src.addEventListener('error', function () { video.removeAttribute('autoplay'); });
  }
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('is-loaded'); }); });
  setTimeout(function () { if (video) video.classList.add('is-scrolling'); }, 3300);

  /* =====================================================
     4. SPLIT HEADLINES INTO LINES, FOOTER INTO LETTERS
     ===================================================== */
  document.querySelectorAll('[data-split]').forEach(function (h) {
    var parts = h.innerHTML.split(/<br\s*\/?>/i);
    h.innerHTML = parts.map(function (p, i) {
      return '<span class="split-line" style="--i:' + i + '"><span>' + p.trim() + '</span></span>';
    }).join('');
  });
  document.querySelectorAll('[data-letters]').forEach(function (el) {
    var em = el.querySelector('em');
    var text = el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild.textContent : '';
    var frag = document.createDocumentFragment();
    text.split('').forEach(function (ch, i) {
      var s = document.createElement('span');
      s.className = 'letter'; s.style.setProperty('--i', i); s.textContent = ch; s.setAttribute('aria-hidden', 'true');
      frag.appendChild(s);
    });
    el.replaceChild(frag, el.firstChild);
    if (em) el.appendChild(em);
  });

  /* =====================================================
     5. REVEAL ON SCROLL (with automatic stagger)
     ===================================================== */
  var revealEls = [].slice.call(document.querySelectorAll('[data-reveal], [data-split], [data-mask], [data-letters], .g'));
  // stagger siblings that enter together
  var groups = new Map();
  revealEls.forEach(function (el) {
    var key = el.parentElement;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(el);
  });
  groups.forEach(function (list) {
    list.forEach(function (el, i) {
      if (el.classList.contains('g')) el.style.setProperty('--d', ((i % 5) * 0.08 + Math.floor(i / 5) * 0.05) + 's');
      else if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', Math.min(i * 0.12, 0.6) + 's');
    });
  });
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    // Masked elements start fully clipped (clip-path), which the browser treats as
    // "not visible", so we watch their parent instead and reveal the mask from there.
    var watchTarget = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = watchTarget.get(e.target) || e.target;
        el.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
    revealEls.forEach(function (el) {
      var target = el.hasAttribute('data-mask') ? el.parentElement : el;
      if (target !== el) watchTarget.set(target, el);
      io.observe(target);
    });
    // safety net: anything that somehow never triggered is shown once it has been scrolled past
    var sweep = function () {
      revealEls.forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        var r = (el.hasAttribute('data-mask') ? el.parentElement : el).getBoundingClientRect();
        if (r.top < vh * 0.95) el.classList.add('is-in');
      });
    };
    window.addEventListener('scroll', sweep, { passive: true });
    setTimeout(sweep, 1200);
  }

  /* =====================================================
     6. PINNED HORIZONTAL FILMS
     ===================================================== */
  var films = document.querySelector('[data-pin="films"]');
  var track = document.getElementById('reel-track');
  var slides = track ? [].slice.call(track.children) : [];
  var filmsBar = document.getElementById('films-bar');
  var filmsNow = document.getElementById('films-now');
  var filmsDist = 0, filmsTop = 0, filmsLen = 0, lastActive = -1;

  var measureFilms = function () {
    if (!films || !track) return;
    track.style.transform = 'none';
    var reel = track.parentElement;
    var padR = parseFloat(getComputedStyle(reel).paddingLeft) || 0;
    filmsDist = Math.max(0, track.scrollWidth - (reel.clientWidth - padR * 2) );
    // scroll distance = horizontal distance (1:1 feels natural), plus a short hold at the end
    filmsLen = filmsDist + vh * 0.35;
    films.style.height = (vh + filmsLen) + 'px';
    filmsTop = films.getBoundingClientRect().top + window.scrollY;
  };
  var updateFilms = function (y) {
    if (!films || !track) return;
    var p = filmsLen ? clamp((y - filmsTop) / filmsLen, 0, 1) : 0;
    var hp = clamp(p / (filmsDist / filmsLen || 1), 0, 1);  // finish moving before the end-hold
    track.style.transform = 'translate3d(' + (-hp * filmsDist).toFixed(1) + 'px,0,0)';
    if (filmsBar) filmsBar.style.transform = 'scaleX(' + hp.toFixed(4) + ')';
    var offset = hp * filmsDist;
    var firstSlideLeft = slides.length ? slides[0].offsetLeft : 0;
    var active = 0;
    slides.forEach(function (slide, i) {
      if (Math.abs(slide.offsetLeft - firstSlideLeft - offset) < Math.abs(slides[active].offsetLeft - firstSlideLeft - offset)) active = i;
    });
    if (active !== lastActive) {
      lastActive = active;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === active); });
      if (filmsNow) filmsNow.textContent = ('0' + (active + 1)).slice(-2);
    }
  };

  slides.forEach(function (slide) {
    var card = slide.querySelector('a.reel__card');
    if (!card) return;
    card.addEventListener('click', function (event) {
      if (!slide.classList.contains('is-active')) {
        event.preventDefault();
        scrollToTarget(filmsTop + clamp(slide.offsetLeft - slides[0].offsetLeft, 0, filmsDist));
      } else if (card.getAttribute('href') === '#films') {
        event.preventDefault();
      }
    });
  });

  /* =====================================================
     7. PINNED ROUTE (line draws, stations light up)
     ===================================================== */
  var route = document.querySelector('[data-pin="route"]');
  var routeFill = document.getElementById('route-fill');
  var traveller = document.getElementById('route-traveller');
  var stations = route ? [].slice.call(route.querySelectorAll('.station')) : [];
  var lineEl = route ? route.querySelector('.route__line') : null;
  var routeTop = 0, routeLen = 0, routePinned = true, routeHorizontal = true, stationStops = [];

  var measureRoute = function () {
    if (!route) return;
    route.classList.remove('no-pin');
    route.style.height = '';
    var horizontal = vw > 900;
    var rc = route.querySelector('.container'), rcs = getComputedStyle(rc);
    var contentH = rc.offsetHeight - parseFloat(rcs.paddingTop) - parseFloat(rcs.paddingBottom);
    routePinned = horizontal && contentH <= vh - 20;
    route.classList.toggle('no-pin', !routePinned);
    routeHorizontal = horizontal;
    if (routePinned) {
      routeLen = vh * 1.6;                       // how long the route takes to draw
      route.style.height = (vh + routeLen) + 'px';
    } else {
      route.style.height = '';
    }
    routeTop = route.getBoundingClientRect().top + window.scrollY;
    // where each station's dot sits along the line (0–1)
    var lr = lineEl.getBoundingClientRect();
    stationStops = stations.map(function (st) {
      var d = st.querySelector('.station__dot').getBoundingClientRect();
      return routeHorizontal ? (d.left + d.width / 2 - lr.left) / lr.width : (d.top + d.height / 2 - lr.top) / lr.height;
    });
  };
  var updateRoute = function (y) {
    if (!route) return;
    var p;
    if (routePinned) {
      p = clamp((y - routeTop - vh * 0.05) / (routeLen * 0.85), 0, 1);
    } else if (routeHorizontal) {
      // Begin once the section reaches the top, even on short screens.
      p = clamp((y - routeTop) / Math.max(route.offsetHeight - vh, vh * 0.35), 0, 1);
    } else {
      var r = lineEl.getBoundingClientRect();
      p = clamp((vh * 0.65 - r.top) / r.height, 0, 1);
    }
    if (routeFill) routeFill.style.transform = (routeHorizontal ? 'scaleX(' : 'scaleY(') + p.toFixed(4) + ')';
    if (traveller) {
      traveller.style.opacity = p > 0.001 && p < 0.999 ? 1 : (p >= 0.999 ? 1 : 0);
      if (routeHorizontal) { traveller.style.left = (p * 100) + '%'; traveller.style.top = ''; }
      else { traveller.style.top = (p * 100) + '%'; traveller.style.left = ''; }
    }
    stations.forEach(function (st, i) { st.classList.toggle('is-reached', p >= stationStops[i] - 0.01); });
  };

  /* =====================================================
     8. PARALLAX + WATERMARK DRIFT + HERO DEPTH
     ===================================================== */
  var parallaxEls = [].slice.call(document.querySelectorAll('[data-parallax]'));
  var driftEls = [].slice.call(document.querySelectorAll('[data-drift]'));
  var realWatermark = document.querySelector('.watermark--real');
  var realLetters = realWatermark ? [].slice.call(realWatermark.querySelectorAll('span')) : [];
  var ticketWatermark = document.querySelector('.ticket-watermark');
  var ticketLetters = ticketWatermark ? [].slice.call(ticketWatermark.querySelectorAll('span')) : [];
  var hero = document.querySelector('.hero');
  var updateParallax = function () {
    if (realWatermark && !reduceMotion) {
      var realRect = realWatermark.getBoundingClientRect();
      var progress = clamp((vh * 0.85 - realRect.top) / (vh * 0.45), 0, 1);
      realLetters.forEach(function (letter, i) {
        letter.classList.toggle('is-visible', progress >= (i + 1) / realLetters.length);
      });
    }
    if (ticketWatermark && !reduceMotion) {
      var ticketRect = ticketWatermark.getBoundingClientRect();
      var ticketProgress = clamp((vh * 0.85 - ticketRect.top) / (vh * 0.45), 0, 1);
      ticketLetters.forEach(function (letter, i) {
        letter.classList.toggle('is-visible', ticketProgress >= (i + 1) / ticketLetters.length);
      });
    }
    parallaxEls.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var center = (r.top + r.height / 2 - vh / 2) / vh;  // -1..1 around the viewport centre
      el.style.setProperty('--py', (-center * parseFloat(el.dataset.parallax) * r.height).toFixed(1) + 'px');
    });
    driftEls.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var x = (r.top - vh / 2) * parseFloat(el.dataset.drift);
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    });
    if (hero && video && video.classList.contains('is-scrolling')) {
      var hy = window.scrollY;
      if (hy < vh * 1.2) video.style.transform = 'translate3d(0,' + (hy * 0.35).toFixed(1) + 'px,0) scale(' + (1.04 + hy / vh * 0.06).toFixed(4) + ')';
    }
  };

  /* =====================================================
     9. GALLERY: brighten on hover (desktop) / when centred (touch)
     ===================================================== */
  var tiles = [].slice.call(document.querySelectorAll('.gallery__grid .g'));
  var updateGalleryTouch = function () {
    if (canHover) return;
    tiles.forEach(function (t) {
      var r = t.getBoundingClientRect();
      var c = r.top + r.height / 2;
      t.classList.toggle('is-lit', c > vh * 0.3 && c < vh * 0.7);
    });
  };

  /* =====================================================
     10. FRAME LOOP
     ===================================================== */
  var onScroll = function () {
    var y = window.scrollY;
    updateFilms(y);
    updateRoute(y);
    updateParallax();
    updateGalleryTouch();
  };
  var measure = function () {
    vh = window.innerHeight; vw = window.innerWidth;
    measureFilms(); measureRoute();
    // films measured first; route top depends on films height
    measureRoute();
    if (lenis) lenis.resize();
    onScroll();
  };

  if (lenis) {
    lenis.on('scroll', onScroll);
    var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  } else {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }, { passive: true });
  }
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(measure, 150); });
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  measure();

  /* =====================================================
     11. TESTIMONIALS (viewfinder)
     ===================================================== */
  var notes = [
    {
      img: 'assets/img/testimonial-view-01.jpg', who: 'Vivek & Mehul', tc: '00:04:27:12',
      quote: [
        '“We were very anxious and nervous during our wedding, but the photographs and the film convey the happiness that we were feeling at a deeper level. What felt chaotic then has now become a beautiful memory.”',
        '“Hitesh and his team seem to have an enormous passion and a rare balance between going with the flow and capturing some premeditated shots. This is very impressive, considering the many wedding films and photographs we\u2019ve seen of others in the past. There is not one, but many moments that will stay with us forever.”'
      ]
    },
    { img: 'assets/img/testimonial-view-02.jpg', who: 'Zafer & Fatima', tc: '00:04:27:12', quote: [
      '\u201cWhat is fascinating is that from the word go, Hitesh was exceptionally patient and understanding, taking the time to truly grasp our expectations, including the unsaid. Beyond the skill of storytelling, what sets him apart is his compassionate approach that led to an unforgettable wedding experience.\u201d',
      '\u201cEvery special moment was impressively captured. Every family member felt included and engaged. This is nothing else but truly unique. Our wedding film is a treasure, a cherished keepsake that will be close to our hearts for a lifetime.\u201d'
    ] },
    { img: 'assets/img/testimonial-view-03.jpg', who: 'Neha & Uthsav', tc: '00:04:27:12', quote: [
      '\u201cAs a bride & groom, our anxiety was flying high with so much going on. It is only later, when we saw the photographs and the film, we deeply felt the different facets of our emotions and this is what will stay with us beyond life.\u201d',
      '\u201cNothing less than some magic, Hitesh organically transformed from being a professional visual storyteller into someone who is like a friend at your wedding. This special quality along with a presence of mind and his attention to detail, makes him stand apart to deliver an experience as per the expectations of the bride and groom.\u201d'
    ] }
  ];
  var vf = document.getElementById('vf');
  var takes = [].slice.call(document.querySelectorAll('.take'));
  var current = 0, timer = null, noteSwitchTimer = null;
  var imageLayers = [document.getElementById('vf-img'), document.getElementById('vf-img-next')];
  var activeLayer = 0, noteVersion = 0;
  var showNote = function (i) {
    if (i === current || !vf) return;
    current = i;
    var n = notes[i], version = ++noteVersion;
    takes.forEach(function (t, k) { t.classList.toggle('is-on', k === i); t.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    clearTimeout(noteSwitchTimer);
    vf.classList.add('is-switching');
    var next = 1 - activeLayer;
    var image = imageLayers[next];
    var ready = new Image();
    ready.onload = function () {
      if (version !== noteVersion) return;
      image.src = n.img;
      imageLayers[activeLayer].classList.remove('is-current');
      noteSwitchTimer = setTimeout(function () {
        if (version !== noteVersion) return;
        image.classList.add('is-current');
        activeLayer = next;
        var q = document.getElementById('vf-quote');
        q.innerHTML = n.quote.map(function (p) { return '<p>' + p + '</p>'; }).join('');
        q.classList.toggle('is-short', n.quote.join('').length < 120);
        document.getElementById('vf-who').textContent = n.who;
        document.getElementById('vf-tc').textContent = n.tc;
        document.getElementById('vf-take').textContent = 'Love notes \u00b7 Take 0' + (i + 1);
        vf.classList.remove('is-switching');
      }, reduceMotion ? 0 : 400);
    };
    ready.onerror = function () { if (version === noteVersion) vf.classList.remove('is-switching'); };
    ready.src = n.img;
  };
  var restart = function () {
    if (reduceMotion) return;
    clearInterval(timer);
    timer = setInterval(function () { showNote((current + 1) % notes.length); }, 14000);
  };
  takes.forEach(function (t) { t.addEventListener('click', function () { showNote(Number(t.dataset.i)); restart(); }); });
  restart();
  notes.forEach(function (n) { var im = new Image(); im.src = n.img; });

  // running timecode on the viewfinder (feels like it's recording)
  var tcEl = document.getElementById('vf-tc'), frames = 0;
  if (tcEl && !reduceMotion) setInterval(function () {
    var parts = tcEl.textContent.split(':').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return;
    frames = parts[3] + 1;
    if (frames >= 24) { frames = 0; parts[2]++; if (parts[2] >= 60) { parts[2] = 0; parts[1]++; } }
    parts[3] = frames;
    tcEl.textContent = parts.map(function (n) { return ('0' + n).slice(-2); }).join(':');
  }, 1000 / 24);

  /* =====================================================
     12. GALLERY LIGHTBOX
     ===================================================== */
  var box = document.getElementById('lightbox');
  var boxImg = document.getElementById('lightbox-img');
  var gi = 0, lastFocus = null;
  var openBox = function (i) {
    var visibleTiles = tiles.filter(function (tile) { return getComputedStyle(tile).display !== 'none'; });
    gi = (i + visibleTiles.length) % visibleTiles.length;
    var img = visibleTiles[gi].querySelector('img');
    boxImg.src = img.src; boxImg.alt = img.alt;
    if (box.hidden) {
      lastFocus = document.activeElement; box.hidden = false; document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
      box.querySelector('.lightbox__close').focus();
    }
  };
  var closeBox = function () {
    box.hidden = true; document.body.style.overflow = '';
    if (lenis) lenis.start();
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  tiles.forEach(function (t) { t.addEventListener('click', function () { openBox(tiles.filter(function (tile) { return getComputedStyle(tile).display !== 'none'; }).indexOf(t)); }); });
  box.querySelector('.lightbox__close').addEventListener('click', closeBox);
  box.querySelector('.lightbox__nav--prev').addEventListener('click', function () { openBox(gi - 1); });
  box.querySelector('.lightbox__nav--next').addEventListener('click', function () { openBox(gi + 1); });
  box.addEventListener('click', function (e) { if (e.target === box) closeBox(); });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') closeBox();
    if (e.key === 'ArrowRight') openBox(gi + 1);
    if (e.key === 'ArrowLeft') openBox(gi - 1);
  });

  /* footer year */
  var yr = document.getElementById('year'); if (yr) yr.textContent = new Date().getFullYear();
})();
