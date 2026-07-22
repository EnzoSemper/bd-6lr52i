/* ============================================================
   ALTIMIT OS — engine
   Boot sequence, window manager, apps, audio, persistence.
   Classic script (no modules) so index.html runs from file://.
   ============================================================ */
(function () {
  "use strict";

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (t, cls, html) => { const n = document.createElement(t); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");

  /* ---------------- persistent state ---------------- */
  const KEY = "altimit.os.v1";
  const defaults = { user: "", registered: false, theme: "blue", readMail: {}, replies: {}, sent: [],
    newsUrl: "https://www.404media.co", bbsUrl: "https://bbs.boingboing.net" };
  let state = load();
  let bridgeUser = null;   // current account name when running against the agent
  let saveTimer = null;
  function bridged() { return !!(window.AltimitBridge && AltimitBridge.online); }
  function load() { try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return { ...defaults }; } }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    if (bridged() && bridgeUser) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { try { AltimitBridge.saveState(bridgeUser, state); } catch (e) {} }, 250);
    }
  }

  /* ---------------- theme (blue / orange / mono) ---------------- */
  function applyTheme(k) {
    const t = ALTIMIT_THEMES[k] || ALTIMIT_THEMES.blue;
    const rs = document.documentElement.style;
    rs.setProperty("--hi", t.hi);
    rs.setProperty("--hi2", t.hi2);
    rs.setProperty("--ink", t.ink);
    rs.setProperty("--wall", t.wall);
    rs.setProperty("--band", t.band);
    rs.setProperty("--shard", t.shard);
    $("#desktop").classList.toggle("hex", !!t.hex);
  }

  /* ---------------- nautilus spiral emblem (SVG) ---------------- */
  function spiralSVG(size) {
    const cx = size / 2, cy = size / 2;
    const turns = 3.15, steps = 300, b = 0.26, a0 = 0.5;
    const maxR = a0 * Math.exp(b * turns * 2 * Math.PI);
    const scale = (size * 0.46) / maxR;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * turns * 2 * Math.PI;
      const r = a0 * Math.exp(b * th) * scale;
      const x = cx + r * Math.cos(th), y = cy + r * Math.sin(th);
      d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
    }
    // radial chamber lines across the outer whorls
    let lines = "";
    for (let k = 0; k < 9; k++) {
      const th = turns * 2 * Math.PI - k * (Math.PI / 4.5);
      if (th < Math.PI) break;
      const r1 = a0 * Math.exp(b * th) * scale;
      const r2 = a0 * Math.exp(b * (th - 2 * Math.PI)) * scale;
      lines += `<line x1="${(cx + r1 * Math.cos(th)).toFixed(1)}" y1="${(cy + r1 * Math.sin(th)).toFixed(1)}"
        x2="${(cx + r2 * Math.cos(th)).toFixed(1)}" y2="${(cy + r2 * Math.sin(th)).toFixed(1)}" stroke-width="0.8"/>`;
    }
    return `<svg viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cy}" r="${size * 0.47}" stroke-width="1.2"/>
      <path d="${d}" stroke-width="1.3" stroke-linecap="round"/>${lines}</svg>`;
  }

  /* ---------------- rotating white 3D desktop icon ---------------- */
  // extrude a monochrome glyph into a spinning 3D object by stacking
  // depth layers (bright front face → darker back) inside a rotating stage.
  const ICON3D = {
    world: "◉", mail: "✉︎", news: "▤", bbs: "▣",
    data: "◈", media: "♫", settings: "⚙︎",
  };
  function make3DIcon(glyph, delay) {
    const L = 11;
    let layers = "";
    for (let i = 0; i < L; i++) {
      const t = i / (L - 1);                       // 0 front → 1 back
      const c = Math.round(255 - t * 140);
      const col = `rgb(${c},${c + 4},${Math.min(255, c + 18)})`;
      layers += `<span style="transform:translateZ(${(-i * 1.6).toFixed(2)}px);color:${col}">${glyph}</span>`;
    }
    return `<span class="i3d" style="animation-delay:${delay}s">${layers}</span>`;
  }

  /* ================= WINDOW MANAGER ================= */
  let zTop = 100;
  const wins = new Map(); // id -> {node, app}

  function focusWin(id) {
    const w = wins.get(id); if (!w) return;
    zTop += 1; w.node.style.zIndex = zTop;
    $$(".win").forEach((n) => n.classList.remove("focused"));
    w.node.classList.remove("min");
    w.node.classList.add("focused");
    renderTasks();
  }

  function openApp(appId, arg) {
    const app = APPS[appId]; if (!app) return;
    if (bridged() && typeof app.online === "function") { app.online(); return; }
    if (app.single && wins.has(appId)) { focusWin(appId); return wins.get(appId); }
    const id = app.single ? appId : appId + "_" + Date.now();

    const node = el("div", "win");
    node.style.width  = (app.w || 560) + "px";
    node.style.height = (app.h || 380) + "px";
    const openN = wins.size;
    node.style.left = (110 + openN * 28) + "px";
    node.style.top  = (60 + openN * 26) + "px";

    node.innerHTML =
      `<div class="win-head">
         <span class="win-dot"></span>
         <span class="wt">${esc(app.title)} ${app.sub ? `<small>${esc(app.sub)}</small>` : ""}</span>
         <span class="win-btns">
           <button class="wmin" title="Minimize">–</button>
           <button class="wmax" title="Maximize">▢</button>
           <button class="wclose" title="Close">✕</button>
         </span>
       </div>
       <div class="win-body"></div>
       <div class="win-resize"></div>`;

    $("#windows").appendChild(node);
    const rec = { node, app: appId, id };
    wins.set(id, rec);

    const body = $(".win-body", node);
    body.innerHTML = app.render(arg) || "";
    if (app.mount) app.mount(body, makeApi(id, node), arg);

    // interactions
    node.addEventListener("mousedown", () => focusWin(id));
    dragWin(node, $(".win-head", node));
    resizeWin(node, $(".win-resize", node));
    $(".wclose", node).addEventListener("click", (e) => { e.stopPropagation(); closeWin(id); });
    $(".wmin", node).addEventListener("click", (e) => { e.stopPropagation(); node.classList.add("min"); renderTasks(); });
    $(".wmax", node).addEventListener("click", (e) => { e.stopPropagation(); toggleMax(node); });
    $(".win-head", node).addEventListener("dblclick", () => toggleMax(node));

    SFX.open();
    focusWin(id);
    return rec;
  }

  function closeWin(id) {
    const w = wins.get(id); if (!w) return;
    if (APPS[w.app] && APPS[w.app].onClose) APPS[w.app].onClose();
    w.node.remove(); wins.delete(id); renderTasks(); SFX.close();
  }
  function toggleMax(node) {
    if (node.dataset.max) {
      node.classList.remove("max");
      Object.assign(node.style, JSON.parse(node.dataset.max));
      delete node.dataset.max;
    } else {
      node.dataset.max = JSON.stringify({ left: node.style.left, top: node.style.top, width: node.style.width, height: node.style.height });
      node.classList.add("max");
      Object.assign(node.style, { left: "0px", top: "0px", width: "100vw", height: "calc(100vh - 46px)" });
    }
  }
  function snapZone(x, y) {
    const W = window.innerWidth, H = window.innerHeight - 46, e = 14;
    if (y <= e) return [0, 0, W, H];
    if (x <= e) return [0, 0, Math.round(W / 2), H];
    if (x >= W - e) return [Math.round(W / 2), 0, Math.round(W / 2), H];
    return null;
  }
  function dragWin(node, handle) {
    handle.addEventListener("mousedown", (e) => {
      if (node.dataset.max) return;
      const sx = e.clientX, sy = e.clientY;
      const ox = parseInt(node.style.left), oy = parseInt(node.style.top);
      let cx = e.clientX, cy = e.clientY;
      const hint = $("#snaphint");
      const move = (ev) => {
        cx = ev.clientX; cy = ev.clientY;
        node.style.left = Math.max(-40, ox + ev.clientX - sx) + "px";
        node.style.top  = Math.max(0, oy + ev.clientY - sy) + "px";
        const z = snapZone(cx, cy);
        if (z) { hint.style.display = "block"; hint.style.left = z[0] + "px"; hint.style.top = z[1] + "px"; hint.style.width = z[2] + "px"; hint.style.height = z[3] + "px"; }
        else hint.style.display = "none";
      };
      const up = () => {
        document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up);
        hint.style.display = "none";
        const z = snapZone(cx, cy);
        if (z) {
          node.classList.remove("max"); delete node.dataset.max;
          node.style.left = z[0] + "px"; node.style.top = z[1] + "px";
          node.style.width = z[2] + "px"; node.style.height = z[3] + "px";
        }
      };
      document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
    });
  }
  function resizeWin(node, handle) {
    handle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      const sx = e.clientX, sy = e.clientY;
      const ow = node.offsetWidth, oh = node.offsetHeight;
      const move = (ev) => {
        node.style.width  = Math.max(300, ow + ev.clientX - sx) + "px";
        node.style.height = Math.max(180, oh + ev.clientY - sy) + "px";
      };
      const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
      document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
    });
  }

  // small per-window API passed to app.mount
  function makeApi(id, node) {
    return {
      id, node,
      body: () => $(".win-body", node),
      close: () => closeWin(id),
      setSub: (t) => { const s = $(".wt small", node); if (s) s.textContent = t; },
      toast,
    };
  }

  /* ================= TASKBAR ================= */
  function renderTasks() {
    const bar = $("#tb-tasks"); bar.innerHTML = "";
    for (const [id, w] of wins) {
      const app = APPS[w.app];
      const t = el("div", "tb-task" + (w.node.classList.contains("focused") && !w.node.classList.contains("min") ? " active" : ""));
      t.innerHTML = `<span class="ti">${app.icon}</span><span>${esc(app.title)}</span>`;
      t.addEventListener("click", () => {
        if (w.node.classList.contains("min")) { focusWin(id); }
        else if (w.node.classList.contains("focused")) { w.node.classList.add("min"); renderTasks(); }
        else focusWin(id);
      });
      bar.appendChild(t);
    }
  }

  /* ================= CLOCK ================= */
  function tickClock() {
    const d = new Date();
    $("#clk-t").textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    const days = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
    $("#clk-d").textContent = `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${days[d.getDay()]}`;
  }

  /* ================= TOAST ================= */
  function toast(title, msg) {
    const t = el("div", "toast", `<b>${esc(title)}</b><div>${esc(msg)}</div>`);
    $("#toast").appendChild(t);
    setTimeout(() => { t.style.transition = "opacity .4s"; t.style.opacity = "0"; setTimeout(() => t.remove(), 400); }, 4200);
  }

  /* ================= AUDIO (synth) ================= */
  const Audio = (function () {
    let ctx, master, nodes = [], analyser, raf, playing = false, current = null;
    const toneMap = {
      ambient: [110, 165, 220], town: [146.83, 220, 293.66], gate: [98, 130.81, 196],
      battle: [123.47, 155.56, 233.08], aura: [130.81, 196, 261.63],
    };
    function ensure() {
      if (ctx) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.0; master.connect(ctx.destination);
      analyser = ctx.createAnalyser(); analyser.fftSize = 64; master.connect(analyser);
    }
    function stop() {
      nodes.forEach((n) => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} });
      nodes = []; playing = false; if (master) master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    }
    function play(tone) {
      ensure(); if (ctx.state === "suspended") ctx.resume();
      stop(); current = tone; playing = true;
      const freqs = toneMap[tone] || toneMap.ambient;
      const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 900; filt.Q.value = 4; filt.connect(master);
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = i === 0 ? "sine" : "triangle"; o.frequency.value = f;
        const g = ctx.createGain(); g.gain.value = 0.16 / (i + 1);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08 + i * 0.05;
        const lg = ctx.createGain(); lg.gain.value = 0.06; lfo.connect(lg); lg.connect(g.gain);
        o.connect(g); g.connect(filt); o.start(); lfo.start();
        nodes.push(o, lfo);
      });
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.6);
    }
    function levels() {
      if (!analyser) return null;
      const a = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(a); return a;
    }
    return { play, stop, isPlaying: () => playing, current: () => current, levels };
  })();

  /* ---- short UI sound cues ---- */
  const SFX = (function () {
    let ctx;
    function ensure() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); }
    function blip(freq, dur, type, vol) {
      try {
        ensure();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type || "triangle"; o.frequency.value = freq; g.gain.value = vol || 0.05;
        o.connect(g); g.connect(ctx.destination); o.start();
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (dur || 0.06));
        o.stop(ctx.currentTime + (dur || 0.06));
      } catch (e) {}
    }
    return {
      open: () => blip(720, 0.08, "triangle", 0.05),
      close: () => blip(400, 0.07, "sine", 0.05),
      click: () => blip(560, 0.03, "sine", 0.035),
    };
  })();

  /* ================= APPS ================= */
  const D = ALTIMIT_DATA;
  const fmtTime = (s) => Math.floor(s / 60) + ":" + pad(s % 60);

  /* deterministic keyword → area generation (Chaos Gate) */
  function hashStr(s) {
    let h = 2166136261 >>> 0; s = (s || "").toLowerCase();
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function genArea(w1, w2, w3) {
    const h1 = hashStr(w1), h2 = hashStr(w2), h3 = hashStr(w3), G = AREA_GEN;
    const triggers = ["aida", "forbidden", "phase", "morganna", "null", "eighth", "cubia"];
    const hit = [w1, w2, w3].some((w) => triggers.includes(w.toLowerCase().trim()));
    let readIdx = ((h1 ^ h2 ^ h3) % 100 < 12) ? (4 + (h1 % 2)) : (h1 % 4);
    if (hit) readIdx = 5;
    return {
      field: G.fields[h3 % G.fields.length],
      server: G.servers[(h1 + h2 + h3) % G.servers.length],
      level: 1 + ((h1 + h2) % 150),
      element: G.elements[h2 % G.elements.length],
      weather: G.weathers[(h1 + h3) % G.weathers.length],
      monsters: [G.monsters[h2 % G.monsters.length], G.monsters[(h3 + 3) % G.monsters.length]],
      read: G.reads[readIdx], danger: readIdx >= 4,
    };
  }

  const APPS = {
    /* ---------- MAIL ---------- */
    mail: {
      title: "Mail", sub: "inbox", icon: "✉", single: true, w: 700, h: 480,
      render() {
        if (bridged()) return `<div class="mailapp" id="rmail"></div>`;
        return `<div class="mailapp">
          <div class="mailbar">
            <button class="btn" id="m-compose">✎ Compose</button>
            <div class="folders">
              <button class="fbtn sel" data-f="inbox">Inbox</button>
              <button class="fbtn" data-f="sent">Sent</button>
            </div>
          </div>
          <div class="app">
            <div class="app-list scroll" id="m-list"></div>
            <div class="app-read" id="m-read"><div class="empty-hint">Select a message.</div></div>
          </div></div>`;
      },
      mount(body, api) {
        if (bridged()) return mailReal(body, api);
        const listEl = $("#m-list", body), readEl = $("#m-read", body);
        let folder = "inbox";
        const blank = () => { readEl.innerHTML = `<div class="empty-hint">Select a message.</div>`; };

        const renderList = () => {
          if (folder === "inbox") {
            listEl.innerHTML = D.mail.map((m) => {
              const unread = m.unread && !state.readMail[m.id];
              return `<div class="li ${unread ? "unread" : ""} ${m.corrupt ? "corrupt" : ""}" data-id="${m.id}">
                <div class="l1"><span class="from">${esc(m.from)}</span><span class="date">${esc(m.date)}</span></div>
                <div class="subj">${esc(m.subject)}</div></div>`;
            }).join("");
          } else {
            const sent = state.sent || [];
            listEl.innerHTML = sent.length ? sent.map((m, idx) =>
              `<div class="li" data-sent="${idx}">
                <div class="l1"><span class="from">To: ${esc(m.to)}</span><span class="date">${esc(m.date)}</span></div>
                <div class="subj">${esc(m.subject || "(no subject)")}</div></div>`).join("")
              : `<div class="empty-hint" style="padding:26px 16px">No sent messages.</div>`;
          }
          bindList();
        };
        const bindList = () => {
          $$(".li", listEl).forEach((li) => li.addEventListener("click", () => {
            $$(".li", listEl).forEach((x) => x.classList.remove("sel")); li.classList.add("sel");
            if (li.dataset.id != null && li.dataset.id !== "") showInbox(D.mail.find((x) => x.id === li.dataset.id));
            else showSent((state.sent || [])[+li.dataset.sent]);
          }));
        };
        const showInbox = (m) => {
          state.readMail[m.id] = true; save();
          const bodyText = m.body.replace(/\{USER\}/g, state.user || "Player");
          readEl.innerHTML = `<div class="read-h"><h2>${esc(m.subject)}</h2>
              <div class="meta">FROM: ${esc(m.from)} &nbsp;·&nbsp; ${esc(m.date)}</div></div>
            <div class="read-body ${m.corrupt ? "corrupt" : ""}">${esc(bodyText)}</div>
            ${m.corrupt ? "" : `<div style="margin-top:18px"><button class="btn ghost" id="m-reply">Reply</button></div>`}`;
          const rb = $("#m-reply", readEl);
          if (rb) rb.addEventListener("click", () => compose({ to: m.from, subject: "Re: " + m.subject }));
          updateUnreadBadge();
        };
        const showSent = (m) => {
          if (!m) return;
          readEl.innerHTML = `<div class="read-h"><h2>${esc(m.subject || "(no subject)")}</h2>
              <div class="meta">TO: ${esc(m.to)} &nbsp;·&nbsp; ${esc(m.date)}</div></div>
            <div class="read-body">${esc(m.body)}</div>`;
        };
        const compose = (pre) => {
          pre = pre || {};
          readEl.innerHTML = `<div class="compose">
            <label>TO</label><input id="c-to" value="${esc(pre.to || "")}" spellcheck="false">
            <label>SUBJECT</label><input id="c-subj" value="${esc(pre.subject || "")}" spellcheck="false">
            <label>MESSAGE</label><textarea id="c-body" spellcheck="false" placeholder="Write your message..."></textarea>
            <div class="compose-acts"><button class="btn" id="c-send">SEND</button>
              <button class="btn ghost" id="c-cancel">CANCEL</button></div></div>`;
          $("#c-send", readEl).addEventListener("click", () => {
            const to = $("#c-to", readEl).value.trim(), subj = $("#c-subj", readEl).value.trim(), b = $("#c-body", readEl).value.trim();
            if (!to || !b) { api.toast("Mail", "Recipient and message are required."); return; }
            const d = new Date();
            (state.sent = state.sent || []).unshift({ to, subject: subj, body: b, date: pad(d.getMonth() + 1) + "/" + pad(d.getDate()) });
            save(); api.toast("Mail", "Message sent.");
            folder = "sent"; $$(".fbtn", body).forEach((f) => f.classList.toggle("sel", f.dataset.f === "sent"));
            renderList(); blank();
          });
          $("#c-cancel", readEl).addEventListener("click", blank);
          const t = $("#c-to", readEl); if (t && !t.value) t.focus();
        };
        $("#m-compose", body).addEventListener("click", () => compose());
        $$(".fbtn", body).forEach((f) => f.addEventListener("click", () => {
          folder = f.dataset.f; $$(".fbtn", body).forEach((x) => x.classList.remove("sel")); f.classList.add("sel");
          blank(); renderList();
        }));
        renderList();
      },
    },

    /* ---------- NEWS ---------- */
    news: {
      title: "News", sub: "The World R:2", icon: "📰", single: true, w: 680, h: 500,
      online() { AltimitBridge.launch("browser", { url: state.newsUrl }).then((r) => toast("News", r.ok ? "Opening the feed..." : "No browser available.")); },
      render() {
        const items = D.news.map((n) => `<div class="bbs-thread" data-id="${n.id}">
          <div class="bt-board"><span class="ntag ${n.tag}">${n.tag}</span></div>
          <div class="bt-title">${esc(n.title)}</div>
          <div class="bt-meta">${esc(n.date)}</div></div>`).join("");
        return `<div class="bbsapp">
          <div class="bbs-head"><span class="bbs-title">WEB NEWS</span>
            <span class="bbs-sub">The World R:2  /  News</span></div>
          <div class="bbs-main">
            <div class="bbs-threads scroll">${items}</div>
            <div class="bbs-view scroll" id="news-view"><div class="bbs-empty">Select an article.</div></div>
          </div></div>`;
      },
      mount(body) {
        const view = $("#news-view", body);
        $$(".bbs-thread", body).forEach((el) => el.addEventListener("click", () => {
          $$(".bbs-thread", body).forEach((x) => x.classList.remove("sel")); el.classList.add("sel");
          const n = D.news.find((x) => x.id === el.dataset.id);
          view.innerHTML = `<div class="bv-board"><span class="ntag ${n.tag}">${n.tag}</span></div>
            <div class="bv-title">${esc(n.title)}</div>
            <div class="news-date">${esc(n.date)}  ·  CC Corp Official</div>
            <div class="news-body">${esc(n.body)}</div>`;
        }));
      },
    },

    /* ---------- BBS ---------- */
    bbs: {
      title: "BBS", sub: "message board", icon: "💬", single: true, w: 740, h: 520,
      online() { AltimitBridge.launch("browser", { url: state.bbsUrl }).then((r) => toast("BBS", r.ok ? "Connecting to the board..." : "No browser available.")); },
      render() {
        const threads = D.bbs.map((t) => {
          const extra = (state.replies[t.id] || []).length;
          return `<div class="bbs-thread" data-id="${t.id}">
            <div class="bt-board">${esc(t.board)}</div>
            <div class="bt-title">${esc(t.title)}</div>
            <div class="bt-meta">${esc(t.author)} · ${t.replies + extra} posts</div></div>`;
        }).join("");
        return `<div class="bbsapp">
          <div class="bbs-head"><span class="bbs-title">MESSAGE BOARD</span>
            <span class="bbs-sub">The World R:2  /  BBS</span></div>
          <div class="bbs-main">
            <div class="bbs-threads scroll">${threads}</div>
            <div class="bbs-view scroll" id="bbs-view"><div class="bbs-empty">Select a thread to read.</div></div>
          </div></div>`;
      },
      mount(body, api) {
        const view = $("#bbs-view", body);
        const refreshMeta = () => $$(".bbs-thread", body).forEach((el) => {
          const t = D.bbs.find((x) => x.id === el.dataset.id);
          const extra = (state.replies[t.id] || []).length;
          $(".bt-meta", el).textContent = `${t.author} · ${t.replies + extra} posts`;
        });
        const openThread = (t) => {
          const posts = t.posts.concat((state.replies[t.id] || []).map((b) => ({ author: state.user, body: b, me: true })));
          view.innerHTML = `<div class="bv-board">${esc(t.board)}</div>
            <div class="bv-title">${esc(t.title)}</div>
            ${posts.map((p, i) => `<div class="bbs-post">
              <div class="bp-head"><span class="bp-num">&gt;&gt;${i + 1}</span>
                <span class="bp-author ${p.me ? "me" : ""}">${esc(p.author)}</span></div>
              <div class="bp-body">${esc(p.body)}</div></div>`).join("")}
            <div class="bbs-reply">
              <input type="text" id="bbs-in" placeholder="Reply as ${esc(state.user)}..." spellcheck="false">
              <button class="btn" id="bbs-post">POST</button></div>`;
          const inp = $("#bbs-in", view), btn = $("#bbs-post", view);
          const send = () => {
            const v = inp.value.trim(); if (!v) return;
            (state.replies[t.id] = state.replies[t.id] || []).push(v); save();
            openThread(t); refreshMeta(); api.toast("BBS", "Reply posted.");
            view.scrollTop = view.scrollHeight;
          };
          btn.addEventListener("click", send);
          inp.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
        };
        $$(".bbs-thread", body).forEach((el) => el.addEventListener("click", () => {
          $$(".bbs-thread", body).forEach((x) => x.classList.remove("sel")); el.classList.add("sel");
          openThread(D.bbs.find((x) => x.id === el.dataset.id));
        }));
      },
    },

    /* ---------- DATA / saves ---------- */
    data: {
      title: "Data", sub: "save management", icon: "💾", single: true, w: 640, h: 470,
      render() {
        if (bridged()) return `<div class="fileapp">
          <div class="fb-bar"><button class="fb-btn" id="fb-up">↑ Up</button>
            <button class="fb-btn" id="fb-home">⌂ Home</button>
            <span class="fb-path" id="fb-path">/</span>
            <button class="fb-btn" id="fb-openfm">Open in Files</button></div>
          <div class="fb-list scroll" id="fb-list"></div></div>`;
        const rows = D.saves.map((s) => `<div class="save ${s.empty ? "empty" : ""}">
          <div class="badge">${s.empty ? "—" : "◆"}</div>
          <div class="info"><b>${esc(s.empty ? s.character : (state.user || s.character))}</b>
            <div class="sub">${s.empty ? "No data" : `${esc(s.klass)} · Lv.${s.level} · ${esc(s.area)} · ${s.playtime} · ${s.gp.toLocaleString()} GP`}</div></div>
          <div class="acts">${s.empty ? `<button class="btn ghost" disabled>LOAD</button>`
            : `<button class="btn load" data-slot="${s.slot}">LOAD</button><button class="btn ghost save" data-slot="${s.slot}">SAVE</button>`}</div>
        </div>`).join("");
        return `<div class="saves">${rows}
          <div style="color:var(--ink-soft);font-size:12px;text-align:center;margin-top:6px">
            System settings are stored locally on this terminal.</div></div>`;
      },
      mount(body, api) {
        if (bridged()) return fileBrowser(body, api);
        $$(".btn.load", body).forEach((b) => b.addEventListener("click", () => api.toast("Data", `Slot ${b.dataset.slot} loaded. Connecting character...`)));
        $$(".btn.save", body).forEach((b) => b.addEventListener("click", () => { save(); api.toast("Data", `Slot ${b.dataset.slot} saved.`); }));
      },
    },

    /* ---------- MEDIA player ---------- */
    media: {
      title: "Media Player", sub: "", icon: "♫", single: true, w: 440, h: 480,
      render() {
        if (bridged()) return `<div class="player">
          <div class="now">
            <div class="tt" id="np-t">— Not Playing —</div>
            <div class="ta" id="np-a">Altimit Media</div>
            <audio id="np-audio" controls style="width:92%;margin-top:12px"></audio>
          </div>
          <div class="mp-bar"><button class="fb-btn" id="mp-folder">📂 Open media folder</button></div>
          <div class="playlist scroll" id="mp-list"></div></div>`;
        const list = D.media.map((t) => `<div class="trk" data-id="${t.id}" data-tone="${t.tone}">
          <span>${esc(t.title)} <span style="color:var(--ink-soft)">· ${esc(t.artist)}</span></span>
          <span class="dur">${fmtTime(t.seconds)}</span></div>`).join("");
        return `<div class="player">
          <div class="now">
            <div class="viz" id="viz">${Array.from({length:16}).map(()=>"<i></i>").join("")}</div>
            <div class="tt" id="np-t">— Not Playing —</div>
            <div class="ta" id="np-a">Altimit Media</div>
            <div class="controls">
              <button id="prev">⏮</button>
              <button class="play" id="play">▶</button>
              <button id="next">⏭</button>
            </div>
          </div>
          <div class="playlist scroll">${list}</div></div>`;
      },
      mount(body, api) {
        if (bridged()) return mediaReal(body, api);
        const tracks = $$(".trk", body);
        let idx = -1, vizRaf;
        const bars = $$("#viz i", body);
        const setNP = (t) => { $("#np-t", body).textContent = t ? t.title : "— Not Playing —"; $("#np-a", body).textContent = t ? t.artist : "Altimit Media"; };
        const paint = (i) => tracks.forEach((tr, k) => tr.classList.toggle("playing", k === i));
        const animate = () => {
          const lv = Audio.levels();
          bars.forEach((b, i) => {
            const v = lv ? lv[i % lv.length] / 255 : (Audio.isPlaying() ? Math.random() : 0.05);
            b.style.height = (8 + v * 46) + "px";
          });
          vizRaf = requestAnimationFrame(animate);
        };
        animate();
        const playIdx = (i) => {
          idx = (i + tracks.length) % tracks.length;
          const t = D.media[idx];
          Audio.play(tracks[idx].dataset.tone);
          setNP(t); paint(idx); $("#play", body).textContent = "❚❚";
          api.setSub(t.title);
        };
        tracks.forEach((tr, i) => tr.addEventListener("click", () => playIdx(i)));
        $("#play", body).addEventListener("click", () => {
          if (Audio.isPlaying()) { Audio.stop(); $("#play", body).textContent = "▶"; paint(-1); }
          else playIdx(idx < 0 ? 0 : idx);
        });
        $("#next", body).addEventListener("click", () => playIdx(idx + 1));
        $("#prev", body).addEventListener("click", () => playIdx(idx - 1));
        // stop audio + viz loop when window closes
        APPS.media.onClose = () => { Audio.stop(); cancelAnimationFrame(vizRaf); APPS.media.onClose = null; };
      },
    },

    /* ---------- THE WORLD R:2 — Chaos Gate ---------- */
    world: {
      title: "The World R:2", sub: "Chaos Gate", icon: "◉", single: true, w: 560, h: 560,
      render() {
        return `<div class="world">
          <div class="r2">R : 2</div>
          <h1>CHAOS <b>GATE</b></h1>
          <div class="gate" id="gate">◉</div>
          <div class="status" id="wstatus">Enter three keywords to warp.</div>
          <div class="kw">
            <input id="kw1" placeholder="Word 1" spellcheck="false" maxlength="14">
            <input id="kw2" placeholder="Word 2" spellcheck="false" maxlength="14">
            <input id="kw3" placeholder="Word 3" spellcheck="false" maxlength="14">
          </div>
          <button class="btn" id="warp">WARP</button>
          <div class="area" id="area"></div>
        </div>`;
      },
      mount(body, api) {
        const gate = $("#gate", body), st = $("#wstatus", body), btn = $("#warp", body), area = $("#area", body);
        const steps = ["Authenticating with CC-NET...", "Opening Chaos Gate...", "Resolving keywords...", "Generating field..."];
        const warp = () => {
          const w1 = $("#kw1", body).value.trim(), w2 = $("#kw2", body).value.trim(), w3 = $("#kw3", body).value.trim();
          if (!(w1 && w2 && w3)) { st.textContent = "Three keywords are required."; return; }
          btn.disabled = true; area.innerHTML = ""; gate.classList.add("spin");
          let i = 0;
          const run = () => {
            if (i < steps.length) { st.textContent = steps[i++]; setTimeout(run, 620); return; }
            gate.classList.remove("spin");
            const a = genArea(w1, w2, w3);
            st.innerHTML = `Warped to keyword: <span style="color:#fff">"${esc([w1, w2, w3].join(" "))}"</span>`;
            area.innerHTML = `<div class="area-card ${a.danger ? "danger" : ""}">
              <div class="area-name">${esc(a.field)}</div>
              <div class="area-grid">
                <div><label>SERVER</label><b>${esc(a.server)}</b></div>
                <div><label>LEVEL</label><b>${a.level}</b></div>
                <div><label>ELEMENT</label><b>${esc(a.element)}</b></div>
                <div><label>WEATHER</label><b>${esc(a.weather)}</b></div>
              </div>
              <div class="area-mon"><label>DETECTED</label><span>${esc(a.monsters.join("  ·  "))}</span></div>
              <div class="area-read ${a.danger ? "warn" : ""}">${esc(a.read)}</div>
              <button class="btn ${a.danger ? "" : "ghost"}" id="enter">ENTER FIELD</button>
            </div>`;
            if (a.danger) api.toast("The World", "This area feels wrong. Recommend immediate logout.");
            $("#enter", body).addEventListener("click", () => {
              api.toast("The World", a.danger
                ? "A wave of black spreads across the field. You cannot log out."
                : `Entered ${a.field}. Good hunting, ${state.user}.`);
            });
            btn.disabled = false;
          };
          run();
        };
        btn.addEventListener("click", warp);
        ["#kw1", "#kw2", "#kw3"].forEach((s) => $(s, body).addEventListener("keydown", (e) => { if (e.key === "Enter") warp(); }));
      },
    },

    /* ---------- SETTINGS ---------- */
    settings: {
      title: "Config", sub: "system", icon: "⚙", single: true, w: 560, h: 440,
      render() {
        const themes = Object.entries(ALTIMIT_THEMES).map(([k, t]) =>
          `<div class="theme-opt ${state.theme === k ? "sel" : ""}" data-theme="${k}">
             <div class="sw" style="background-image:${t.band},${t.wall}"></div>
             <div class="nm">${esc(t.name)}</div></div>`).join("");
        return `<div class="settings">
          ${bridged()
            ? `<div class="set-row"><label>Account</label><div class="set-net">${esc(state.user)}</div></div>`
            : `<div class="set-row"><label>Account name</label><input type="text" id="s-user" value="${esc(state.user)}" maxlength="16"></div>`}
          <div class="set-row"><label>Desktop theme</label><div class="theme-opts">${themes}</div></div>
          ${bridged() ? `
          <div class="set-row"><label>News source (opens browser)</label><input type="text" id="s-news" value="${esc(state.newsUrl)}" spellcheck="false"></div>
          <div class="set-row"><label>BBS (opens browser)</label><input type="text" id="s-bbs" value="${esc(state.bbsUrl)}" spellcheck="false"></div>
          <div class="set-row"><label>Network</label><div class="set-net" id="s-net">checking…</div></div>` : ""}
          <div class="set-row" style="color:var(--ink-soft);font-size:12px;border-top:1px solid var(--line);padding-top:16px">
            ${esc(D.system.version)}<br>${esc(D.system.build)}<br>${esc(D.system.copyright)}
          </div>
          <div><button class="btn ghost" id="s-reset">Reset terminal</button></div>
        </div>`;
      },
      mount(body, api) {
        const su = $("#s-user", body);
        if (su) su.addEventListener("input", (e) => { state.user = e.target.value || "Player"; save(); $("#tb-user").textContent = state.user; });
        const sn = $("#s-news", body), sb = $("#s-bbs", body);
        if (sn) sn.addEventListener("input", (e) => { state.newsUrl = e.target.value.trim(); save(); });
        if (sb) sb.addEventListener("input", (e) => { state.bbsUrl = e.target.value.trim(); save(); });
        const net = $("#s-net", body);
        if (net && bridged()) AltimitBridge.net().then((n) => {
          net.innerHTML = n.online
            ? `<span style="color:var(--hi2)">● online</span> · ${esc((n.ifaces && n.ifaces.primary_ip) || "")} · ${esc(n.host || "")}`
            : `<span style="color:#c0553a">○ offline</span> · ${esc(n.host || "")}`;
        });
        $$(".theme-opt", body).forEach((o) => o.addEventListener("click", () => {
          state.theme = o.dataset.theme; applyTheme(state.theme); save();
          $$(".theme-opt", body).forEach((x) => x.classList.remove("sel")); o.classList.add("sel");
        }));
        $("#s-reset", body).addEventListener("click", () => {
          localStorage.removeItem(KEY); state = { ...defaults };
          applyTheme(state.theme); $("#tb-user").textContent = state.user;
          api.toast("Config", "Terminal reset to defaults.");
          api.close();
        });
      },
    },

    /* ---------- ABOUT ---------- */
    about: {
      title: "About", sub: "", icon: "ⓘ", single: true, w: 460, h: 320,
      render() {
        return `<div style="padding:30px;text-align:center;color:var(--ink)">
          <div style="font-weight:200;letter-spacing:.4em;font-size:26px">ALTIMIT<b style="color:var(--hi2);font-weight:700"> OS</b></div>
          <div style="color:var(--ink-soft);margin:8px 0 20px;font-family:var(--mono);font-size:12px">${esc(D.system.version)}</div>
          <p style="line-height:1.7;font-size:13px;max-width:340px;margin:0 auto;color:var(--ink-soft)">
            A fan recreation of the Altimit OS desktop from <i>.hack//G.U.</i>, built as a self-contained
            web application. All content is original homage; no game assets are bundled.</p>
          <div style="margin-top:20px;font-size:11px;color:var(--ink-soft)">${esc(D.system.copyright)}</div>
        </div>`;
      },
    },
  };

  /* ---------- unread badge on Mail task/icon ---------- */
  function unreadCount() { return D.mail.filter((m) => m.unread && !state.readMail[m.id]).length; }
  function updateUnreadBadge() {
    const n = unreadCount();
    $("#mail-badge").textContent = n > 0 ? n : "";
    $("#mail-badge").style.display = n > 0 ? "grid" : "none";
  }

  /* ================= DESKTOP ICONS + START MENU ================= */
  const DESK_ICONS = ["world", "mail", "news", "bbs", "data", "media", "settings"];
  function buildDesktop() {
    const wrap = $("#desk-icons"); wrap.innerHTML = "";
    DESK_ICONS.forEach((id, idx) => {
      const a = APPS[id];
      const ic = el("div", "desk-icon");
      const badge = id === "mail" ? `<span id="mail-badge" style="position:absolute;transform:translate(16px,-16px);width:18px;height:18px;background:#ff6b5c;color:#fff;border-radius:50%;font-size:11px;display:grid;place-items:center;z-index:5"></span>` : "";
      ic.innerHTML = `<div class="gi">${make3DIcon(ICON3D[id] || a.icon, (idx * -0.8).toFixed(1))}${badge}</div><span>${esc(a.title)}</span>`;
      ic.addEventListener("dblclick", () => openApp(id));
      ic.addEventListener("click", () => { $$(".desk-icon", wrap).forEach((x)=>x.classList.remove("sel")); ic.classList.add("sel"); });
      wrap.appendChild(ic);
    });
    updateUnreadBadge();
  }

  function buildStartMenu() {
    const m = $("#startmenu");
    const items = DESK_ICONS.concat(["about"]).map((id) => {
      const a = APPS[id];
      return `<div class="sm-item" data-app="${id}"><span class="si">${a.icon}</span>${esc(a.title)}</div>`;
    }).join("");
    m.innerHTML = `<div class="sm-head">ALTIMIT · ${esc(state.user)}</div>${items}
      <div class="sm-sep"></div>
      <div class="sm-item danger" data-act="logoff"><span class="si">⏻</span>Log Off</div>`;
    $$(".sm-item", m).forEach((it) => it.addEventListener("click", () => {
      m.classList.remove("open");
      if (it.dataset.app) openApp(it.dataset.app);
      else if (it.dataset.act === "logoff") logoff();
    }));
  }

  /* ---- desktop right-click context menu ---- */
  function showCtxMenu(x, y) {
    const m = $("#ctxmenu");
    m.innerHTML = DESK_ICONS.map((id) =>
      `<div class="cx-item" data-app="${id}"><span class="ci">${APPS[id].icon}</span>${esc(APPS[id].title)}</div>`).join("") +
      `<div class="cx-sep"></div>
       <div class="cx-item" data-act="theme"><span class="ci">◑</span>Next theme</div>
       <div class="cx-item" data-act="about"><span class="ci">ⓘ</span>About Altimit OS</div>`;
    m.classList.add("open"); m.style.display = "block";
    m.style.left = Math.min(x, window.innerWidth - m.offsetWidth - 6) + "px";
    m.style.top = Math.min(y, window.innerHeight - m.offsetHeight - 6) + "px";
    $$(".cx-item", m).forEach((it) => it.addEventListener("click", () => {
      hideCtx();
      if (it.dataset.app) openApp(it.dataset.app);
      else if (it.dataset.act === "theme") cycleTheme();
      else if (it.dataset.act === "about") openApp("about");
    }));
  }
  function hideCtx() { const m = $("#ctxmenu"); m.classList.remove("open"); m.style.display = "none"; }
  function cycleTheme() {
    const keys = Object.keys(ALTIMIT_THEMES);
    state.theme = keys[(keys.indexOf(state.theme) + 1) % keys.length];
    applyTheme(state.theme); save();
    toast("Config", "Theme: " + ALTIMIT_THEMES[state.theme].name);
  }

  /* ---- clock → calendar popup ---- */
  function toggleCal() {
    const c = $("#calpop");
    if (c.classList.contains("open")) { c.classList.remove("open"); return; }
    const d = new Date(), y = d.getFullYear(), mo = d.getMonth();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const first = new Date(y, mo, 1).getDay(), days = new Date(y, mo + 1, 0).getDate();
    let cells = ["S", "M", "T", "W", "T", "F", "S"].map((w) => `<div class="wd">${w}</div>`).join("");
    for (let i = 0; i < first; i++) cells += `<div class="dy mute">0</div>`;
    for (let dd = 1; dd <= days; dd++) cells += `<div class="dy ${dd === d.getDate() ? "today" : ""}">${dd}</div>`;
    c.innerHTML = `<div class="cal-time">${pad(d.getHours())}:${pad(d.getMinutes())}</div>
      <div class="cal-date">${months[mo]} ${y}</div><div class="cal-grid">${cells}</div>`;
    c.classList.add("open");
  }

  function logoff() {
    for (const id of [...wins.keys()]) closeWin(id);
    Audio.stop(); save(); stopHUD();
    $("#desktop").classList.remove("ready");
    if (bridged()) { bridgeUser = null; setTimeout(showUserSelect, 250); return; }
    const boot = $("#boot"); boot.classList.remove("done");
    $("#boot-log").innerHTML = ""; $("#boot-bar").style.width = "0";
    setTimeout(() => { installBootSkip(); runBoot(); }, 700);
  }

  /* ================= POST / BIOS ================= */
  // live GPU renderer string via WebGL, when the browser exposes it
  function liveGPU() {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      const dbg = gl && gl.getExtension("WEBGL_debug_renderer_info");
      return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : null;
    } catch (e) { return null; }
  }
  // strip ANGLE/Metal wrapper noise from a live GPU string
  function cleanGPU(g) {
    if (!g) return g;
    let m = g.match(/Metal Renderer:\s*([^,()]+)/i); if (m) return m[1].trim();
    m = g.match(/Apple\s+M\d+\s*\w*/i); if (m) return m[0].trim();
    return g.replace(/^ANGLE\s*\(/i, "").replace(/\)\s*$/, "").trim();
  }
  // compose POST lines from baked real machine stats + live browser readings,
  // falling back to D.postLog if neither is available.
  function sysLines() {
    const si = window.ALTIMIT_SYSINFO;
    if (!si && !navigator.hardwareConcurrency) return D.postLog;
    si || (window.ALTIMIT_SYSINFO = {});
    const s = window.ALTIMIT_SYSINFO;
    const cores = s.cores || navigator.hardwareConcurrency || 8;
    const memGB = s.memGB || navigator.deviceMemory || 16;
    const chip  = s.chip || (navigator.userAgentData && navigator.userAgentData.platform) || "Unknown Processor";
    const gpu   = s.gpu || cleanGPU(liveGPU()) || "Integrated Graphics";
    const os    = s.os ? (s.os + (s.build ? "  (" + s.build + ")" : "")) : (navigator.platform || "Unknown OS");
    const dpr   = window.devicePixelRatio || 1;
    const res   = `${Math.round(screen.width * dpr)} x ${Math.round(screen.height * dpr)}`;
    const net   = (navigator.connection && navigator.connection.effectiveType) ? navigator.connection.effectiveType.toUpperCase() : "LINK";
    const host  = s.host || "Local Terminal";
    return [
      "CC-CORP FIRMWARE  v4.02",
      "CyberConnect System BIOS",
      "(C) CC Corporation",
      "",
      `Host           : ${host}`,
      `Main Processor : ${chip}  (${cores} cores)`,
      `Graphics       : ${gpu}`,
      `Memory Testing : ${memGB * 1024}M ...... OK`,
      `Display        : ${res}${dpr > 1 ? "  @" + dpr + "x" : ""}`,
      "",
      `Detecting CC-NET adapter [${net}] ...... found`,
      `Detecting primary storage [ALTIMIT ${s.diskTotal || ""}] ...... found`,
      "Detecting neural interface ...... OK",
      "",
      `System         : ${os}`,
      "Verifying boot signature ...... OK",
      "Starting Altimit Multi OS",
    ];
  }
  /* boot skip: press any key / click to fast-forward to the desktop */
  let bootDoneFlag = false, bootSkipped = false, bootSkipHandler = null;
  function installBootSkip() {
    bootDoneFlag = false; bootSkipped = false;
    $("#skip-hint").classList.add("show");
    bootSkipHandler = () => skipBoot();
    document.addEventListener("keydown", bootSkipHandler);
    document.addEventListener("click", bootSkipHandler);
  }
  function removeBootSkip() {
    $("#skip-hint").classList.remove("show");
    if (bootSkipHandler) {
      document.removeEventListener("keydown", bootSkipHandler);
      document.removeEventListener("click", bootSkipHandler);
      bootSkipHandler = null;
    }
  }
  function skipBoot() {
    if (bootDoneFlag) return;
    bootSkipped = true;
    $("#post").classList.add("done"); $("#boot").classList.add("done");
    afterBoot();
  }

  function runPost(done) {
    installBootSkip();
    const log = $("#post-log"); log.textContent = "";
    const lines = sysLines(); let i = 0;
    const step = () => {
      if (bootSkipped) return;
      if (i < lines.length) {
        const raw = lines[i];
        log.innerHTML += (raw.includes("OK") || raw.includes("found") ? `<span class="hl">${esc(raw)}</span>` : esc(raw)) + "\n";
        i++; setTimeout(step, raw === "" ? 170 : 300 + Math.random() * 190);
      } else {
        setTimeout(() => { $("#post").classList.add("done"); setTimeout(done, 620); }, 1600);
      }
    };
    step();
  }

  /* ================= BOOT ================= */
  function runBoot() {
    // real initialization scroll from the agent when available, else scripted
    if (bridged()) {
      AltimitBridge.boot()
        .then((d) => crawlBoot(d && d.lines && d.lines.length ? d.lines : D.bootLog))
        .catch(() => crawlBoot(D.bootLog));
    } else crawlBoot(D.bootLog);
  }
  function crawlBoot(lines) {
    const log = $("#boot-log"), bar = $("#boot-bar"); let i = 0;
    const per = lines.length > 16 ? 150 : 420;   // real scrolls are longer -> quicker
    const step = () => {
      if (bootSkipped) return;
      if (i < lines.length) {
        const raw = lines[i];
        let cls = "";
        if (/\bOK\b|verified|established|\bactive\b|welcome|reached/i.test(raw)) cls = "ok";
        if (/WARN|fail|error|denied/i.test(raw)) cls = "warn";
        log.appendChild(el("div", cls, esc(raw)));
        log.scrollTop = log.scrollHeight;
        bar.style.width = Math.round(((i + 1) / lines.length) * 100) + "%";
        i++; setTimeout(step, per + Math.random() * (per * 0.5));
      } else {
        setTimeout(afterBoot, lines.length > 16 ? 900 : 1500);
      }
    };
    step();
  }
  function afterBoot() {
    if (bootDoneFlag) return;
    bootDoneFlag = true; removeBootSkip();
    $("#boot").classList.add("done");
    if (bridged()) { showUserSelect(); return; }
    if (!state.registered) setTimeout(showLogin, 300);
    else revealDesktop(false);
  }

  /* ---- multi-user Select screen (agent-backed) ---- */
  function showUserSelect() {
    stopHUD();
    let host = $("#userselect");
    if (!host) { host = el("div"); host.id = "userselect"; document.body.appendChild(host); }
    AltimitBridge.users().then((users) => {
      const rows = (users && users.length)
        ? users.map((u) => `<div class="us-row" data-user="${esc(u.name)}">
             <span class="us-badge">${esc((u.name[0] || "?").toUpperCase())}</span>
             <span class="us-name">${esc(u.name)}</span>
             <button class="us-del" data-del="${esc(u.name)}" title="Remove">✕</button></div>`).join("")
        : `<div class="us-empty">No accounts yet. Create one to enter The World.</div>`;
      host.innerHTML = `<div class="login-card">
          <span class="spiral spiral-lg">${spiralSVG(88)}</span>
          <div class="login-brand"><b>[</b> ALTIMIT <b>]</b></div>
          <div class="login-sub">SELECT USER</div>
          <div class="us-list">${rows}</div>
          <button class="btn" id="us-new">+ NEW USER</button>
        </div>`;
      host.classList.add("show");
      $$(".us-row", host).forEach((r) => r.addEventListener("click", (e) => {
        if (e.target.closest(".us-del")) return; selectUser(r.dataset.user);
      }));
      $$(".us-del", host).forEach((b) => b.addEventListener("click", (e) => {
        e.stopPropagation(); AltimitBridge.removeUser(b.dataset.del).then(showUserSelect);
      }));
      $("#us-new", host).addEventListener("click", () => { host.classList.remove("show"); showLogin(); });
    });
  }
  function selectUser(name) {
    bridgeUser = name;
    AltimitBridge.getState(name).then((st) => {
      state = Object.assign({}, defaults, st || {}, { user: name, registered: true });
      applyTheme(state.theme);
      const host = $("#userselect"); if (host) host.classList.remove("show");
      $("#tb-user").textContent = state.user;
      buildDesktop();
      revealDesktop(false);
    });
  }

  function showLogin() {
    $("#login-spiral").innerHTML = spiralSVG(88);
    const lg = $("#login"), inp = $("#login-input"), go = $("#login-go"), err = $("#login-err");
    inp.value = ""; lg.classList.add("show");
    setTimeout(() => inp.focus(), 60);
    const submit = async () => {
      const v = inp.value.trim().replace(/\s+/g, " ");
      if (v.length < 2) { err.textContent = "Username must be at least 2 characters."; return; }
      if (bridged()) {
        try { await AltimitBridge.addUser(v); } catch (e) {}
        bridgeUser = v;
        state = Object.assign({}, defaults, { user: v, registered: true, theme: state.theme });
        applyTheme(state.theme); buildDesktop();
        try { await AltimitBridge.saveState(v, state); } catch (e) {}
      } else {
        state.user = v; state.registered = true; save();
      }
      $("#tb-user").textContent = state.user;
      lg.classList.remove("show");
      revealDesktop(true);
    };
    go.onclick = submit;
    inp.onkeydown = (e) => { err.textContent = ""; if (e.key === "Enter") submit(); };
  }
  function revealDesktop(isNew) {
    $("#desktop").classList.add("ready");
    $("#tb-user").textContent = state.user;
    buildStartMenu();
    startHUD();
    setTimeout(() => {
      if (isNew) toast("Altimit OS", `Account created. Welcome to The World, ${state.user}.`);
      const n = unreadCount();
      if (n > 0) toast("Mail", `You have ${n} unread message${n > 1 ? "s" : ""}.`);
    }, 1100);
  }

  /* ================= REAL (agent-backed) APP ENGINES ================= */
  function humanSize(n) {
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(0) + " KB";
    if (n < 1073741824) return (n / 1048576).toFixed(1) + " MB";
    return (n / 1073741824).toFixed(1) + " GB";
  }
  const MEDIA_RE = /\.(mp3|ogg|wav|flac|m4a|mp4|webm|mkv|mov)$/i;

  // Data -> real Linux filesystem browser
  function fileBrowser(body, api) {
    let cur = "/";
    const listEl = $("#fb-list", body), pathEl = $("#fb-path", body);
    api.setSub("file system");
    const load = (path) => {
      AltimitBridge.fs(path).then((d) => {
        cur = d.path; pathEl.textContent = d.path;
        if (d.error) { listEl.innerHTML = `<div class="fb-empty">${esc(d.error)}</div>`; return; }
        listEl.innerHTML = d.entries.map((e) => `<div class="fb-row" data-name="${esc(e.name)}" data-type="${e.type}">
          <span class="fb-ico">${e.type === "dir" ? "📁" : "📄"}</span>
          <span class="fb-name">${esc(e.name)}</span>
          <span class="fb-size">${e.type === "dir" ? "" : humanSize(e.size)}</span></div>`).join("") || `<div class="fb-empty">(empty)</div>`;
        pathEl.dataset.parent = d.parent || "/";
        $$(".fb-row", listEl).forEach((r) => r.addEventListener("dblclick", () => {
          const full = (cur.endsWith("/") ? cur : cur + "/") + r.dataset.name;
          if (r.dataset.type === "dir") load(full);
          else AltimitBridge.launch(MEDIA_RE.test(r.dataset.name) ? "media" : "files", { path: full })
            .then((res) => api.toast("Data", res.ok ? "Opening " + r.dataset.name : "No handler for this file"));
        }));
      }).catch(() => { listEl.innerHTML = `<div class="fb-empty">Cannot read filesystem.</div>`; });
    };
    $("#fb-up", body).addEventListener("click", () => load(pathEl.dataset.parent || "/"));
    $("#fb-home", body).addEventListener("click", () => load("~"));
    $("#fb-openfm", body).addEventListener("click", () => AltimitBridge.launch("files", { path: cur }).then((r) => api.toast("Data", r.ok ? "Opened file manager" : "No file manager")));
    load("/");
  }

  // Media Player -> real media served by the agent (HTTP Range)
  function mediaReal(body, api) {
    const listEl = $("#mp-list", body), audio = $("#np-audio", body);
    const npt = $("#np-t", body), npa = $("#np-a", body);
    api.setSub("media");
    AltimitBridge.media().then((d) => {
      if (!d.files || !d.files.length) {
        listEl.innerHTML = `<div class="fb-empty" style="color:var(--ink-soft)">No media found in<br><code>${esc(d.dir)}</code><br>Drop audio/video files there.</div>`;
        return;
      }
      listEl.innerHTML = d.files.map((f, i) => `<div class="trk" data-url="${esc(f.url)}" data-name="${esc(f.name)}">
        <span>${esc(f.name)}</span><span class="dur">${humanSize(f.size)}</span></div>`).join("");
      $$(".trk", listEl).forEach((tr) => tr.addEventListener("click", () => {
        $$(".trk", listEl).forEach((x) => x.classList.remove("playing")); tr.classList.add("playing");
        audio.src = AltimitBridge.mediaURL(tr.dataset.url); audio.play().catch(() => {});
        npt.textContent = tr.dataset.name; npa.textContent = "Now Playing"; api.setSub(tr.dataset.name);
      }));
    });
    $("#mp-folder", body).addEventListener("click", () => AltimitBridge.media().then((d) => AltimitBridge.launch("files", { path: d.dir })));
    APPS.media.onClose = () => { try { audio.pause(); } catch (e) {} APPS.media.onClose = null; };
  }

  // Mail -> real IMAP receive + SMTP send via the agent
  function mailReal(body, api) {
    const account = state.user || "default";
    const root = $("#rmail", body);
    let cfg = {}, password = null;
    const field = (id, label, val, type) =>
      `<label>${label}</label><input id="${id}" type="${type || "text"}" value="${esc(val || "")}" spellcheck="false">`;
    const settings = () => {
      root.innerHTML = `<div class="rmail-form">
        <div class="rmail-h">Mail Account</div>
        ${field("mf-user", "Email address", cfg.user)}
        ${field("mf-host", "IMAP server", cfg.host)}
        ${field("mf-port", "IMAP port", cfg.port || 993)}
        <label class="rmail-ck"><input type="checkbox" id="mf-ssl" ${cfg.ssl === false ? "" : "checked"}> IMAP SSL</label>
        ${field("mf-shost", "SMTP server", cfg.smtp_host)}
        ${field("mf-sport", "SMTP port", cfg.smtp_port || 587)}
        <div class="rmail-acts"><button class="btn" id="mf-save">SAVE</button>
          ${cfg.host ? `<button class="btn ghost" id="mf-back">CANCEL</button>` : ""}</div>
        <div class="rmail-note">Password is asked when connecting and never stored.</div></div>`;
      $("#mf-save", root).addEventListener("click", () => {
        const c = { account, user: $("#mf-user", root).value.trim(), host: $("#mf-host", root).value.trim(),
          port: +$("#mf-port", root).value || 993, ssl: $("#mf-ssl", root).checked,
          smtp_host: $("#mf-shost", root).value.trim(), smtp_port: +$("#mf-sport", root).value || 587, from: $("#mf-user", root).value.trim() };
        AltimitBridge.mailConfig(c).then((r) => { cfg = r.config; api.toast("Mail", "Account saved."); connect(); });
      });
      const back = $("#mf-back", root); if (back) back.addEventListener("click", connect);
    };
    const doConnect = (pw) => {
      password = pw;
      AltimitBridge.mailList(account, pw, "INBOX", 25).then((r) => {
        if (r.error || !r.ok) { connectForm("Login failed: " + (r.error || "check settings")); return; }
        inbox(r.messages);
      }).catch(() => connectForm("Connection error."));
    };
    const connect = (auto) => {
      if (auto && cfg.has_password) {
        root.innerHTML = `<div class="rmail-form"><div class="rmail-h">Connecting…</div>
          <div class="rmail-sub">${esc(cfg.user || "")} · ${esc(cfg.host || "")}</div></div>`;
        return doConnect("");   // agent uses the stored password
      }
      connectForm("");
    };
    const connectForm = (msg) => {
      root.innerHTML = `<div class="rmail-form">
        <div class="rmail-h">Connect</div>
        <div class="rmail-sub">${esc(cfg.user || "")} · ${esc(cfg.host || "")}</div>
        <label>Password</label><input id="mc-pass" type="password" spellcheck="false">
        <label class="rmail-ck"><input type="checkbox" id="mc-remember" ${cfg.has_password ? "checked" : ""}> Remember password on this device</label>
        <div class="rmail-acts"><button class="btn" id="mc-go">CONNECT</button>
          <button class="btn ghost" id="mc-set">SETTINGS</button></div>
        <div class="rmail-err" id="mc-err">${esc(msg || "")}</div></div>`;
      $("#mc-set", root).addEventListener("click", settings);
      const go = () => {
        const pw = $("#mc-pass", root).value;
        const remember = $("#mc-remember", root).checked;
        $("#mc-err", root).textContent = "Connecting…";
        const proceed = () => doConnect(pw);
        if (remember) AltimitBridge.mailConfig({ account, remember: true, password: pw }).then((r) => { cfg = r.config; proceed(); });
        else AltimitBridge.mailConfig({ account, forget: true }).then((r) => { cfg = r.config; proceed(); });
      };
      $("#mc-go", root).addEventListener("click", go);
      $("#mc-pass", root).addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
      setTimeout(() => { const p = $("#mc-pass", root); if (p) p.focus(); }, 50);
    };
    const inbox = (messages) => {
      api.setSub(cfg.user || "inbox");
      root.innerHTML = `<div class="mailbar">
          <button class="btn" id="rm-compose">✎ Compose</button>
          <button class="btn ghost" id="rm-refresh">↻ Refresh</button>
          <button class="btn ghost" id="rm-set">Settings</button></div>
        <div class="app"><div class="app-list scroll" id="rm-list">${messages.map((m) =>
          `<div class="li" data-uid="${esc(m.uid)}"><div class="l1"><span class="from">${esc(m.from)}</span></div>
            <div class="subj">${esc(m.subject)}</div><div class="date" style="font-size:10px">${esc(m.date)}</div></div>`).join("")
            || `<div class="empty-hint">Inbox empty.</div>`}</div>
          <div class="app-read" id="rm-read"><div class="empty-hint">Select a message.</div></div></div>`;
      $$(".li", root).forEach((li) => li.addEventListener("click", () => {
        $$(".li", root).forEach((x) => x.classList.remove("sel")); li.classList.add("sel");
        $("#rm-read", root).innerHTML = `<div class="empty-hint">Loading…</div>`;
        AltimitBridge.mailMsg(account, password, li.dataset.uid).then((r) => {
          const m = r.message || {};
          $("#rm-read", root).innerHTML = `<div class="read-h"><h2>${esc(m.subject || "")}</h2>
            <div class="meta">FROM: ${esc(m.from || "")} · ${esc(m.date || "")}</div></div>
            <div class="read-body">${esc(m.body || "(no text body)")}</div>`;
        });
      }));
      $("#rm-refresh", root).addEventListener("click", () => AltimitBridge.mailList(account, password, "INBOX", 25).then((r) => inbox(r.messages || [])));
      $("#rm-set", root).addEventListener("click", settings);
      $("#rm-compose", root).addEventListener("click", () => compose());
    };
    const compose = () => {
      root.innerHTML = `<div class="rmail-form">
        <div class="rmail-h">New Message</div>
        <label>To</label><input id="cm-to" spellcheck="false">
        <label>Subject</label><input id="cm-subj" spellcheck="false">
        <label>Message</label><textarea id="cm-body" spellcheck="false"></textarea>
        <div class="rmail-acts"><button class="btn" id="cm-send">SEND</button>
          <button class="btn ghost" id="cm-cancel">CANCEL</button></div>
        <div class="rmail-err" id="cm-err"></div></div>`;
      $("#cm-cancel", root).addEventListener("click", () => AltimitBridge.mailList(account, password, "INBOX", 25).then((r) => inbox(r.messages || [])));
      $("#cm-send", root).addEventListener("click", () => {
        const to = $("#cm-to", root).value.trim();
        if (!to) { $("#cm-err", root).textContent = "Recipient required."; return; }
        $("#cm-err", root).textContent = "Sending…";
        AltimitBridge.mailSend(account, password, to, $("#cm-subj", root).value, $("#cm-body", root).value)
          .then((r) => { if (r.error) { $("#cm-err", root).textContent = "Send failed: " + r.error; return; }
            api.toast("Mail", "Message sent."); AltimitBridge.mailList(account, password, "INBOX", 25).then((x) => inbox(x.messages || [])); });
      });
    };
    AltimitBridge.mailGet(account).then((d) => {
      cfg = d.config || {};
      if (!cfg.host) return settings();
      connect(cfg.has_password);   // auto-connect with stored password when present
    });
  }

  /* ================= AMBIENT DATA HUD ================= */
  let hudTimer = null, hudPrev = null, hudSamples = [];
  const fmtRate = (bps) => bps < 1000 ? bps.toFixed(0) : bps < 1e6 ? (bps / 1e3).toFixed(1) : (bps / 1e6).toFixed(2);
  const rateUnit = (bps) => bps < 1000 ? "bps" : bps < 1e6 ? "Kbps" : "Mbps";
  const fmtUptime = (s) => { s = Math.floor(s); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return (d ? d + "d " : "") + pad(h) + ":" + pad(m); };
  function drawSpark() {
    const c = $("#hud-spark"); if (!c) return; const ctx = c.getContext("2d"), w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    if (hudSamples.length < 2) return;
    const max = Math.max(1, ...hudSamples);
    const accent = (getComputedStyle(document.documentElement).getPropertyValue("--hi") || "#1f8bff").trim();
    ctx.beginPath();
    hudSamples.forEach((v, i) => { const x = i / (hudSamples.length - 1) * w, y = h - 2 - (v / max) * (h - 4); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.shadowColor = accent; ctx.shadowBlur = 5; ctx.stroke();
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.globalAlpha = 0.16; ctx.fillStyle = accent; ctx.fill(); ctx.globalAlpha = 1;
  }
  function setRates(drx, dtx) {
    const dn = $("#hud-dn"), up = $("#hud-up-rate"), un = $("#hud-unit"); if (!dn) return;
    dn.textContent = fmtRate(drx); up.textContent = fmtRate(dtx); un.textContent = rateUnit(Math.max(drx, dtx));
    hudSamples.push(drx + dtx); if (hudSamples.length > 50) hudSamples.shift(); drawSpark();
  }
  function hudTick() {
    const apply = (n) => {
      const now = performance.now() / 1000;
      if (hudPrev && n.rx != null) {
        const dt = now - hudPrev.t;
        if (dt > 0) setRates(Math.max(0, (n.rx - hudPrev.rx)) * 8 / dt, Math.max(0, (n.tx - hudPrev.tx)) * 8 / dt);
      }
      if (n.rx != null) hudPrev = { rx: n.rx, tx: n.tx, t: now };
      if (n.host != null) {
        const set = (id, v) => { const e = $("#" + id); if (e) e.textContent = v; };
        set("hud-host", n.host); set("hud-ip", n.ip || "—"); if (n.kernel) set("hud-kernel", n.kernel);
        if (n.uptime) set("hud-up", fmtUptime(n.uptime));
        const l = $("#hud-link"); if (l) { l.textContent = n.online ? "CC-NET ●" : "offline"; l.className = n.online ? "ok" : ""; }
      }
    };
    if (bridged()) AltimitBridge.io().then(apply).catch(() => {});
    else {
      setRates(15000 + Math.random() * 500000, 6000 + Math.random() * 150000);
      const set = (id, v) => { const e = $("#" + id); if (e) e.textContent = v; };
      set("hud-host", "localhost"); set("hud-ip", "127.0.0.1"); set("hud-kernel", "Altimit OS");
      const l = $("#hud-link"); if (l) { l.textContent = "CC-NET ●"; l.className = "ok"; }
    }
  }
  function startHUD() {
    $("#desktop").classList.add("hud-show"); hudPrev = null; hudSamples = [];
    hudTick(); clearInterval(hudTimer); hudTimer = setInterval(hudTick, 1000);
  }
  function stopHUD() { clearInterval(hudTimer); hudTimer = null; $("#desktop").classList.remove("hud-show"); }

  /* ================= INIT ================= */
  async function init() {
    if (window.AltimitBridge) { try { await AltimitBridge.probe(); } catch (e) {} }
    if (bridged()) { const n = $(".tb-net"); if (n) n.textContent = "CC-NET ●"; }
    applyTheme(state.theme);
    $("#boot-spiral").innerHTML = spiralSVG(96);
    $("#wm-spiral").innerHTML = spiralSVG(60);
    $("#boot-copy").textContent = D.system.copyright;
    $("#tb-user").textContent = state.user;
    buildDesktop();
    tickClock(); setInterval(tickClock, 1000);

    // taskbar / start menu wiring
    $("#tb-start").addEventListener("click", (e) => { e.stopPropagation(); SFX.click(); $("#startmenu").classList.toggle("open"); });
    $("#startmenu").addEventListener("click", (e) => e.stopPropagation());
    $("#calpop").addEventListener("click", (e) => e.stopPropagation());

    // desktop right-click menu
    $("#desktop").addEventListener("contextmenu", (e) => {
      if (e.target.closest(".win")) return;
      e.preventDefault(); $("#startmenu").classList.remove("open"); $("#calpop").classList.remove("open");
      showCtxMenu(e.clientX, e.clientY);
    });
    // clock → calendar
    $(".tb-clock").addEventListener("click", (e) => { e.stopPropagation(); SFX.click(); toggleCal(); });

    // any outside click closes transient popups
    document.addEventListener("click", () => {
      $("#startmenu").classList.remove("open"); $("#calpop").classList.remove("open"); hideCtx();
    });
    document.addEventListener("contextmenu", (e) => { if (!e.target.closest("#desktop") && !e.target.closest(".win")) hideCtx(); });

    runPost(runBoot);
  }

  // expose a tiny debug hook
  window.ALTIMIT = { open: openApp, state: () => state, post: sysLines };
  document.addEventListener("DOMContentLoaded", init);
})();
