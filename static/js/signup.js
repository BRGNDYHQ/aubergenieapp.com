/*
 * "Tell me when it's ready" signup.
 *
 * Sign-ups are saved to Aubergenie's own Supabase database (London) through one
 * function, public.join_list, which can add to the list but never read it.
 * Fill in LIST below to switch it on. Until then, or if saving fails, the form
 * opens the visitor's email app with a ready-to-send note instead, so nobody is lost.
 *
 * The testing box sends tester=yes only when ticked. Adding ?test (or #test) to the
 * address ticks it, for links from tester videos.
 *
 * Sign-up is one step: email, tick box, button. People who tick the box are offered
 * three optional questions on the thanks page. Their address is kept in this tab's
 * sessionStorage so the answers can be saved against it (join_list fills in blanks
 * for an address already on the list), and removed once the answers are sent.
 */
(function () {
  var LIST = {
    url: 'https://koalshgnvjyyiiyvvlrl.supabase.co',  // Supabase Project URL (BRGNDY LTD › Aubergenie App, London)
    key: 'sb_publishable_DVoTUQO-e3Vp8PPdwamHHQ_-Q7oY12a'  // Publishable key: public by design. Never put the secret key here.
  };

  var post = function (fn, body) {
    var headers = { 'Content-Type': 'application/json', 'apikey': LIST.key };
    if (LIST.key.indexOf('eyJ') === 0) headers.Authorization = 'Bearer ' + LIST.key;
    return fetch(LIST.url.replace(/\/+$/, '') + '/rest/v1/rpc/' + fn, { method: 'POST', headers: headers, body: JSON.stringify(body) });
  };

  // "Take me off the list" (Privacy choices). Deletes by email and never says whether it was there.
  Array.prototype.slice.call(document.querySelectorAll('form[data-leave]')).forEach(function (form) {
    var email = form.querySelector('input[type="email"]'), status = form.querySelector('[data-signup-status]'), button = form.querySelector('button');
    var mail = function () {
      window.location.href = 'mailto:privacy@aubergenieapp.com?subject=' + encodeURIComponent('Please take me off the Aubergenie list') +
        '&body=' + encodeURIComponent('Please remove this address from the Aubergenie email list: ' + email.value + '\n');
      status.textContent = 'Your email app should open with a note ready to send. Press send and I’ll remove you.';
    };
    form.addEventListener('submit', function (e) {
      email.value = email.value.trim();
      if (!email.checkValidity()) return;
      e.preventDefault();
      if (!LIST.url || !LIST.key || !window.fetch) { mail(); return; }
      button.disabled = true;
      post('leave_list', { p_email: email.value }).then(function (res) {
        button.disabled = false;
        if (res.ok) { status.textContent = 'Done. If that address was on the list, it’s gone, along with any answers.'; form.reset(); }
        else mail();
      }).catch(function () { button.disabled = false; mail(); });
    });
  });

  // Optional tester questions on the thanks page.
  var KEY = 'aubergenie-signup-email';
  var remembered = function () { try { return sessionStorage.getItem(KEY) || ''; } catch (e) { return ''; } };
  Array.prototype.slice.call(document.querySelectorAll('form[data-answers]')).forEach(function (form) {
    var address = remembered(), status = form.querySelector('[data-signup-status]'), button = form.querySelector('button[type="submit"]');
    if (!address || !/[?&]tester\b/.test(location.search) || !LIST.url || !LIST.key || !window.fetch) return; // stays hidden
    form.hidden = false;
    var pick = function (name) { var el = form.querySelector('[name="' + name + '"]:checked'); return el ? el.value : null; };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var wish = (form.querySelector('[name="wish"]').value || '').trim() || null;
      var cooks = pick('cooks'), from = pick('recipes_from');
      if (!cooks && !from && !wish) { status.textContent = 'Nothing to send yet. Pick an answer or two, or skip this: it’s optional.'; return; }
      button.disabled = true;
      post('join_list', { p_email: address, p_wants_to_test: true, p_cooks: cooks, p_recipes_from: from, p_wish: wish, p_source: null }).then(function (res) {
        if (!res.ok) throw new Error('save failed');
        try { sessionStorage.removeItem(KEY); } catch (e) {}
        Array.prototype.slice.call(form.querySelectorAll('.q-label, .choices, .q-text, .signup-note, .signup-submit')).forEach(function (el) { el.hidden = true; });
        status.textContent = 'Thank you, that’s saved.';
      }).catch(function () {
        button.disabled = false;
        status.textContent = 'That didn’t save, sorry. Try once more, or skip it: you’re on the list either way.';
      });
    });
  });

  var forms = Array.prototype.slice.call(document.querySelectorAll('form[data-signup]'));
  if (!forms.length) return;

  var wantsTest = /[?&#](test|tester|beta)\b/.test(location.search + location.hash);

  forms.forEach(function (form) {
    var email = form.querySelector('input[type="email"]');
    var check = form.querySelector('input[name="tester"]');
    var status = form.querySelector('[data-signup-status]');
    var button = form.querySelector('button[type="submit"]');
    var mailto = form.getAttribute('action') || 'mailto:hello@aubergenieapp.com';
    var LABEL = button ? button.textContent : '';

    if (check && wantsTest) check.checked = true;

    var value = function (name) {
      var el = form.querySelector('[name="' + name + '"]:checked') || form.querySelector('input[type="text"][name="' + name + '"], input[type="hidden"][name="' + name + '"]');
      if (!el || el.disabled || (el.closest && el.closest('fieldset:disabled'))) return '';
      return (el.value || '').trim();
    };
    var say = function (text) { if (status) status.textContent = text; };
    var busy = function (on) { if (!button) return; button.disabled = on; button.textContent = on ? 'One moment…' : LABEL; };

    var openEmail = function (tester) {
      var subject = tester ? 'Tell me when Aubergenie is ready (happy to test)' : 'Tell me when Aubergenie is ready';
      var body = 'Please tell me when Aubergenie is ready.\n\n' +
        'Email: ' + (email ? email.value : '') + '\n' +
        "I'd also like to test it early on my iPhone: " + (tester ? 'Yes' : 'No') + '\n';
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
        say('Your email app should open with a note ready to send. Press send and I’ll add you myself.');
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
          p_cooks: null,
          p_recipes_from: null,
          p_wish: null,
          p_source: value('source') || null
        }),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (res) {
        if (timer) clearTimeout(timer);
        if (res.ok) {
          try { if (tester && email) sessionStorage.setItem(KEY, email.value); else sessionStorage.removeItem(KEY); } catch (e) {}
          window.location.href = thanks; return;
        }
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
        say('Something went wrong on my side, so your email app will open instead. Press send and I’ll add you myself.');
        openEmail(tester);
      });
    });

    // Restore the button if the visitor comes back with the browser's Back button.
    window.addEventListener('pageshow', function () { busy(false); });
  });
})();
