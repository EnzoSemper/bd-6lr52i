/* ==========================================================
   AEGLOS eBike Comparison Tool — app.js
   ========================================================== */

let ALL_BIKES           = [];
let ALL_VOLTAGE_CLASSES = [];
let ALL_WHEEL_COMBOS    = [];
let ALL_THROTTLE_TYPES  = [];
let ALL_BRAKE_TYPES     = [];
let showFiltered        = false;

// Compare feature state
const compareSet = new Set();
const expandedCards = new Set(); // up to 3 bike IDs

// ---- Security Guardian (Deterrent) -----------------
(function() {
  const deterrent = () => {
    const t = performance.now();
    debugger;
    if (performance.now() - t > 100) {
      console.clear();
      console.log("%cAeglos Intelligence System — Data is protected.", "color:gold; font-size:20px; font-weight:bold;");
      console.log("Unauthorized scraping or reproduction is strictly prohibited.");
      return true;
    }
    return false;
  };
  setInterval(deterrent, 2000);
})();

const BUDGET_MAX = 14000;

// ---- QOL Video Auto-Pausing -----------------
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      if (entry.target.contentWindow) {
        entry.target.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      }
    }
  });
}, { threshold: 0.1 });

// Pause other videos when one is clicked
window.addEventListener('blur', () => {
  setTimeout(() => {
    if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
      const activeIframe = document.activeElement;
      document.querySelectorAll('.yt-embed iframe').forEach(iframe => {
        if (iframe !== activeIframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
      });
    }
  }, 100);
});

// ---- Filter state (all defaults = "no filter / show all") -----------------
const filters = {
  weight:            285,
  budget:            BUDGET_MAX,
  motorTypes:        new Set(['mid-drive', 'hub']),   // both = all
  regenRequired:     false,
  openController:    false,
  usDealers:         false,
  withinWeightLimit: false,
  categories:        new Set(['dirt', 'street', 'ebike']),
  bikeSizes:         new Set(['pit-bike', 'intermediate', 'full-size']),
  voltages:          new Set(),          // empty = all
  wheelCombos:       new Set(),          // empty = all
  throttleTypes:     new Set(),          // empty = all
  brakeTypes:        new Set(),          // empty = all
  riding:            new Set(),          // empty = all
  sort:              'rank',
  brand:             'all',
  model:             'all',
};

// -------------------------------------------------------
// LocalStorage profile persistence
// -------------------------------------------------------
function saveProfile() {
  try {
    localStorage.setItem('aeglos_profile', JSON.stringify({
      _v:                2,                            // version tag
      weight:            filters.weight,
      budget:            filters.budget,
      motorTypes:        [...filters.motorTypes],
      regenRequired:     filters.regenRequired,
      openController:    filters.openController,
      usDealers:         filters.usDealers,
      withinWeightLimit: filters.withinWeightLimit,
      categories:        [...filters.categories],
      bikeSizes:         [...filters.bikeSizes],
      voltages:          [...filters.voltages],
      wheelCombos:       [...filters.wheelCombos],
      throttleTypes:     [...filters.throttleTypes],
      brakeTypes:        [...filters.brakeTypes],
      riding:            [...filters.riding],
      sort:              filters.sort,
      brand:             filters.brand,
      model:             filters.model,
    }));
  } catch (_) {}
}

function loadProfile() {
  try {
    const raw = localStorage.getItem('aeglos_profile');
    if (!raw) return false;
    const p = JSON.parse(raw);

    // Migrate old format (v1 had motorType string instead of motorTypes array)
    if (p._v !== 2) {
      localStorage.removeItem('aeglos_profile');
      return false;
    }

    if (p.weight            != null) filters.weight            = p.weight;
    if (p.budget            != null) filters.budget            = p.budget;
    if (Array.isArray(p.motorTypes))   filters.motorTypes   = new Set(p.motorTypes);
    if (p.regenRequired     != null) filters.regenRequired     = p.regenRequired;
    if (p.openController    != null) filters.openController    = p.openController;
    if (p.usDealers         != null) filters.usDealers         = p.usDealers;
    if (p.withinWeightLimit != null) filters.withinWeightLimit = p.withinWeightLimit;
    if (Array.isArray(p.categories))  filters.categories  = new Set(p.categories);
    if (Array.isArray(p.bikeSizes))   filters.bikeSizes   = new Set(p.bikeSizes);
    if (Array.isArray(p.voltages))    filters.voltages    = new Set(p.voltages);
    if (Array.isArray(p.wheelCombos)) filters.wheelCombos = new Set(p.wheelCombos);
    if (Array.isArray(p.throttleTypes)) filters.throttleTypes = new Set(p.throttleTypes);
    if (Array.isArray(p.brakeTypes))  filters.brakeTypes  = new Set(p.brakeTypes);
    if (Array.isArray(p.riding))      filters.riding      = new Set(p.riding);
    if (p.sort              != null) filters.sort              = p.sort;
    if (p.brand             != null) filters.brand             = p.brand;
    if (p.model             != null) filters.model             = p.model;
    return true;
  } catch (_) { return false; }
}

// -------------------------------------------------------
// Utilities
// -------------------------------------------------------
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

// Build CSP-safe action attributes (replaces inline onclick). See js/csp-actions.js
function _act(fn, ...args) {
  if (!args.length) return `data-action="${fn}"`;
  const j = JSON.stringify(args)
    .replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
  return `data-action="${fn}" data-args='${j}'`;
}

// Render text with {weight}, {headroom}, {over} substituted from current filter state
function renderText(str, bike) {
  if (str == null) return '';
  const w     = filters.weight;
  const limit = bike && bike.specs ? (bike.specs.weight_limit_lbs || 0) : 0;
  const headroom = limit ? Math.max(0, limit - w) : 0;
  const over     = limit ? Math.max(0, w - limit) : 0;
  return esc(String(str)
    .replace(/\{weight\}/g, w)
    .replace(/\{limit\}/g, limit)
    .replace(/\{headroom\}/g, headroom)
    .replace(/\{over\}/g, over));
}

function regenIcon(val) {
  if (val === true)  return '<span class="spec-check">✓ Confirmed</span>';
  if (val === false) return '<span class="spec-cross">✗ No</span>';
  return '<span class="spec-question">? Unconfirmed</span>';
}

function motorClass(type) {
  return type === 'mid-drive' ? 'motor-mid-drive' : 'motor-hub';
}

function budgetLabel(val) {
  return val >= BUDGET_MAX ? 'No limit' : '$' + val.toLocaleString();
}

function bikeSizeLabel(s) {
  return s === 'pit-bike' ? 'Pit Bike' : s === 'intermediate' ? 'Intermediate' : s === 'full-size' ? 'Full Size' : null;
}

function throttleLabel(t) {
  return t === 'twist' ? 'Twist' : t === 'thumb' ? 'Thumb' : t === 'pedal-only' ? 'Pedal Only' : esc(t);
}

function brakeLabel(b) {
  const map = { 'hydraulic-disc': 'Hydraulic Disc', 'mechanical-disc': 'Mechanical Disc', drum: 'Drum', coaster: 'Coaster/Pedal' };
  return map[b] || esc(b);
}

function toast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, 3500);
}

