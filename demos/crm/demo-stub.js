/* Demo shim: runs the real Aeglos CRM console with sample data, no backend/auth.
   All values here are illustrative sample data for the portfolio demo. */
(function () {
  var realFetch = window.fetch.bind(window);
  function jr(o, s) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json' } }); }

  var CLIENTS = [
    { id: 'c1', company_name: 'Ridgeline Outfitters', contact_name: 'M. Calloway', email: 'ops@ridgeline.co', phone: '(512) 555-0142', tier: 'enterprise', status: 'active', pipeline_stage: 'closed_won', unread_messages: 2, pending_invoices: 0, created_at: '2026-02-11', industry: 'Outdoor retail', monthly_amount_cents: 240000 },
    { id: 'c2', company_name: 'Harbor & Vale', contact_name: 'D. Okafor', email: 'dokafor@harborvale.com', phone: '(305) 555-0199', tier: 'growth', status: 'active', pipeline_stage: 'closed_won', unread_messages: 0, pending_invoices: 1, created_at: '2026-03-04', industry: 'Logistics', monthly_amount_cents: 120000 },
    { id: 'c3', company_name: 'Northwind Cycles', contact_name: 'A. Bianchi', email: 'a.bianchi@northwind.bike', phone: '(206) 555-0111', tier: 'growth', status: 'active', pipeline_stage: 'closed_won', unread_messages: 1, pending_invoices: 0, created_at: '2026-01-22', industry: 'eBike dealer', monthly_amount_cents: 90000 },
    { id: 'c4', company_name: 'Meridian Fleet', contact_name: 'J. Halvorsen', email: 'fleet@meridian.io', phone: '(415) 555-0175', tier: 'enterprise', status: 'active', pipeline_stage: 'negotiation', unread_messages: 3, pending_invoices: 2, created_at: '2026-04-18', industry: 'Mobility', monthly_amount_cents: 0 },
    { id: 'c5', company_name: 'Copperline Rentals', contact_name: 'Priya N.', email: 'priya@copperline.rent', phone: '(602) 555-0130', tier: 'starter', status: 'active', pipeline_stage: 'proposal', unread_messages: 0, pending_invoices: 0, created_at: '2026-05-02', industry: 'Rentals', monthly_amount_cents: 45000 },
    { id: 'c6', company_name: 'Grove & Third', contact_name: 'Sam Reyes', email: 'sam@groveandthird.com', phone: '(718) 555-0164', tier: null, status: 'prospect', pipeline_stage: 'qualified', unread_messages: 0, pending_invoices: 0, created_at: '2026-05-20', industry: 'Cafe chain', monthly_amount_cents: 0 },
    { id: 'c7', company_name: 'Talon Security', contact_name: 'R. Whitlock', email: 'r.whitlock@talon.sec', phone: '(703) 555-0108', tier: null, status: 'prospect', pipeline_stage: 'lead', unread_messages: 0, pending_invoices: 0, created_at: '2026-06-09', industry: 'Security', monthly_amount_cents: 0 },
    { id: 'c8', company_name: 'Pinewood Co-op', contact_name: 'K. Tanaka', email: 'ktanaka@pinewood.coop', phone: '(503) 555-0187', tier: 'starter', status: 'churned', pipeline_stage: 'closed_lost', unread_messages: 0, pending_invoices: 1, created_at: '2025-12-14', industry: 'Co-op', monthly_amount_cents: 0 }
  ];

  var REVENUE = {
    mrr: 495000,
    paidThisMonth: 372000,
    byTier: [ { tier: 'enterprise', count: 2 }, { tier: 'growth', count: 2 }, { tier: 'starter', count: 2 } ],
    pipeline: [ { pipeline_stage: 'lead', count: 1 }, { pipeline_stage: 'qualified', count: 1 }, { pipeline_stage: 'proposal', count: 1 }, { pipeline_stage: 'negotiation', count: 1 }, { pipeline_stage: 'closed_won', count: 3 }, { pipeline_stage: 'closed_lost', count: 1 } ],
    recentInvoices: [
      { company_name: 'Ridgeline Outfitters', description: 'Enterprise — June', amount_cents: 240000, status: 'paid' },
      { company_name: 'Harbor & Vale', description: 'Growth — June', amount_cents: 120000, status: 'pending' },
      { company_name: 'Northwind Cycles', description: 'Growth — June', amount_cents: 90000, status: 'paid' },
      { company_name: 'Pinewood Co-op', description: 'Final invoice', amount_cents: 45000, status: 'overdue' }
    ]
  };

  var CONTACTS = [
    { name: 'Elena Ross', company: 'Switchback Tours', industry: 'Tourism', created_at: '2026-06-28', email: 'elena@switchback.tours', message: 'Interested in a fleet dashboard for 40 rental eBikes across 3 locations.' },
    { name: 'Marcus Feld', company: 'Feld Logistics', industry: 'Delivery', created_at: '2026-06-21', email: 'm.feld@feldlogistics.com', message: 'Looking for route + battery telemetry for a last-mile delivery pilot.' },
    { name: 'Nadia Roy', company: 'Coastal Cooperative', industry: 'Co-op', created_at: '2026-06-15', email: 'nadia@coastalco.org', message: 'Requesting a demo of the client portal and white-glove onboarding.' }
  ];

  function detail(id) {
    var client = CLIENTS.filter(function (c) { return c.id === id; })[0] || CLIENTS[0];
    return { client: client, deployments: [], features: [], projects: [], milestones: [], messages: [], invoices: [], documents: [], contacts: [], portal_users: [] };
  }

  var routes = [
    [/\/api\/auth\/admin\/me/, function () { return jr({ name: 'Brent Dempsey', email: 'brent@aeglos.systems' }); }],
    [/\/api\/crm\/clients\/[^/]+$/, function (u) { return jr(detail(u.split('/').pop())); }],
    [/\/api\/crm\/clients$/, function () { return jr(CLIENTS); }],
    [/\/api\/crm\/revenue/, function () { return jr(REVENUE); }],
    [/\/api\/crm\/contacts/, function () { return jr(CONTACTS); }],
    [/\/api\//, function () { return jr({ ok: true, demo: true }); }]
  ];
  window.fetch = function (url, opts) {
    var u = (typeof url === 'string') ? url : (url && url.url) || '';
    for (var i = 0; i < routes.length; i++) if (routes[i][0].test(u)) return Promise.resolve(routes[i][1](u));
    return realFetch(url, opts);
  };
})();
