# Brent Dempsey — Portfolio

Operator dossier + live product demos. Full-Stack Developer, writer, and concept architect.
Single self-contained page (`index.html`) with launchable, standalone demos of each product.

## Live demos

Each build panel launches its real product in an overlay — no backend required.

| Demo | What it is |
|------|-----------|
| **Aeglos Platform** | Real white-label platform landing page |
| **AEGLOS Analytics Pro** | Real GeoThreat dashboard, standalone demo mode (Chart.js, simulated intel) |
| **Aeglos eBike Intelligence** | Real aeglos.systems comparison — the actual 84-bike catalog + interactive eBike-law map |
| **Aeglos CRM & Concierge** | Real client console UI, running on sample data |
| **Altimit OS** | The real self-contained web desktop |
| **VOLT QUEST** | Real screenshots from the iOS pixel RPG |

Backend-driven products (eBike catalog, CRM, analytics) run against small bundled
sample/real-data shims (`demos/*/demo-stub.js`) so they work as static pages with no server.
Sample data in the CRM demo is illustrative.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy (GitHub Pages)

Push to a repo, then enable **Settings → Pages → Deploy from branch → main / root**.
`.nojekyll` is included so the `demos/` assets are served as-is.

## Structure

```
index.html          portfolio (self-contained)
demos/
  platform/         Aeglos Platform landing
  analytics/        AEGLOS Analytics Pro (demo mode)
  ebike/            aeglos.systems comparison + law map (+ demo-stub.js)
  crm/              Aeglos CRM console (+ demo-stub.js, sample data)
  altimit/          Altimit OS web desktop
  volt/             VOLT QUEST screenshots
```
