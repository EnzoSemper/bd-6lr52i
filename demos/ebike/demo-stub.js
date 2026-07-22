/* Demo shim: makes the real Aeglos eBike frontend run with no backend.
   /api/bikes is served from the real bundled data/bikes.json catalog. */
(function () {
  var realFetch = window.fetch.bind(window);
  function jr(o, s) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json' } }); }
  var routes = [
    [/\/api\/bikes/, function () { return realFetch('./data/bikes.payload.txt').then(function (r) { return r.text(); }).then(function (t) { return new Response(t, { status: 200, headers: { 'Content-Type': 'text/plain' } }); }); }],
    [/\/data\/city-laws\.json/, function () { return realFetch('./data/city-laws.json'); }],
    [/\/api\/news/, function () { return jr({ articles: [] }); }],
    [/\/api\/(auth\/admin\/)?me\b/, function () { return jr({}, 401); }],
    [/\/api\//, function () { return jr({ ok: true, demo: true }); }]
  ];
  window.fetch = function (url, opts) {
    var u = (typeof url === 'string') ? url : (url && url.url) || '';
    for (var i = 0; i < routes.length; i++) if (routes[i][0].test(u)) return Promise.resolve(routes[i][1]());
    return realFetch(url, opts);
  };
})();