// -------------------------------------------------------
// Dynamic verdict — computed from CURRENT filter state
// -------------------------------------------------------
function computeVerdict(bike) {
  if (!bike.specs) return { text: bike.verdict || 'Unknown', color: bike.verdict_color || 'pass', computed: false, tooltip: '' };
  const s = bike.specs;
  const failures = [];
  const reasons  = [];

  // Weight over published limit
  if (s.weight_limit_lbs && filters.weight > s.weight_limit_lbs) {
    const over = filters.weight - s.weight_limit_lbs;
    failures.push('Over limit');
    reasons.push(`You are ${over} lbs over the published ${s.weight_limit_lbs} lb weight limit — structural limit, not a guideline`);
  }
  // Motor type mismatch
  if (filters.motorTypes.size < 2 && !filters.motorTypes.has(s.motor_type)) {
    failures.push('Motor mismatch');
    reasons.push(`This bike has a ${s.motor_type} motor — your filter requires ${[...filters.motorTypes][0]}`);
  }
  // Over budget
  if (filters.budget < BUDGET_MAX && bike.price_usd != null && bike.price_usd > filters.budget) {
    failures.push('Over budget');
    reasons.push(`$${bike.price_usd.toLocaleString()} exceeds your $${filters.budget.toLocaleString()} budget`);
  }
  // Regen required but absent
  if (filters.regenRequired && s.regen_braking !== true) {
    failures.push('No regen');
    reasons.push('Regen braking required by your filter — this bike does not have confirmed regen');
  }
  // Open controller required
  if (filters.openController && !s.controller_open) {
    failures.push('Closed controller');
    reasons.push('Open/tunable controller required by your filter — this bike has a locked controller');
  }
  // US dealers required
  if (filters.usDealers && !s.us_dealers) {
    failures.push('No US dealers');
    reasons.push('US dealers required by your filter — this bike has no confirmed US dealer network');
  }

  if (failures.length > 0) {
    return { text: failures.join(' · '), color: 'red', computed: true, tooltip: reasons.join('\n') };
  }

  // Soft warning: thin weight margin
  if (s.weight_limit_lbs) {
    const margin = s.weight_limit_lbs - filters.weight;
    if (margin >= 0 && margin < 25) {
      return {
        text: bike.verdict + ' ⚠',
        color: 'amber',
        computed: true,
        tooltip: `Tight weight margin: only ${margin} lbs of headroom at your ${filters.weight} lb weight (limit is ${s.weight_limit_lbs} lbs) — ride within spec`,
      };
    }
  }

  return { text: bike.verdict, color: bike.verdict_color, computed: false, tooltip: bike.tagline || '' };
}

// -------------------------------------------------------
// Dynamic rider note — always mathematically correct
// -------------------------------------------------------
function buildRiderNote(bike) {
  if (!bike.specs) return null;
  const s     = bike.specs;
  const limit = s.weight_limit_lbs;
  const w     = filters.weight;

  if (limit) {
    const diff = limit - w;   // positive = headroom, negative = over

    if (diff < 0) {
      // Rider is over the limit — generate hard stop dynamically, never trust static text
      return `Hard stop — you are ${Math.abs(diff)} lbs over the ${limit} lb published weight limit. ` +
             `This is a structural frame limit, not a guideline. Do not ride this bike at your current weight.`;
    }

    if (diff < 25) {
      // Tight margin — show dynamic warning, then append static note if it adds context
      const extra = bike.heavy_rider_note ? ` ${renderText(bike.heavy_rider_note, bike)}` : '';
      return `Tight margin — ${limit} lb limit leaves only ${diff} lbs of headroom at your ${w} lb weight.${extra}`;
    }
  }

  // Comfortable headroom or no published limit — show static note as written
  return bike.heavy_rider_note ? renderText(bike.heavy_rider_note, bike) : null;
}

// -------------------------------------------------------
// Weight helpers
// -------------------------------------------------------
function weightStatusClass(bike) {
  const limit = bike.specs.weight_limit_lbs;
  if (!limit) return '';
  const diff = limit - filters.weight;
  if (diff < 0)  return 'weight-danger';
  if (diff < 25) return 'weight-warning';
  return '';
}

function weightHeadroomLabel(bike) {
  const limit = bike.specs.weight_limit_lbs;
  if (!limit) return `<span class="stat-chip"><strong>Limit:</strong> N/P</span>`;
  const diff = limit - filters.weight;
  if (diff < 0)
    return `<span class="stat-chip danger"><strong>${limit} lb limit</strong> — ${Math.abs(diff)} lbs OVER</span>`;
  if (diff < 25)
    return `<span class="stat-chip warn"><strong>${limit} lb limit</strong> — ${diff} lbs margin</span>`;
  return `<span class="stat-chip good"><strong>${limit} lb limit</strong> — ${diff} lbs headroom</span>`;
}

// -------------------------------------------------------
// Results counter
// -------------------------------------------------------
function updateCounter(passing, filtered) {
  const el = document.getElementById('resultsCount');
  if (!el) return;
  if (filtered.length === 0) {
    el.innerHTML = `<strong>${passing.length}</strong> bikes`;
  } else {
    el.innerHTML = `<strong>${passing.length}</strong> matching &nbsp;·&nbsp; <strong>${filtered.length}</strong> filtered out`;
  }
}

// -------------------------------------------------------
// Active filter badge count
// -------------------------------------------------------
function countActiveFilters() {
  let n = 0;
  if (filters.budget < BUDGET_MAX)                                                       n++;
  if (filters.motorTypes.size < 2)                                                       n++;
  if (filters.regenRequired)                                                              n++;
  if (filters.openController)                                                             n++;
  if (filters.usDealers)                                                                  n++;
  if (filters.withinWeightLimit)                                                          n++;
  if (filters.categories.size < 3)                                                        n++;
  if (filters.bikeSizes.size < 3)                                                         n++;
  if (filters.voltages.size > 0 && filters.voltages.size < ALL_VOLTAGE_CLASSES.length)   n++;
  if (filters.wheelCombos.size > 0 && filters.wheelCombos.size < ALL_WHEEL_COMBOS.length) n++;
  if (filters.throttleTypes.size > 0 && filters.throttleTypes.size < ALL_THROTTLE_TYPES.length) n++;
  if (filters.brakeTypes.size > 0 && filters.brakeTypes.size < ALL_BRAKE_TYPES.length)   n++;
  if (filters.riding.size > 0)                                                            n++;
  if (filters.brand !== 'all')                                                            n++;
  if (filters.model !== 'all')                                                            n++;
  return n;
}

function updateActiveFilterBadge() {
  const badge = document.getElementById('activeFilterBadge');
  if (!badge) return;
  const count = countActiveFilters();
  if (count > 0) { badge.textContent = count + ' active'; badge.classList.remove('hidden'); }
  else badge.classList.add('hidden');
}

