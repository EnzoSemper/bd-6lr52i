/* ============================================================
   AltimitBridge — the UI's link to the altimitd agent.
   When the agent is reachable (running as a real distro), apps
   use real integrations: multi-user state, launching programs,
   the filesystem, media, network, and IMAP mail. When it's not
   (standalone file://), Bridge.online stays false and apps fall
   back to their self-contained mock behavior.
   ============================================================ */
(function () {
  "use strict";
  const AGENT = (location.origin && location.origin.startsWith("http"))
    ? location.origin : "http://127.0.0.1:8800";

  const j = (p, opts) => fetch(AGENT + p, opts).then((r) => r.json());
  const post = (p, body) => j(p, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const timeout = (ms) => new Promise((_, x) => setTimeout(() => x(new Error("timeout")), ms));

  const Bridge = {
    online: false,
    info: null,
    agent: AGENT,

    async probe() {
      try {
        this.info = await Promise.race([j("/api/ping"), timeout(1200)]);
        this.online = !!(this.info && this.info.ok);
      } catch (e) { this.online = false; }
      return this.online;
    },

    // users + per-user desktop state
    users() { return j("/api/users"); },
    addUser(name) { return post("/api/users", { name }); },
    removeUser(name) { return post("/api/users/remove", { name }); },
    getState(user) { return j("/api/state?user=" + encodeURIComponent(user)); },
    saveState(user, obj) { return post("/api/state?user=" + encodeURIComponent(user), obj); },

    // host powers
    launch(kind, opts) { return post("/api/launch", Object.assign({ kind }, opts || {})); },
    fs(path) { return j("/api/fs?path=" + encodeURIComponent(path || "/")); },
    media() { return j("/api/media"); },
    mediaURL(u) { return AGENT + u; },
    net() { return j("/api/net"); },
    boot() { return j("/api/boot"); },
    io() { return j("/api/io"); },

    // mail (IMAP via agent; password is sent per-request, never persisted)
    mailConfig(cfg) { return post("/api/mail/config", cfg); },
    mailGet(account) { return post("/api/mail/get", { account }); },
    mailList(account, password, box, limit) { return post("/api/mail/list", { account, password, box, limit }); },
    mailMsg(account, password, uid) { return post("/api/mail/msg", { account, password, uid }); },
    mailSend(account, password, to, subject, body) { return post("/api/mail/send", { account, password, to, subject, body }); },
  };

  window.AltimitBridge = Bridge;
})();
