(function () {
  var realFetch = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    var u = (typeof url === 'string') ? url : (url && url.url) || '';
    if (/\/api\//.test(u)) return Promise.resolve(new Response(JSON.stringify({ ok: true, demo: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    return realFetch(url, opts);
  };
})();