// -------------------------------------------------------
// Filter logic
// -------------------------------------------------------
function bikePassesFilters(bike) {
  const s = bike.specs;

  // Category
  if (filters.categories.size < 3 && bike.category) {
    if (!filters.categories.has(bike.category)) return false;
  }
  // Bike size
  if (filters.bikeSizes.size < 3 && bike.bike_size) {
    if (!filters.bikeSizes.has(bike.bike_size)) return false;
  }
  // Motor type
  if (filters.motorTypes.size < 2) {
    if (!filters.motorTypes.has(s.motor_type)) return false;
  }
  // Throttle type
  if (filters.throttleTypes.size > 0 && filters.throttleTypes.size < ALL_THROTTLE_TYPES.length) {
    if (!filters.throttleTypes.has(s.throttle_type)) return false;
  }
  // Brake type
  if (filters.brakeTypes.size > 0 && filters.brakeTypes.size < ALL_BRAKE_TYPES.length) {
    if (!filters.brakeTypes.has(s.brake_type)) return false;
  }
  // Budget
  if (filters.budget < BUDGET_MAX && bike.price_usd != null && bike.price_usd > filters.budget) return false;
  // Regen
  if (filters.regenRequired && s.regen_braking !== true) return false;
  // Open controller
  if (filters.openController && !s.controller_open) return false;
  // US Dealers
  if (filters.usDealers && !s.us_dealers) return false;
  // Within weight limit
  if (filters.withinWeightLimit && s.weight_limit_lbs != null && s.weight_limit_lbs < filters.weight) return false;
  // Voltage
  if (filters.voltages.size > 0 && filters.voltages.size < ALL_VOLTAGE_CLASSES.length) {
    if (!filters.voltages.has(bike.voltage_class)) return false;
  }
  // Wheel combo
  if (filters.wheelCombos.size > 0 && filters.wheelCombos.size < ALL_WHEEL_COMBOS.length) {
    if (!filters.wheelCombos.has(bike.wheel_combo)) return false;
  }
  // Riding preference
  if (filters.riding.size > 0) {
    const bikePrefs = bike.riding_preference || [];
    if (!bikePrefs.some(p => filters.riding.has(p))) return false;
  }

  if (filters.brand !== 'all') { if (bike.brand !== filters.brand) return false; }
  if (filters.model !== 'all') { if (bike.id !== filters.model) return false; }
  return true;
}

function failReasons() {
  const r = [];
  if (filters.budget < BUDGET_MAX)       r.push(`budget ≤ ${budgetLabel(filters.budget)}`);
  if (filters.motorTypes.size < 2)       r.push([...filters.motorTypes][0] === 'mid-drive' ? 'mid-drive only' : 'hub drive only');
  if (filters.regenRequired)             r.push('regen required');
  if (filters.openController)            r.push('open controller');
  if (filters.usDealers)                 r.push('US dealers only');
  if (filters.withinWeightLimit)         r.push(`within ${filters.weight} lb limit`);
  if (filters.categories.size < 3)       r.push('category restricted');
  if (filters.bikeSizes.size < 3)        r.push('size restricted');
  if (filters.throttleTypes.size > 0 && filters.throttleTypes.size < ALL_THROTTLE_TYPES.length) r.push('throttle restricted');
  if (filters.brakeTypes.size > 0 && filters.brakeTypes.size < ALL_BRAKE_TYPES.length) r.push('brake restricted');
  if (filters.voltages.size > 0 && filters.voltages.size < ALL_VOLTAGE_CLASSES.length) r.push('voltage restricted');
  if (filters.wheelCombos.size > 0 && filters.wheelCombos.size < ALL_WHEEL_COMBOS.length) r.push('wheel restricted');
  if (filters.riding.size > 0)           r.push('riding style restricted');
  if (filters.brand !== 'all')           r.push('brand restricted');
  if (filters.model !== 'all')           r.push('model restricted');
  return r;
}

// -------------------------------------------------------
// Sort
// -------------------------------------------------------
function sortBikes(arr) {
  const s = [...arr];
  switch (filters.sort) {
    case 'price-asc':    s.sort((a, b) => (a.price_usd ?? Infinity) - (b.price_usd ?? Infinity)); break;
    case 'price-desc':   s.sort((a, b) => (b.price_usd ?? -Infinity) - (a.price_usd ?? -Infinity)); break;
    case 'weight-limit': s.sort((a, b) => (b.specs.weight_limit_lbs ?? -1) - (a.specs.weight_limit_lbs ?? -1)); break;
    case 'motor-watts':  s.sort((a, b) => (b.specs.motor_watts_peak ?? 0) - (a.specs.motor_watts_peak ?? 0)); break;
    default:             s.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)); break;
  }
  return s;
}

