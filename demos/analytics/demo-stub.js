/* Demo shim: runs the REAL AEGLOS GeoThreat Situation Room with no backend.
   Serves /health + /api/v1/geothreat/* with representative sample intelligence data
   (illustrative, for the portfolio demo). Live services (Bluesky/Telegram/OpenSky) pass through. */
(function () {
  var realFetch = window.fetch.bind(window);
  function jr(o, s) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json' } }); }
  function iso(minAgo) { return new Date(Date.now() - minAgo * 60000).toISOString(); }

  var SEV = { critical: 47, high: 112, moderate: 98, low: 85 };
  var REGION_DIST = { 'Middle East': 89, 'E. Europe': 74, 'E. Asia': 61, 'SE Asia': 48, 'Africa': 34, 'S. Asia': 21, 'Americas': 15 };

  var STATS = {
    total_events: 342, sources_online: 9, sources_total: 9, total_ingested: 1487,
    events_collected: 1487, error_count: 0, latency_ms: 214,
    severity_distribution: SEV, region_distribution: REGION_DIST
  };

  var TITLES = [
    ['Military forces mobilize near contested border region', 'critical', 'E. Europe'],
    ['Diplomatic tensions escalate over territorial dispute', 'critical', 'E. Asia'],
    ['Intelligence reports indicate heightened threat environment', 'high', 'Middle East'],
    ['Security forces respond to coordinated incident', 'high', 'Middle East'],
    ['Regional actors conduct joint military exercise', 'high', 'E. Asia'],
    ['Naval vessels detected in contested maritime zone', 'high', 'SE Asia'],
    ['Economic sanctions trigger political response', 'moderate', 'E. Europe'],
    ['Armed groups advance in contested territory', 'critical', 'Africa'],
    ['International community issues formal warning', 'moderate', 'Global'],
    ['Ceasefire agreement under threat of collapse', 'high', 'Middle East'],
    ['Cross-border incident reported near line of control', 'high', 'S. Asia'],
    ['Energy infrastructure targeted in asymmetric attack', 'critical', 'E. Europe'],
    ['Cyber operations suspected in critical infrastructure sector', 'moderate', 'Americas'],
    ['Population displacement reported in conflict zone', 'moderate', 'Africa'],
    ['State actor denies involvement in reported incident', 'low', 'E. Asia'],
    ['Air defense systems repositioned along frontier', 'high', 'E. Europe']
  ];
  var SRC_NAMES = ['AP News', 'Reuters', 'BBC World', 'Al Jazeera', 'TASS', 'Xinhua', 'DHS', 'DoD', 'FBI'];
  var STORIES = TITLES.map(function (t, i) {
    var srcs = [SRC_NAMES[i % SRC_NAMES.length], SRC_NAMES[(i + 3) % SRC_NAMES.length], SRC_NAMES[(i + 5) % SRC_NAMES.length]].slice(0, 1 + (i % 3));
    return {
      cluster_id: 'clu-' + (1000 + i), headline: t[0], title: t[0],
      sources: srcs, source_categories: ['News', 'Government'], event_count: srcs.length,
      multi_source: srcs.length > 1, region: t[2], severity: t[1],
      confidence: 0.6 + (i % 4) * 0.1, timestamp: iso(i * 12), urls: []
    };
  });

  var CATS = { 'AP News': 'News', 'Reuters': 'News', 'BBC World': 'News', 'Al Jazeera': 'News', 'TASS': 'News', 'Xinhua': 'News', 'DHS': 'Government', 'DoD': 'Government', 'FBI': 'Government' };
  var SOURCES = SRC_NAMES.map(function (n, i) {
    return { name: n, status: 'online', category: CATS[n], reliability: 0.88 + (i % 6) * 0.02,
      events_collected: 120 + i * 37, latency_ms: 160 + i * 24, error_count: 0, last_checked: iso(1) };
  });

  var REGIONS = Object.keys(REGION_DIST).map(function (rname, i) {
    var ec = REGION_DIST[rname];
    var crit = Math.round(ec * 0.16), high = Math.round(ec * 0.34), mod = Math.round(ec * 0.32);
    var latest = (STORIES.filter(function (s) { return s.region === rname; })[0] || {}).headline || 'Monitoring — no critical events';
    return { region: rname, top_severity: i < 2 ? 'critical' : i < 4 ? 'high' : 'moderate',
      latest_event: latest, event_count: ec, critical: crit, high: high, moderate: mod, low: ec - crit - high - mod,
      sources: [SRC_NAMES[i % 9], SRC_NAMES[(i + 2) % 9]] };
  });

  var FC_POINTS = [], REGION_RISK = { 'Middle East': 0.82, 'E. Europe': 0.74, 'E. Asia': 0.61, 'SE Asia': 0.48, 'Africa': 0.55, 'S. Asia': 0.4, 'Americas': 0.28 };
  for (var h = 0; h < 72; h++) {
    var base = 0.4 + 0.16 * Math.sin(2 * Math.PI * h / 24) + (h / 72) * 0.12;
    FC_POINTS.push({ hour: '+' + h + 'h', threat: +base.toFixed(3), upper: +Math.min(1, base + 0.12).toFixed(3), lower: +Math.max(0, base - 0.12).toFixed(3), confidence: +(0.9 - h / 200).toFixed(3) });
  }
  var HOURLY = [];
  for (var q = 0; q < 24; q++) HOURLY.push({ hour: q + ':00', count: 6 + Math.round(10 * Math.abs(Math.sin(q / 3.8)) + (q % 5)) });

  var PATTERNS = {
    hourly_count: HOURLY, severity_distribution: SEV, prophet_decomposition: null,
    detected_patterns: [
      { name: 'Upward trend detected', description: '+0.08 severity/hr sustained escalation across 6h window' },
      { name: 'Regime change', description: '3 significant regime changes in event frequency' },
      { name: 'Diurnal cycle', description: 'Activity peaks at 14:00 UTC on a 24h cycle' },
      { name: 'Source spike', description: 'Correlated spike across 4 independent sources' }
    ]
  };

  var CORR_REGIONS = Object.keys(REGION_DIST);
  var CORR_MATRIX = CORR_REGIONS.map(function (rn, i) {
    return { region: rn, values: CORR_REGIONS.map(function (__, j) { return i === j ? 1 : +(0.2 + 0.6 * Math.cos((i + j) * 1.3)).toFixed(2); }) };
  });
  var SOURCE_HEATMAP = SRC_NAMES.map(function (sn, i) {
    var regs = {}; CORR_REGIONS.forEach(function (rn, j) { regs[rn] = Math.round(4 + 14 * Math.abs(Math.sin((i + j) * 0.9))); });
    return { source: sn, regions: regs };
  });

  var routes = [
    [/\/health$/, function () { return jr({ status: 'ok' }); }],
    [/\/api\/v1\/geothreat\/statistics/, function () { return jr(STATS); }],
    [/\/api\/v1\/geothreat\/stories/, function () { return jr({ stories: STORIES }); }],
    [/\/api\/v1\/geothreat\/sources/, function () { return jr({ sources: SOURCES }); }],
    [/\/api\/v1\/geothreat\/regions/, function () { return jr({ regions: REGIONS }); }],
    [/\/api\/v1\/geothreat\/forecast/, function () { return jr({ points: FC_POINTS, region_risk: REGION_RISK }); }],
    [/\/api\/v1\/geothreat\/patterns/, function () { return jr(PATTERNS); }],
    [/\/api\/v1\/geothreat\/correlation/, function () { return jr({ regions: CORR_REGIONS, correlation_matrix: CORR_MATRIX, source_heatmap: SOURCE_HEATMAP }); }],
    [/\/api\/v1\/geothreat\/ingest/, function () { return jr({ ok: true, ingested: 0 }); }],
    [/\/api\//, function () { return jr({ ok: true, demo: true }); }]
  ];
  window.fetch = function (url, opts) {
    var u = (typeof url === 'string') ? url : (url && (url.url || url.href)) || '';
    for (var i = 0; i < routes.length; i++) if (routes[i][0].test(u)) return Promise.resolve(routes[i][1]());
    return realFetch(url, opts);
  };
})();
