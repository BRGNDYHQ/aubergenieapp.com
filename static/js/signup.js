/*
 * "Keep me posted" signup.
 *
 * Each form's `action` decides where a signup goes:
 *   - https://… (the EmailOctopus form endpoint): the browser submits the form
 *     normally, and the list provider shows its own confirmation (or redirects to /thanks/).
 *   - mailto:…: no list provider yet. We open the visitor's email app with a ready-to-send
 *     note instead, so a signup still reaches us.
 *
 * The beta-tester checkbox is sent as `tag=beta-tester` only when it is ticked.
 * Adding ?test (or #test) to the address ticks it, for links from tester videos.
 * Ticking it reveals three optional questions (metadata__cooks, metadata__recipes_from,
 * metadata__wish); while it is unticked they are disabled, so nothing extra is sent.
 */
(function () {
  var forms = Array.prototype.slice.call(document.querySelectorAll('form[data-signup]'));
  if (!forms.length) return;

  var wantsTest = /[?&#](test|tester|beta)\b/.test(location.search + location.hash);

  forms.forEach(function (form) {
    var email = form.querySelector('input[type="email"]');
    var check = form.querySelector('input[name="tag"][value="beta-tester"]');
    var status = form.querySelector('[data-signup-status]');
    var button = form.querySelector('button[type="submit"]');
    var qs = form.querySelector('[data-tester-qs]');
    if (check && wantsTest) check.checked = true;
    // The tester questions only show (and only send) when the testing box is ticked.
    var syncQs = function () { if (!qs) return; var on = !!(check && check.checked); qs.hidden = !on; qs.disabled = !on; };
    if (check) check.addEventListener('change', syncQs);
    syncQs();
    var answer = function (name) {
      var el = form.querySelector('[name="' + name + '"]:checked') || form.querySelector('input[type="text"][name="' + name + '"]');
      if (!el || !el.value) return '';
      var label = el.type === 'radio' && el.nextElementSibling ? el.nextElementSibling.textContent : el.value;
      return label.trim();
    };

    form.addEventListener('submit', function (e) {
      var action = form.getAttribute('action') || '';
      if (email) email.value = email.value.trim();
      if (email && !email.checkValidity()) return; // let the browser explain

      if (action.indexOf('mailto:') === 0) {
        e.preventDefault();
        var tester = !!(check && check.checked);
        var subject = tester ? 'Keep me posted (happy to test)' : 'Keep me posted';
        var body = 'Please keep me posted about Aubergenie.\n\n' +
          'Email: ' + (email ? email.value : '') + '\n' +
          "I'd be interested in testing an early version on iPhone: " + (tester ? 'Yes' : 'No') + '\n';
        if (tester) {
          body += '\nHow often I cook: ' + (answer('metadata__cooks') || '-') +
            '\nWhere most of my recipes live: ' + (answer('metadata__recipes_from') || '-') +
            '\nWhat would make cooking more fun: ' + (answer('metadata__wish') || '-') + '\n';
        }
        window.location.href = action.split('?')[0] + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        if (status) status.textContent = 'Your email app should open with a note ready to send. Press send and you’re on the list.';
        return;
      }

      if (button) { button.disabled = true; button.textContent = 'One moment…'; }
      // Restore the button if the visitor comes back with the browser's Back button.
      window.addEventListener('pageshow', function () { if (button) { button.disabled = false; button.textContent = 'Keep me posted'; } }, { once: true });
    });
  });
})();