// -------------------------------------------------------
// Render a single bike card
// -------------------------------------------------------
function renderBikeCard(bike) {
  const expandedClass = expandedCards.has(bike.id) ? ' expanded' : '';
  const s = bike.specs;
  const verdict       = computeVerdict(bike);
  const filtersActive = countActiveFilters() > 0;
  const wClass        = weightStatusClass(bike);

  const topPros  = (bike.pros || []).slice(0, 3);
  const codesHtml = (bike.discount_codes || [])
    .map(c => `<span class="deal-code">${esc(c)}</span>`).join('');

  const specRows = [
    ['Motor Type',        `<span class="motor-badge ${motorClass(s.motor_type)}">${esc(s.motor_type)}</span>`],
    ['Peak Wattage',      s.motor_watts_peak ? `${(s.motor_watts_peak/1000).toFixed(1)}kW` : null],
    ['Torque',            s.torque_nm ? `${s.torque_nm} Nm` : null],
    ['Top Speed',         s.top_speed_mph ? `${s.top_speed_mph} mph` : null],
    ['Throttle',          s.throttle_type ? throttleLabel(s.throttle_type) : null],
    ['Brakes',            s.brakes || null],
    ['Brake Type',        s.brake_type ? brakeLabel(s.brake_type) : null],
    ['Regen Braking',     regenIcon(s.regen_braking)],
    ['Battery',           s.battery_wh ? `${s.battery_voltage}V / ${s.battery_ah}Ah (${s.battery_wh}Wh)` : null],
    ['Range (claimed)',   s.range_claimed_miles ? `${s.range_claimed_miles} mi` : null],
    ['Range (real est.)', s.range_real_world_estimate_miles ? renderText(s.range_real_world_estimate_miles, bike) : null],
    ['Charge Time',       s.charge_time_full_hours ? `${s.charge_time_full_hours}h full` : null],
    ['Weight Limit',      s.weight_limit_lbs ? `${s.weight_limit_lbs} lbs` : 'Not published'],
    ['Wheel Size',        (s.wheel_size_front_inches && s.wheel_size_rear_inches)
                            ? `${s.wheel_size_front_inches}" front / ${s.wheel_size_rear_inches}" rear`
                            : (s.wheel_size_front_inches ? `${s.wheel_size_front_inches}"` : null)],
    ['Bike Size',         bikeSizeLabel(bike.bike_size)],
    ['Front Suspension',  s.suspension_front || null],
    ['Rear Suspension',   s.suspension_rear || null],
    ['Controller',        s.controller_open === true
                            ? '<span class="spec-check">✓ Open/Tunable</span>'
                            : (s.controller_open === false ? '<span class="spec-cross">✗ Closed/Proprietary</span>' : '<span class="spec-question">?</span>')],
    ['Seat Height',       s.seat_height_inches ? `${s.seat_height_inches}"` : null],
    ['Bike Weight',       s.bike_weight_lbs ? `${s.bike_weight_lbs} lbs` : null],
    ['Frame',             s.frame_material || null],
    ['Waterproof',        s.waterproof_rating || null],
    ['Warranty',          s.warranty_years ? `${s.warranty_years} year${s.warranty_years > 1 ? 's' : ''}` : null],
    ['US Dealers',        s.us_dealers ? '<span class="spec-check">✓ Yes</span>' : '<span class="spec-cross">✗ Online only</span>'],
    ['Voltage Class',     bike.voltage_class || null],
    ['Origin',            bike.country_of_origin || null],
    ['Manufacturer',      bike.oem_manufacturer || null],
    ['Motor OEM',         bike.motor_oem || null],
  ].filter(r => r[1] != null);

  const specTableHtml = specRows
    .map(([label, val]) => `<tr><td class="spec-label">${esc(label)}</td><td class="spec-value">${val}</td></tr>`)
    .join('');

  const oemNotesHtml = bike.shared_platform_notes
    ? `<div class="oem-note"><strong>OEM Note:</strong> ${esc(bike.shared_platform_notes)}</div>` : '';

  const prosHtml = (bike.pros || []).map(p => `<li>${renderText(p, bike)}</li>`).join('');
  const consHtml = (bike.cons || []).map(c => `<li>${renderText(c, bike)}</li>`).join('');

  let selectedVideoId = bike.youtube_video_id;
  if (Array.isArray(selectedVideoId) && selectedVideoId.length > 0) {
    selectedVideoId = selectedVideoId[Math.floor(Math.random() * selectedVideoId.length)];
  }

  const ytEmbed = (selectedVideoId && typeof selectedVideoId === 'string')
    ? `<div class="yt-embed"><iframe src="https://www.youtube.com/embed/${esc(selectedVideoId)}?playsinline=1&rel=0&enablejsapi=1"
         title="Video review" allowfullscreen loading="lazy"></iframe></div>` : '';

  const modPathHtml = bike.mod_path
    ? `<div class="mod-path"><div class="mod-path-title">Mod Path</div>${renderText(bike.mod_path, bike)}</div>` : '';

  const dealHtml = (bike.current_deals || codesHtml)
    ? `<div class="deal-block"><strong>Current Deals:</strong> ${esc(bike.current_deals || '')}
         ${codesHtml ? `<div class="deal-codes">${codesHtml}</div>` : ''}</div>` : '';

  const suspNotes = s.suspension_notes
    ? `<p style="font-size:12px;color:var(--text-muted);margin-top:8px;">${renderText(s.suspension_notes, bike)}</p>` : '';

  const _riderNote = buildRiderNote(bike);
  const riderNoteHtml = _riderNote
    ? `<div class="rider-note"><strong>${filters.weight} LB RIDER NOTE:</strong> ${_riderNote}</div>` : '';

  const sizeBadge = bike.bike_size
    ? `<span class="size-badge size-${bike.bike_size}">${bikeSizeLabel(bike.bike_size)}</span>` : '';
  const catLabel = { dirt:'Dirt', street:'Street', ebike:'eBike' }[bike.category] || '';
  const catBadge = bike.category
    ? `<span class="cat-badge cat-${bike.category}">${catLabel}</span>` : '';

  return `
<div class="bike-card ${wClass}${expandedClass}" id="bike-${esc(bike.id)}">
  <div class="card-header" data-toggle-id="${esc(bike.id)}">
    <div class="rank-badge">#${bike.rank}</div>
    <div class="card-meta">
      <div class="card-title">${esc(bike.name)}</div>
      <div class="card-brand">${esc(bike.brand)} ${sizeBadge} ${catBadge}</div>
      <div class="card-tagline">${esc(bike.tagline)}</div>
    </div>
    <div class="card-right">
      <div class="card-price">${bike.price_usd ? '$' + bike.price_usd.toLocaleString() : 'TBA'}</div>
      <div class="card-price-sub">${esc(bike.price_range)}</div>
      ${filtersActive ? `<div class="verdict-badge verdict-${esc(verdict.color)}"${verdict.tooltip ? ` data-tip="${esc(verdict.tooltip)}"` : ''}>${esc(verdict.text)}</div>` : ''}
      <img class="card-bike-img" src="/images/bikes/${esc(bike.id)}.png" alt="${esc(bike.name)}" onerror="this.style.display='none'">
    </div>
  </div>

  <div class="card-stats">
    <span class="stat-chip ${s.motor_type === 'mid-drive' ? 'good' : 'danger'}">
      <strong>${s.motor_type === 'mid-drive' ? 'MID-DRIVE' : 'HUB MOTOR'}</strong>
    </span>
    ${s.motor_watts_peak ? `<span class="stat-chip"><strong>${(s.motor_watts_peak/1000).toFixed(1)}kW</strong> peak</span>` : ''}
    ${s.torque_nm ? `<span class="stat-chip"><strong>${s.torque_nm} Nm</strong></span>` : ''}
    ${weightHeadroomLabel(bike)}
    ${(s.wheel_size_front_inches && s.wheel_size_rear_inches)
      ? `<span class="stat-chip ${s.wheel_size_front_inches >= 17 ? 'highlight' : ''}"><strong>${s.wheel_size_front_inches}"/${s.wheel_size_rear_inches}"</strong></span>`
      : ''}
    ${s.throttle_type ? `<span class="stat-chip"><strong>${throttleLabel(s.throttle_type)}</strong> throttle</span>` : ''}
    ${s.brake_type ? `<span class="stat-chip">${brakeLabel(s.brake_type)}</span>` : ''}
    ${s.regen_braking === true ? `<span class="stat-chip good"><strong>REGEN</strong> ✓</span>` : ''}
    ${s.controller_open ? `<span class="stat-chip highlight"><strong>Open Controller</strong></span>` : ''}
    ${s.battery_wh ? `<span class="stat-chip"><strong>${s.battery_wh}Wh</strong></span>` : ''}
    <span class="stat-chip">${esc(bike.voltage_class)}</span>
  </div>

  ${topPros.length ? `<div class="card-pros-strip">
    ${topPros.map(p => `<div class="pro-item">${renderText(p, bike)}</div>`).join('')}
  </div>` : ''}

  <div class="card-footer" data-toggle-id="${esc(bike.id)}">
    <label class="compare-label-btn">
      <input type="checkbox" id="cmp-${esc(bike.id)}"
        ${compareSet.has(bike.id) ? 'checked' : ''}
        ${!compareSet.has(bike.id) && compareSet.size >= 3 ? 'disabled' : ''}
        ${_act('toggleCompare', bike.id)}> Compare
    </label>
    <div class="expand-btn">Full Details <span class="expand-arrow">▼</span></div>
  </div>

  <div class="card-detail">
    <div class="detail-grid">
      <div>
        <table class="spec-table">
          <thead><tr><th colspan="2">Full Specifications</th></tr></thead>
          <tbody>${specTableHtml}</tbody>
        </table>
        ${suspNotes}
        ${oemNotesHtml}
        ${dealHtml}
        ${s.special_features && s.special_features.length ? `
        <div style="margin-top:12px;">
          <div class="filter-section-title" style="margin-top:0;">Special Features</div>
          ${s.special_features.map(f => `<div class="pro-item">${esc(f)}</div>`).join('')}
        </div>` : ''}
        ${bike.url ? `<a href="${esc(bike.url)}" target="_blank" rel="noopener" class="buy-btn">
          View on ${esc(bike.brand)} ↗</a>` : ''}
      </div>
      <div>
        <div class="pros-cons-grid">
          <div class="pros-block">
            <div class="pros-cons-title green">Pros</div>
            <ul class="pros-list">${prosHtml}</ul>
          </div>
          <div class="cons-block">
            <div class="pros-cons-title red">Cons</div>
            <ul class="cons-list">${consHtml}</ul>
          </div>
        </div>
        ${riderNoteHtml}
        ${modPathHtml}
        ${ytEmbed}
      </div>
    </div>
  </div>
</div>`;
}

// -------------------------------------------------------
// Toggle card expansion
// -------------------------------------------------------
function toggleCard(id) {
  const card = document.getElementById('bike-' + id);
  if (card) {
    if (card.classList.toggle('expanded')) {
      expandedCards.add(id);
    } else {
      expandedCards.delete(id);
    }
  }
}

