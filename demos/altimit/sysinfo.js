/* ============================================================
   Real machine stats, captured from this Mac at build time via
   sysctl / sw_vers / system_profiler. The POST sequence in os.js
   reads these and augments them with live browser readings
   (GPU renderer, display, network). If this file is absent (app
   moved to another machine), os.js falls back to live values.
   ============================================================ */
window.ALTIMIT_SYSINFO = {
  host:      "Brent’s Mac mini",
  chip:      "Apple M4",
  model:     "Mac16,10",
  cores:     10,
  memGB:     16,
  os:        "macOS 27.0",
  build:     "26A5353q",
  gpu:       "Apple M4",
  diskTotal: "245G",
};
