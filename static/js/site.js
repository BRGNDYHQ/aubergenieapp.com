(function () {
  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var still = reduce || root.classList.contains('still');
  root.classList.add(still ? 'still' : 'motion');
  if (still) root.classList.remove('motion');
  root.classList.add('js-ready');
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var header = $('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    var heroCta = $('[data-hero-cta]');
    if (heroCta && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { header.classList.toggle('cta-away', !e.isIntersecting && e.boundingClientRect.top < 0); });
      }, { threshold: 0 }).observe(heroCta);
    } else { header.classList.add('cta-away'); }
  }
  $$('[data-copy]').forEach(function (btn) {
    btn.setAttribute('aria-live', 'polite');
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy'), label = btn.textContent;
      var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = label; }, 1800); };
      var fallback = function () {
        try { var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px';
          document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); } catch (e) { window.prompt('Copy this address', text); }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    });
  });
  var hero = $('[data-hero]');
  if (hero) {
    var dishes = JSON.parse($('[data-dishes]', hero).textContent);
    var plate = $('[data-hero-plate]', hero), img = $('[data-plate-img]', hero), avif = $('[data-plate-avif]', hero);
    var title = $('[data-plate-title]', hero), facts = $('[data-plate-facts]', hero);
    var next = $('[data-next-dish]', hero), current = 0, busy = false;
    var avifOk = function () { return !!(avif && img.currentSrc && /\.avif/.test(img.currentSrc)); };
    var url = function (d, w) { return '/static/images/plate-' + d.stem + '-' + w + (avifOk() ? '.avif' : '.jpg'); };
    var wanted = function () { return img.currentSrc && img.currentSrc.indexOf('1440') > -1 ? 1440 : 720; };
    var ready = {};
    var warm = function (d) { if (ready[d.stem]) return; var i = new Image(); i.src = url(d, wanted()); ready[d.stem] = (i.decode ? i.decode() : Promise.resolve()).catch(function () {}); };
    var show = function (i) {
      var d = dishes[i]; current = i;
      if (avif) avif.srcset = '/static/images/plate-' + d.stem + '-720.avif 720w, /static/images/plate-' + d.stem + '-1440.avif 1440w';
      img.srcset = '/static/images/plate-' + d.stem + '-720.jpg 720w, /static/images/plate-' + d.stem + '-1440.jpg 1440w';
      img.src = '/static/images/plate-' + d.stem + '-720.jpg';
      img.alt = d.alt; title.textContent = d.title; facts.textContent = d.facts;
    };
    if (next) {
      next.hidden = false;
      var warmNext = function () { warm(dishes[(current + 1) % dishes.length]); };
      if (document.readyState === 'complete') warmNext(); else window.addEventListener('load', warmNext);
      next.addEventListener('mouseenter', warmNext); next.addEventListener('focus', warmNext);
      next.addEventListener('click', function () {
        if (busy) return;
        var i = (current + 1) % dishes.length, d = dishes[i];
        warm(d);
        if (still) { ready[d.stem].then(function () { show(i); warmNext(); }); return; }
        busy = true; plate.classList.add('is-turning');
        var t0 = Date.now();
        ready[d.stem].then(function () {
          setTimeout(function () { show(i); plate.classList.remove('is-turning'); setTimeout(function () { busy = false; warmNext(); }, 500); }, Math.max(0, 330 - (Date.now() - t0)));
        });
      });
    }
  }
  var seen = function (el, cb, threshold) {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(el); cb(); } });
    }, { threshold: threshold || 0, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
  };
  $$('.reveal, .rail-step, .float').forEach(function (el) { seen(el, function () { el.classList.add('is-in'); }); });
  var find = $('[data-find]');
  if (find) {
    var sheet = $('[data-sheet]', find), verbs = $$('[data-verb]', find), typingTimer = null, timers = [], chosen = false;
    var typeInto = function (el, done) {
      var text = el.getAttribute('data-text'); var box = el.closest('[data-input]');
      clearInterval(typingTimer);
      if (still) { el.textContent = text; done(); return; }
      var n = 0; el.textContent = ''; box.classList.add('is-typing');
      typingTimer = setInterval(function () {
        n += 1; el.textContent = text.slice(0, n);
        if (n >= text.length) { clearInterval(typingTimer); box.classList.remove('is-typing'); done(); }
      }, 34);
    };
    var light = function (name) { verbs.forEach(function (v) { v.classList.toggle('is-on', v.getAttribute('data-verb') === name); }); };
    var order = $$('[data-source]', find).map(function (c) { return c.getAttribute('data-source'); });
    var play = function (source) {
      timers.forEach(clearTimeout); timers = []; clearInterval(typingTimer);
      $$('[data-source]', find).forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-source') === source)); });
      $$('[data-input]', find).forEach(function (b) { b.classList.remove('is-typing'); });
      $$('[data-input]', find).forEach(function (b) { b.hidden = b.getAttribute('data-input') !== source; });
      $$('[data-truth-for]', find).forEach(function (t) { t.hidden = t.getAttribute('data-truth-for') !== source; });
      sheet.classList.remove('is-composed');
      light('find');
      var compose = function () {
        timers.push(setTimeout(function () { light('save'); sheet.classList.add('is-composed'); }, still ? 0 : 350));
        timers.push(setTimeout(function () { light('make'); }, still ? 0 : 1600));
        var at = order.indexOf(source);
        if (!still && at < order.length - 1) timers.push(setTimeout(function () { if (!chosen) play(order[at + 1]); }, 5200));
      };
      var typed = $('[data-input="' + source + '"] [data-typed]', find);
      if (typed) typeInto(typed, compose); else timers.push(setTimeout(compose, still ? 0 : 500));
    };
    $$('[data-source]', find).forEach(function (chip) {
      chip.addEventListener('click', function () { chosen = true; play(chip.getAttribute('data-source')); });
    });
    if (still) { sheet.classList.add('is-composed'); light('make'); }
    else seen($('[data-find-input]', find), function () { if (!chosen) play(order[0]); }, 0.25);
  }
  var once = $('[data-once]');
  if (once) {
    var sentence = $('[data-once-sentence]', once), product = sentence.textContent.split(' will ')[0];
    var numbers = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 8: 'eight', 10: 'ten', 12: 'twelve' }; // the app's number words
    var join = function (parts) { return parts.length < 2 ? parts.join('') : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1]; };
    var compose = function () {
      var allergies = $$('[data-pref="allergy"][aria-pressed="true"]', once).map(function (c) { return c.getAttribute('data-value'); });
      var diet = ($('[data-pref="diet"][aria-checked="true"]', once) || {}).getAttribute ? $('[data-pref="diet"][aria-checked="true"]', once).getAttribute('data-value') : '';
      var kit = $$('[data-pref="kit"][aria-pressed="true"]', once).map(function (c) { return c.getAttribute('data-value'); });
      var serves = ($('[data-pref="serves"][aria-checked="true"]', once) || { getAttribute: function () { return '4'; } }).getAttribute('data-value');
      var clauses = [];
      if (allergies.length === 1) clauses.push('work around your ' + allergies[0] + ' allergy');
      else if (allergies.length === 2) clauses.push('work around your ' + allergies[0] + ' and ' + allergies[1] + ' allergies');
      else if (allergies.length > 2) clauses.push('work around your ' + allergies.length + ' allergies');
      if (diet) clauses.push('keep things ' + diet);
      var dislikes = $$('[data-pref="dislike"][aria-pressed="true"]', once).map(function (c) { return c.getAttribute('data-value'); });
      if (dislikes.length) clauses.push('leave out ' + dislikes.join(' and '));
      if (kit.length) clauses.push('make use of your ' + join(kit));
      clauses.push(serves === '1' ? 'size recipes for one' : 'size recipes for ' + (numbers[serves] || serves));
      var text = product + ' will ' + join(clauses) + '.';
      if (still) { sentence.textContent = text; return; }
      sentence.classList.add('is-changing');
      setTimeout(function () { sentence.textContent = text; sentence.classList.remove('is-changing'); }, 180);
    };
    $$('[data-pref]', once).forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (chip.getAttribute('role') === 'radio') {
          $$('[data-pref="' + chip.getAttribute('data-pref') + '"]', once).forEach(function (c) { c.setAttribute('aria-checked', String(c === chip)); });
        } else {
          chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
        }
        compose();
      });
    });
  }
  var plates = $('[data-plates]');
  if (plates) {
    var count = $('[data-count]'), items = $$('[data-plate]', plates);
    $$('[data-filter]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        $$('[data-filter]').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        var n = 0;
        items.forEach(function (p) {
          var keep = f === 'all' || p.getAttribute('data-' + f) === 'true';
          p.classList.toggle('is-dim', !keep); if (keep) { n += 1; p.removeAttribute('aria-hidden'); } else { p.setAttribute('aria-hidden', 'true'); }
        });
        count.textContent = f === 'all' ? n + ' recipes' : n + (f === 'quick' ? ' quick ' : ' favourite ') + (n === 1 ? 'recipe' : 'recipes');
      });
    });
  }
  var list = $('[data-list]');
  if (list) {
    var rows = $$('[role="checkbox"]', list), remaining = $('[data-list-remaining]', list), collected = $('[data-list-collected]', list);
    var listTotal = 20;
    var recount = function () {
      var done = rows.filter(function (r) { return r.getAttribute('aria-checked') === 'true'; }).length;
      var left = listTotal - done;
      remaining.textContent = left === 0 ? 'All collected' : left + (left === 1 ? ' item' : ' items') + ' remaining';
      collected.textContent = done + ' of ' + listTotal + ' collected';
    };
    rows.forEach(function (r) { r.addEventListener('click', function () { r.setAttribute('aria-checked', String(r.getAttribute('aria-checked') !== 'true')); recount(); }); });
    recount();
  }
  var cook = $('[data-cook]');
  if (cook) {
    var digits = $('[data-cook-digits]', cook), ring = $('.cook-ring-fill', cook), pause = $('[data-cook-pause]', cook);
    var total = 10 * 60, left = 9 * 60 + 53, ticking = null, paused = false;
    var paint = function () {
      var m = Math.floor(left / 60), s = left % 60;
      digits.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      ring.style.strokeDashoffset = (100 - (left / total) * 100).toFixed(1);
    };
    var start = function () { if (!ticking && !paused && !still) ticking = setInterval(function () {
      if (left > 1) { left -= 1; paint(); }
      else { left = total; ring.classList.add('no-transition'); paint(); setTimeout(function () { ring.classList.remove('no-transition'); }, 50); }
    }, 1000); };
    var chip = $('.cook-time', cook);
    if (chip) { chip.setAttribute('role', 'button'); chip.setAttribute('tabindex', '0');
      var help = document.createElement('span'); help.className = 'sr-only'; help.id = 'cook-chip-help'; help.textContent = 'Starts the timer again.'; cook.appendChild(help); chip.setAttribute('aria-describedby', 'cook-chip-help');
      var restart = function () { left = total; paused = false; ring.classList.add('no-transition'); paint(); setTimeout(function () { ring.classList.remove('no-transition'); }, 50); if (!still) { stop(); start(); } };
      chip.addEventListener('click', restart); chip.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); restart(); } }); }
    var stop = function () { clearInterval(ticking); ticking = null; };
    paint();
    if (!still) {
      pause.hidden = false;
      pause.addEventListener('click', function () {
        paused = !paused; if (paused) stop(); else start();
        $('[data-icon-pause]', pause).hidden = paused; $('[data-icon-play]', pause).hidden = !paused;
        pause.setAttribute('aria-label', paused ? 'Resume the timer' : 'Pause the timer');
      });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
        }, { threshold: 0.3 }).observe(cook);
      } else start();
    }
  }
  var send = $('[data-send]');
  if (send && !still) seen($('.send-path', send) || send, function () { send.classList.add('is-sending'); }, 0.5);
})();