// -------------------------------------------------------
// Render all bikes
// -------------------------------------------------------
function renderBikes() {
  const list     = document.getElementById('bikesList');
  const passing  = sortBikes(ALL_BIKES.filter(b => bikePassesFilters(b)));
  const filtered = sortBikes(ALL_BIKES.filter(b => !bikePassesFilters(b)));

  updateCounter(passing, filtered);

  // Hero subtitle
  const sub = document.getElementById('heroSubtitle');
  if (sub) sub.textContent = `${ALL_BIKES.length} bikes across dirt, street & eBike — filter by weight, budget, motor & more`;

  // No-results state
  const noResults = document.getElementById('noResults');
  if (passing.length === 0) {
    const reasons = failReasons();
    const reasonEl = document.getElementById('noResultsReason');
    if (reasonEl && reasons.length) reasonEl.textContent = 'Active filters: ' + reasons.join(', ');
    noResults.classList.remove('hidden');
  } else {
    noResults.classList.add('hidden');
  }

  let html = '';

  // Compare mode: show compare view when 2+ bikes selected
  if (compareSet.size >= 2) {
    html = renderCompareView();
    // Still show cards below compare view so user can add/remove
    html += `<div style="margin-top:12px;">`;
    passing.forEach(bike => { html += renderBikeCard(bike); });
    if (filtered.length > 0) {
      html += `<div class="section-divider">
        <div class="section-divider-line"></div>
        <div class="section-divider-text">Filtered Out (${filtered.length})</div>
        <div class="section-divider-line"></div>
      </div>`;
      if (showFiltered) {
        filtered.forEach(bike => { html += renderBikeCard(bike); });
      }
    }
    html += `</div>`;
  } else {
    passing.forEach(bike => { html += renderBikeCard(bike); });
    if (filtered.length > 0) {
      html += `<div class="section-divider">
        <div class="section-divider-line"></div>
        <div class="section-divider-text">Filtered Out (${filtered.length})</div>
        <div class="section-divider-line"></div>
      </div>`;
      if (showFiltered) {
        filtered.forEach(bike => { html += renderBikeCard(bike); });
      } else {
        html += `<div style="text-align:center;padding:16px 0;color:var(--text-muted);font-size:13px;">
          ${filtered.length} bike${filtered.length !== 1 ? 's' : ''} hidden by current filters —
          <button class="btn btn-outline btn-sm" ${_act('clickEl','showEliminatedBtn')}>Show Them</button>
        </div>`;
      }
    }
  }

  // Spacer so content isn't hidden behind compare bar
  if (compareSet.size > 0) html += `<div class="compare-bar-spacer"></div>`;

  list.innerHTML = html;
  updateActiveFilterBadge();
  saveProfile();

  document.querySelectorAll('.yt-embed iframe').forEach(iframe => videoObserver.observe(iframe));
}

// -------------------------------------------------------
// Generic chip filter builder (for dynamic filter groups)
// -------------------------------------------------------
function buildChipFilter(containerId, allValues, filterSet, allSet, labelFn, onToggle) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  allValues.forEach(val => {
    const chip = document.createElement('span');
    const isActive = filterSet.size === 0 || filterSet.has(val);
    chip.className = 'ms-chip' + (isActive ? ' active' : '');
    chip.dataset.val = val;
    chip.textContent = labelFn ? labelFn(val) : val;
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      if (chip.classList.contains('active')) filterSet.add(val);
      else filterSet.delete(val);
      // If all selected again, treat as "no filter"
      if (filterSet.size === allSet.length) {
        filterSet.clear();
        container.querySelectorAll('.ms-chip').forEach(c => c.classList.add('active'));
      }
      onToggle();
    });
    container.appendChild(chip);
  });
}

// -------------------------------------------------------
// Wire static chip groups (categories, bike sizes, motor types, riding)
// -------------------------------------------------------
function wireStaticChipFilter(containerId, filterSet, totalSize, onToggle) {
  document.querySelectorAll(`#${containerId} .ms-chip`).forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      const val = chip.dataset.val;
      if (chip.classList.contains('active')) filterSet.add(val);
      else filterSet.delete(val);
      onToggle();
    });
  });
}

// -------------------------------------------------------
// Sync all UI controls to current filter state
// -------------------------------------------------------
function syncUIToFilters() {
  document.getElementById('riderWeight').value         = filters.weight;
  document.getElementById('weightVal').textContent     = `${filters.weight} lbs`;
  document.getElementById('budgetRange').value         = filters.budget;
  document.getElementById('budgetVal').textContent     = budgetLabel(filters.budget);
  document.getElementById('regenRequired').checked     = filters.regenRequired;
  document.getElementById('openController').checked    = filters.openController;
  document.getElementById('usDealers').checked         = filters.usDealers;
  document.getElementById('withinWeightLimit').checked = filters.withinWeightLimit;

  document.querySelectorAll('#categoryFilter .ms-chip').forEach(c => {
    c.classList.toggle('active', filters.categories.has(c.dataset.val));
  });
  document.querySelectorAll('#bikeSizeFilter .ms-chip').forEach(c => {
    c.classList.toggle('active', filters.bikeSizes.has(c.dataset.val));
  });
  document.querySelectorAll('#motorTypeFilter .ms-chip').forEach(c => {
    c.classList.toggle('active', filters.motorTypes.has(c.dataset.val));
  });
  document.querySelectorAll('#ridingFilter .ms-chip').forEach(c => {
    c.classList.toggle('active', filters.riding.has(c.dataset.val));
  });

  const sortSel = document.getElementById('sortSelect');
  if (sortSel) sortSel.value = filters.sort;

  const brandSel = document.getElementById('brandSelectFilter');
  if (brandSel) {
    if (Array.from(brandSel.options).some(o => o.value === filters.brand)) {
      brandSel.value = filters.brand;
    } else {
      filters.brand = 'all'; brandSel.value = 'all';
    }
    updateModelDropdown();
    const modelSel = document.getElementById('modelSelectFilter');
    if (modelSel && Array.from(modelSel.options).some(o => o.value === filters.model)) {
      modelSel.value = filters.model;
    } else {
      filters.model = 'all';
      if(modelSel) modelSel.value = 'all';
    }
  }

  // Dynamic chip containers are rebuilt on init and already reflect state
}

// -------------------------------------------------------
// Wire all filter events
// -------------------------------------------------------

function populateBrandDropdown() {
  const brandSel = document.getElementById('brandSelectFilter');
  if (!brandSel) return;
  const brands = new Set();
  ALL_BIKES.forEach(b => { if (b.brand) brands.add(b.brand); });
  const sortedBrands = Array.from(brands).sort();
  
  // Keep original options but clear everything except the first
  brandSel.innerHTML = '<option value="all">All Brands</option>';
  sortedBrands.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    brandSel.appendChild(opt);
  });
}

function updateModelDropdown() {
  const modelSel = document.getElementById('modelSelectFilter');
  if (!modelSel) return;
  modelSel.innerHTML = '<option value="all">All Models</option>';
  
  if (filters.brand === 'all') {
    modelSel.disabled = true;
    return;
  }
  
  modelSel.disabled = false;
  const matchingBikes = ALL_BIKES.filter(b => b.brand === filters.brand);
  // Sort alphabetically by name
  matchingBikes.sort((a,b) => a.name.localeCompare(b.name));
  
  matchingBikes.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = b.name;
    modelSel.appendChild(opt);
  });
}

