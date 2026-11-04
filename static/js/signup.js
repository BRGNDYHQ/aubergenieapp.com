/*
 * "Keep me posted" signup.
 *
 * Each form's `action` decides where a signup goes:
 *   - https://… (e.g. Buttondown's embed-subscribe URL): the browser submits the form
 *     normally, and the list provider shows its own confirmation (or redirects to /thanks/).
 *   - mailto:…: no list provider yet. We open the visitor's email app with a ready-to-send
 *     note instead, so a signup still reaches us.
 *
 * The beta-tester checkbox is sent as `tag=beta-tester` only when it is ticked.
 * Adding ?test (or #test) to the address ticks it, for links from tester videos.
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
    if (check && wantsTest) check.checked = true;

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
