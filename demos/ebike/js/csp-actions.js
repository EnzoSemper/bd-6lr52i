/* =============================================================
   CSP-safe action dispatcher
   -------------------------------------------------------------
   The site's Content-Security-Policy uses `script-src 'self'`
   (no 'unsafe-inline'), which blocks inline on* handlers like
   onclick="fn()". Instead, elements declare:

       data-action="globalFunctionName"
       data-args='[ ...JSON-encoded args... ]'   (optional)

   and this single delegated listener invokes the matching global
   function at click time. Functions must be exposed on window
   (the page scripts already declare them at top level).
   ============================================================= */
(function () {
  // Helper used elsewhere: programmatically click another element by id.
  window.clickEl = function (id) {
    const el = document.getElementById(id);
    if (el) el.click();
  };

  function run(el) {
    const fnName = el.dataset.action;
    const fn = window[fnName];
    if (typeof fn !== 'function') return;

    let args = [];
    if (el.dataset.args) {
      try { args = JSON.parse(el.dataset.args); }
      catch (err) { console.error('[csp-actions] bad data-args on', fnName, err); return; }
    }
    fn.apply(null, args);
  }

  const isFormControl = el =>
    el.matches('input[type="checkbox"],input[type="radio"],select');

  // Buttons/links fire on click; checkboxes/radios/selects fire on change
  // (handled below) so they don't double-invoke.
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (el && !isFormControl(el)) run(el);
  });

  document.addEventListener('change', function (e) {
    const el = e.target.closest('[data-action]');
    if (el && isFormControl(el)) run(el);
  });
})();