function initFilters() {

  
  // Brand and Model dropdowns
  const brandSel = document.getElementById('brandSelectFilter');
  if (brandSel) {
    brandSel.addEventListener('change', e => {
      filters.brand = e.target.value;
      filters.model = 'all'; // reset model when brand changes
      updateModelDropdown();
      renderBikes();
    });
  }
  const modelSel = document.getElementById('modelSelectFilter');
  if (modelSel) {
    modelSel.addEventListener('change', e => {
      filters.model = e.target.value;
      renderBikes();
    });
  }

  // Sliders
  document.getElementById('riderWeight').addEventListener('input', e => {
    filters.weight = parseInt(e.target.value);
    document.getElementById('weightVal').textContent = `${filters.weight} lbs`;
    renderBikes();
  });
  document.getElementById('budgetRange').addEventListener('input', e => {
    filters.budget = parseInt(e.target.value);
    document.getElementById('budgetVal').textContent = budgetLabel(filters.budget);
    renderBikes();
  });

  // Toggles
  ['regenRequired','openController','usDealers','withinWeightLimit'].forEach(id => {
    document.getElementById(id).addEventListener('change', e => {
      filters[id] = e.target.checked; renderBikes();
    });
  });

  // Static chip filters
  wireStaticChipFilter('categoryFilter',  filters.categories, 3, renderBikes);
  wireStaticChipFilter('bikeSizeFilter',  filters.bikeSizes,  3, renderBikes);
  wireStaticChipFilter('motorTypeFilter', filters.motorTypes, 2, renderBikes);
  wireStaticChipFilter('ridingFilter',    filters.riding,    99, renderBikes);

  // Sort
  document.getElementById('sortSelect').addEventListener('change', e => {
    filters.sort = e.target.value; renderBikes();
  });

  // Show/hide filtered section
  document.getElementById('showEliminatedBtn').addEventListener('click', function() {
    showFiltered = !showFiltered;
    this.classList.toggle('active', showFiltered);
    this.textContent = showFiltered ? 'Hide Filtered' : 'Show Eliminated';
    renderBikes();
  });

  // Reset all filters — mutate existing Sets so closed-over references remain valid
  document.getElementById('resetFilters').addEventListener('click', () => {
    filters.weight            = 285;
    filters.budget            = BUDGET_MAX;
    filters.motorTypes.clear(); filters.motorTypes.add('mid-drive'); filters.motorTypes.add('hub');
    filters.regenRequired     = false;
    filters.openController    = false;
    filters.usDealers         = false;
    filters.withinWeightLimit = false;
    filters.categories.clear(); ['dirt','street','ebike'].forEach(v => filters.categories.add(v));
    filters.bikeSizes.clear();  ['pit-bike','intermediate','full-size'].forEach(v => filters.bikeSizes.add(v));
    filters.voltages.clear();
    filters.wheelCombos.clear();
    filters.throttleTypes.clear();
    filters.brakeTypes.clear();
    filters.riding.clear();
    filters.sort              = 'rank';
    filters.brand             = 'all';
    filters.model             = 'all';

    syncUIToFilters();
    // Re-activate all dynamic chips
    ['voltageFilter','wheelComboFilter','throttleTypeFilter','brakeTypeFilter'].forEach(id => {
      document.querySelectorAll(`#${id} .ms-chip`).forEach(c => c.classList.add('active'));
    });

    renderBikes();
    toast('Filters reset');
  });

  // Mobile sidebar toggle with overlay
  const _sidebar  = document.getElementById('filtersSidebar');
  const _overlay  = document.getElementById('filterOverlay');
  function _openFilters()  { _sidebar.classList.add('open');    _overlay && _overlay.classList.add('active'); }
  function _closeFilters() { _sidebar.classList.remove('open'); _overlay && _overlay.classList.remove('active'); }
  document.getElementById('mobileFilterBtn').addEventListener('click', () => {
    _sidebar.classList.contains('open') ? _closeFilters() : _openFilters();
  });
  if (_overlay) _overlay.addEventListener('click', _closeFilters);
}

// -------------------------------------------------------
// Live news ticker
// -------------------------------------------------------
async function loadTicker() {
  try {
    const r = await fetch('/api/news');
    if (!r.ok) return;
    const { news } = await r.json();
    if (!news) return;
    const el = document.querySelector('.scrolling-text');
    if (el) el.innerHTML = news;
  } catch (_) { /* keep fallback static text */ }
}

