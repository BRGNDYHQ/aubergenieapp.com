/*
 * "Keep me posted" signup.
 *
 * Sign-ups are saved to Aubergenie's own Supabase database (London) through one
 * function, public.join_list, which can add to the list but never read it.
 * Fill in LIST below to switch it on. Until then, or if saving fails, the form
 * opens the visitor's email app with a ready-to-send note instead, so nobody is lost.
 *
 * The testing box sends tester=yes only when ticked. Adding ?test (or #test) to the
 * address ticks it, for links from tester videos. Ticking it reveals three optional
 * questions; while it is unticked they are disabled, so nothing extra is sent.
 */
(function () {
  var LIST = {
    url: '',  // Supabase Project URL, e.g. https://abcdefghijklmnop.supabase.co
    key: ''   // Supabase publishable (anon) key. Public by design; never the service-role key.
  };

  var forms = Array.prototype.slice.call(document.querySelectorAll('form[data-signup]'));
  if (!forms.length) return;

  var wantsTest = /[?&#](test|tester|beta)\b/.test(location.search + location.hash);
  var LABEL = 'Keep me posted';

  forms.forEach(function (form) {
    var email = form.querySelector('input[type="email"]');
    var check = form.querySelector('input[name="tester"]');
    var status = form.querySelector('[data-signup-status]');
    var button = form.querySelector('button[type="submit"]');
    var qs = form.querySelector('[data-tester-qs]');
    var mailto = form.getAttribute('action') || 'mailto:hello@aubergenieapp.com';

    if (check && wantsTest) check.checked = true;
    var syncQs = function () { if (!qs) return; var on = !!(check && check.checked); qs.hidden = !on; qs.disabled = !on; };
    if (check) check.addEventListener('change', syncQs);
    syncQs();

    var value = function (name) {
      var el = form.querySelector('[name="' + name + '"]:checked') || form.querySelector('input[type="text"][name="' + name + '"], input[type="hidden"][name="' + name + '"]');
      if (!el || el.disabled || (el.closest && el.closest('fieldset:disabled'))) return '';
      return (el.value || '').trim();
    };
    var label = function (name) {
      var el = form.querySelector('[name="' + name + '"]:checked');
      if (el && el.nextElementSibling) return el.nextElementSibling.textContent.trim();
      return value(name);
    };
    var say = function (text) { if (status) status.textContent = text; };
    var busy = function (on) { if (!button) return; button.disabled = on; button.textContent = on ? 'One moment…' : LABEL; };

    var openEmail = function (tester) {
      var subject = tester ? 'Keep me posted (happy to test)' : 'Keep me posted';
      var body = 'Please keep me posted about Aubergenie.\n\n' +
        'Email: ' + (email ? email.value : '') + '\n' +
        "I'd be interested in testing an early version on iPhone: " + (tester ? 'Yes' : 'No') + '\n';
      if (tester) {
        body += '\nHow often I cook: ' + (label('cooks') || '-') +
          '\nWhere most of my recipes live: ' + (label('recipes_from') || '-') +
          '\nWhat would make cooking more fun: ' + (value('wish') || '-') + '\n';
      }
      window.location.href = mailto.split('?')[0] + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    };

    form.addEventListener('submit', function (e) {
      if (email) email.value = email.value.trim();
      if (email && !email.checkValidity()) return; // let the browser explain
      e.preventDefault();
      var tester = !!(check && check.checked);
      var thanks = '/thanks/' + (tester ? '?tester' : '');

      if (value('company')) { window.location.href = thanks; return; } // a bot filled the hidden field

      if (!LIST.url || !LIST.key || !window.fetch) {
        openEmail(tester);
        say('Your email app should open with a note ready to send. Press send and you’re on the list.');
        return;
      }

      busy(true); say('');
      var headers = { 'Content-Type': 'application/json', 'apikey': LIST.key };
      if (LIST.key.indexOf('eyJ') === 0) headers.Authorization = 'Bearer ' + LIST.key; // older-style anon key
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 12000) : null;

      fetch(LIST.url.replace(/\/+$/, '') + '/rest/v1/rpc/join_list', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          p_email: email ? email.value : '',
          p_wants_to_test: tester,
          p_cooks: tester ? value('cooks') || null : null,
          p_recipes_from: tester ? value('recipes_from') || null : null,
          p_wish: tester ? value('wish') || null : null,
          p_source: value('source') || null
        }),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (res) {
        if (timer) clearTimeout(timer);
        if (res.ok) { window.location.href = thanks; return; }
        return res.json().catch(function () { return {}; }).then(function (err) {
          busy(false);
          if (res.status === 400 && /email_check/.test(err.message || '')) {
            say('That email address doesn’t look quite right. Could you check it?');
            if (email) email.focus();
            return;
          }
          throw new Error('save failed ' + res.status);
        });
      }).catch(function () {
        if (timer) clearTimeout(timer);
        busy(false);
        say('Something went wrong on my side, so your email app will open instead. Press send and you’re on the list.');
        openEmail(tester);
      });
    });

    // Restore the button if the visitor comes back with the browser's Back button.
    window.addEventListener('pageshow', function () { busy(false); });
  });
})();