// -------------------------------------------------------
// Init
// -------------------------------------------------------
async function init() {
  try {
    // Hardening: Custom header to identify the legitimate client
    const resp = await fetch('/api/bikes', {
      headers: { 'X-Aeglos-Client': 'true' }
    });
    if (!resp.ok) throw new Error('Failed to load data');
    
    // Hardening: Unscramble the obfuscated payload
    const text = await resp.text();
    // 1. Reverse the scrambled characters
    const reversed = text.split('').reverse().join('');
    // 2. Base64 decoe to binary string
    const binaryString = atob(reversed);
    // 3. Convert binary string to Uint8Array safely for UTF-8
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    // 4. Decode as UTF-8
    const unscrambled = new TextDecoder().decode(bytes);
    const data = JSON.parse(unscrambled);
    
    ALL_BIKES = data.bikes;

    // Update "Last Updated" badge from data metadata
    const dateEl = document.getElementById('lastUpdatedDate');
    if (dateEl && data.metadata?.generated) {
      const d = new Date(data.metadata.generated + 'T00:00:00');
      dateEl.textContent = 'Last Updated ' + d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    // Collect unique values from data for dynamic chip filters
    const seenV = new Set(), seenW = new Set(), seenT = new Set(), seenB = new Set();
    ALL_BIKES.forEach(b => {
      if (b.voltage_class && !seenV.has(b.voltage_class)) { seenV.add(b.voltage_class); ALL_VOLTAGE_CLASSES.push(b.voltage_class); }
      if (b.wheel_combo   && !seenW.has(b.wheel_combo))   { seenW.add(b.wheel_combo);   ALL_WHEEL_COMBOS.push(b.wheel_combo); }
      if (b.specs.throttle_type && !seenT.has(b.specs.throttle_type)) { seenT.add(b.specs.throttle_type); ALL_THROTTLE_TYPES.push(b.specs.throttle_type); }
      if (b.specs.brake_type    && !seenB.has(b.specs.brake_type))    { seenB.add(b.specs.brake_type);    ALL_BRAKE_TYPES.push(b.specs.brake_type); }
    });
    ALL_VOLTAGE_CLASSES.sort();
    ALL_WHEEL_COMBOS.sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
    ALL_THROTTLE_TYPES.sort();
    ALL_BRAKE_TYPES.sort();

    populateBrandDropdown();
    // Load saved profile (clears incompatible old format via version check)
    loadProfile();

    // Build dynamic chip containers (respects loaded profile state)
    buildChipFilter('voltageFilter',     ALL_VOLTAGE_CLASSES, filters.voltages,      ALL_VOLTAGE_CLASSES, null,         renderBikes);
    buildChipFilter('wheelComboFilter',  ALL_WHEEL_COMBOS,    filters.wheelCombos,   ALL_WHEEL_COMBOS,    v => v + '"', renderBikes);
    buildChipFilter('throttleTypeFilter',ALL_THROTTLE_TYPES,  filters.throttleTypes, ALL_THROTTLE_TYPES,  throttleLabel, renderBikes);
    buildChipFilter('brakeTypeFilter',   ALL_BRAKE_TYPES,     filters.brakeTypes,    ALL_BRAKE_TYPES,     brakeLabel,   renderBikes);

    // Sync all other controls to loaded state
    syncUIToFilters();

    // Wire events
    initFilters();
    initAiAgent();

    // Inject compare bar into DOM
    const compareBarEl = document.createElement('div');
    compareBarEl.id = 'compareBar';
    compareBarEl.className = 'compare-bar';
    compareBarEl.innerHTML = `
      <div class="compare-bar-inner">
        <span class="compare-bar-label" id="compareBarLabel">0/3</span>
        <div class="compare-bar-slots" id="compareBarSlots"></div>
        <div class="compare-bar-actions">
          <button class="btn btn-outline btn-sm" ${_act('clearCompare')}>Clear All</button>
        </div>
      </div>`;
    document.body.appendChild(compareBarEl);

    // Card expand — delegated so it survives re-renders
    document.getElementById('bikesList').addEventListener('click', e => {
      if (e.target.closest('label.compare-label-btn')) return;
      const toggle = e.target.closest('[data-toggle-id]');
      if (toggle) toggleCard(toggle.dataset.toggleId);
    });

    // First render
    renderBikes();

    // Load live news ticker (fire-and-forget)
    loadTicker();
  } catch (err) {
    document.getElementById('bikesList').innerHTML = `
      <div class="empty-state">
        <h3>Failed to load bike data</h3>
        <p>${esc(err.message)}</p>
      </div>`;
  }
}

// -------------------------------------------------------
// Compare Models Feature
// -------------------------------------------------------
function toggleCompare(id) {
  if (compareSet.has(id)) {
    compareSet.delete(id);
  } else {
    if (compareSet.size >= 3) {
      toast('Maximum 3 bikes can be compared at once', 'error');
      const cb = document.getElementById('cmp-' + id);
      if (cb) cb.checked = false;
      return;
    }
    compareSet.add(id);
  }
  updateCompareBar();
  renderBikes();
}

function clearCompare() {
  compareSet.clear();
  updateCompareBar();
  renderBikes();
}

function updateCompareBar() {
  let bar = document.getElementById('compareBar');
  if (!bar) return;

  if (compareSet.size === 0) {
    bar.classList.remove('visible');
    return;
  }
  bar.classList.add('visible');

  const slots = document.getElementById('compareBarSlots');
  if (!slots) return;

  let html = '';
  [...compareSet].forEach(id => {
    const bike = ALL_BIKES.find(b => b.id === id);
    if (!bike) return;
    html += `<div class="compare-bar-slot">
      ${esc(bike.name)}
      <button ${_act('toggleCompare', id)} title="Remove">✕</button>
    </div>`;
  });
  // Empty slots up to 3
  for (let i = compareSet.size; i < 3; i++) {
    html += `<div class="compare-bar-slot-empty">+ Add bike</div>`;
  }
  slots.innerHTML = html;

  const lbl = document.getElementById('compareBarLabel');
  if (lbl) {
    if (compareSet.size < 2) {
      lbl.textContent = `${compareSet.size}/3 — select 1 more`;
    } else {
      lbl.textContent = `${compareSet.size}/3 comparing`;
    }
  }
}

// Rank values for compare gradient (returns CSS class names aligned with input array)
function rankForCompare(values, higherIsBetter) {
  const indexed = values.map((v, i) => ({ v, i })).filter(x => x.v != null && !isNaN(x.v));
  if (indexed.length < 2) return values.map(() => '');
  indexed.sort((a, b) => higherIsBetter ? b.v - a.v : a.v - b.v);
  const classes = new Array(values.length).fill('');
  indexed.forEach((item, pos) => {
    if (pos === 0) classes[item.i] = 'cmp-best';
    else if (pos === indexed.length - 1) classes[item.i] = 'cmp-worst';
    else classes[item.i] = 'cmp-mid';
  });
  return classes;
}

function renderCompareView() {
  const bikes = [...compareSet].map(id => ALL_BIKES.find(b => b.id === id)).filter(Boolean);
  if (bikes.length < 2) return '';

  function specRow(label, values, classes) {
    let html = `<div class="compare-row"><div class="compare-label-cell">${label}</div>`;
    values.forEach((v, i) => {
      html += `<div class="compare-value-cell ${classes ? classes[i] : ''}">${v != null ? v : '—'}</div>`;
    });
    return html + '</div>';
  }

  // Header row
  let headHtml = `<div class="compare-row"><div class="compare-label-cell"></div>`;
  bikes.forEach(bike => {
    const verdict = computeVerdict(bike);
    headHtml += `<div class="compare-bike-header">
      <div class="compare-bike-header-name">${esc(bike.name)}</div>
      <div class="compare-bike-header-brand">${esc(bike.brand)}</div>
      <div class="compare-bike-header-price">${bike.price_usd ? '$' + bike.price_usd.toLocaleString() : 'TBA'}</div>
      <div class="verdict-badge verdict-${esc(verdict.color)}" style="display:inline-block;margin-bottom:6px;"${verdict.tooltip ? ` data-tip="${esc(verdict.tooltip)}"` : ''}>${esc(verdict.text)}</div><br>
      <button class="compare-remove-btn" ${_act('toggleCompare', bike.id)}>✕ Remove</button>
    </div>`;
  });
  headHtml += '</div>';

  // Numeric specs with gradient
  const numericSpecs = [
    { label: 'Price',         key: b => b.price_usd,                    fmt: v => '$' + v.toLocaleString(),         better: false },
    { label: 'Peak Motor',    key: b => b.specs.motor_watts_peak,        fmt: v => (v/1000).toFixed(1) + 'kW',       better: true  },
    { label: 'Battery',       key: b => b.specs.battery_wh,              fmt: v => v + 'Wh',                         better: true  },
    { label: 'Voltage',       key: b => b.specs.battery_voltage,         fmt: v => v + 'V',                          better: true  },
    { label: 'Battery Ah',    key: b => b.specs.battery_ah,              fmt: v => v + 'Ah',                         better: true  },
    { label: 'Top Speed',     key: b => b.specs.top_speed_mph,           fmt: v => v + ' mph',                       better: true  },
    { label: 'Weight Limit',  key: b => b.specs.weight_limit_lbs,        fmt: v => v ? v + ' lbs' : null,            better: true  },
    { label: 'Bike Weight',   key: b => b.specs.bike_weight_lbs,         fmt: v => v + ' lbs',                       better: false },
    { label: 'Range (est.)',  key: b => b.specs.range_claimed_miles,     fmt: v => v + ' mi',                        better: true  },
    { label: 'Charge Time',   key: b => b.specs.charge_time_full_hours,  fmt: v => v + 'h',                          better: false },
  ];

  let numHtml = `<div class="compare-section-header">Performance &amp; Specs</div>`;
  numericSpecs.forEach(({ label, key, fmt, better }) => {
    const vals = bikes.map(b => key(b));
    const classes = rankForCompare(vals, better);
    const display = vals.map((v, i) => v != null ? fmt(v) : '—');
    numHtml += specRow(label, display, classes);
  });

  // Boolean specs (no gradient)
  const boolSpecs = [
    { label: 'Motor Type',     key: b => b.specs.motor_type === 'mid-drive' ? 'Mid-Drive ✓' : 'Hub Drive' },
    { label: 'Regen',          key: b => b.specs.regen_braking === true ? '✓ Yes' : b.specs.regen_braking === false ? '✗ No' : '? Unconfirmed' },
    { label: 'Open Controller',key: b => b.specs.controller_open ? '✓ Yes' : '✗ No' },
    { label: 'US Dealers',     key: b => b.specs.us_dealers ? '✓ Yes' : '✗ No' },
    { label: 'Wheel Size',     key: b => b.wheel_combo || '—' },
    { label: 'Bike Size',      key: b => bikeSizeLabel(b.bike_size) },
  ];

  let boolHtml = '';
  boolSpecs.forEach(({ label, key }) => {
    boolHtml += specRow(label, bikes.map(key), null);
  });

  // Pros
  let prosHtml = `<div class="compare-section-header">Pros</div><div class="compare-row"><div class="compare-label-cell"></div>`;
  bikes.forEach(bike => {
    prosHtml += `<div class="compare-value-cell compare-pros-cell">`;
    (bike.pros || []).forEach(p => {
      prosHtml += `<div class="compare-pro-item">+ ${renderText(p, bike)}</div>`;
    });
    prosHtml += `</div>`;
  });
  prosHtml += '</div>';

  // Cons
  let consHtml = `<div class="compare-section-header">Cons</div><div class="compare-row"><div class="compare-label-cell"></div>`;
  bikes.forEach(bike => {
    consHtml += `<div class="compare-value-cell compare-cons-cell">`;
    (bike.cons || []).forEach(c => {
      consHtml += `<div class="compare-con-item">− ${renderText(c, bike)}</div>`;
    });
    consHtml += `</div>`;
  });
  consHtml += '</div>';

  // Rider notes
  let notesHtml = `<div class="compare-section-header">${filters.weight} lb Rider Note</div><div class="compare-row"><div class="compare-label-cell"></div>`;
  bikes.forEach(bike => {
    const _compNote = buildRiderNote(bike);
    notesHtml += `<div class="compare-value-cell compare-rider-note">${_compNote || '—'}</div>`;
  });
  notesHtml += '</div>';

  return `
    <div class="compare-view">
      <div class="compare-view-header">
        <div>
          <strong style="font-size:15px;">Comparing ${bikes.length} Bikes</strong>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;font-family:var(--font-mono);">Green = better · Red = worse · Yellow = middle</div>
        </div>
        <button class="btn btn-outline btn-sm" ${_act('clearCompare')}>✕ Clear All</button>
      </div>
      <div class="compare-grid">
        ${headHtml}
        ${numHtml}
        ${boolHtml}
        ${prosHtml}
        ${consHtml}
        ${notesHtml}
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', init);

// ---------------------------------------------------------------------------
// Aeglos Intelligence Agent — Frontend Controller
// ---------------------------------------------------------------------------
let aiBubble, aiWindow, aiClose, aiInput, aiSend, aiBody;

function toggleAiAgent() {
  if (!aiWindow) return;
  aiWindow.classList.toggle('open');
  if (aiWindow.classList.contains('open')) aiInput.focus();
}

async function analyzeQuery() {
  const query = aiInput.value.trim();
  if (!query) return;

  // UI State: Reset input and show user message
  aiInput.value = '';
  const userMsg = document.createElement('div');
  userMsg.className = 'ai-chat-msg user';
  userMsg.textContent = query;
  aiBody.appendChild(userMsg);
  aiBody.scrollTop = aiBody.scrollHeight;

  // UI State: Show loading
  aiSend.disabled = true;
  aiSend.textContent = '...';
  
  try {
    const res = await fetch('/api/ai/filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    
    if (data.error) throw new Error(data.error);

    const f = data.filters;
    console.log('[AI] Applied filters:', f);

    // Apply filters to global state
    if (f.budget != null) filters.budget = f.budget;
    if (f.weight != null) filters.weight = f.weight;
    if (f.sort != null)   filters.sort   = f.sort;
    if (f.motorTypes)     filters.motorTypes = new Set(f.motorTypes);
    if (f.categories)     filters.categories = new Set(f.categories);
    if (f.bikeSizes)      filters.bikeSizes  = new Set(f.bikeSizes);
    if (f.voltages)       filters.voltages   = new Set(f.voltages);
    if (f.regenRequired != null)  filters.regenRequired  = f.regenRequired;
    if (f.openController != null) filters.openController = f.openController;
    if (f.usDealers != null)      filters.usDealers      = f.usDealers;
    if (f.withinWeightLimit != null) filters.withinWeightLimit = f.withinWeightLimit;

    // Agent response message
    const agentMsg = document.createElement('div');
    agentMsg.className = 'ai-chat-msg agent';
    agentMsg.innerHTML = `<strong>Aeglos:</strong> ${data.message || 'Filters applied.'}`;
    aiBody.appendChild(agentMsg);


    // Sync UI controls with new filter state
    syncSearchUI();
    
    // Trigger render
    renderBikes();
    toast('AI filters applied');

  } catch (err) {
    const errorMsg = document.createElement('div');
    errorMsg.className = 'ai-chat-msg agent';
    errorMsg.style.color = 'var(--red)';
    errorMsg.textContent = `Aeglos Error: ${err.message}`;
    aiBody.appendChild(errorMsg);
  } finally {
    aiSend.disabled = false;
    aiSend.textContent = 'Analyze';
    aiBody.scrollTop = aiBody.scrollHeight;
  }
}

function initAiAgent() {
  aiBubble = document.getElementById('aiChatBubble');
  aiWindow  = document.getElementById('aiChatWindow');
  aiClose   = document.getElementById('aiChatClose');
  aiInput   = document.getElementById('aiChatInput');
  aiSend    = document.getElementById('aiChatSend');
  aiBody    = document.getElementById('aiChatBody');
  if (!aiBubble) return;
  aiBubble.addEventListener('click', toggleAiAgent);
  aiClose.addEventListener('click', toggleAiAgent);
  aiSend.addEventListener('click', analyzeQuery);
  aiInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') analyzeQuery(); });
}

// Helper to update the actual search inputs/dropdowns after AI modifies state
function syncSearchUI() {
  const bEl = document.getElementById('budgetRange');
  if (bEl) bEl.value = filters.budget;
  
  const wEl = document.getElementById('riderWeight');
  if (wEl) wEl.value = filters.weight;
  
  const sEl = document.getElementById('sortSelect');
  if (sEl) sEl.value = filters.sort;


  // Sync checkboxes
  const checkable = ['regenRequired', 'openController', 'usDealers', 'withinWeightLimit'];
  checkable.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = !!filters[id];
  });

  const seBtn = document.getElementById('showEliminatedBtn');
  if (seBtn) {
    seBtn.classList.toggle('active', !!filters.showEliminated);
    seBtn.textContent = filters.showEliminated ? 'Hide Eliminated' : 'Show Eliminated';
  }

  // Sync Multi-select chips (ms-chip)
  const syncChips = (containerId, filterSet) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.ms-chip').forEach(chip => {
      const val = chip.getAttribute('data-val');
      if (filterSet.has(val)) chip.classList.add('active');
      else chip.classList.remove('active');
    });
  };

  syncChips('bikeSizeFilter',   filters.bikeSizes);
  syncChips('motorTypeFilter',  filters.motorTypes);
  syncChips('categoryFilter',   filters.categories);
  syncChips('ridingFilter',     filters.riding);
  syncChips('voltageFilter',    filters.voltages);
  syncChips('wheelComboFilter', filters.wheelCombos);

  // Update labels
  const weightLabel = document.getElementById('weightVal');
  if (weightLabel) weightLabel.textContent = filters.weight;
  const budgetLabelEl = document.getElementById('budgetVal');
  if (budgetLabelEl) budgetLabelEl.textContent = filters.budget >= 14000 ? 'No limit' : '$' + filters.budget.toLocaleString();
}
