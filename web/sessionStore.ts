const { Store } = require("express-session");

// A bounded, expiring store for the single-process bot/web deployment.
// Sessions intentionally expire on restart; secrets are never written to disk.
class SessionStore extends Store {
  constructor({ maxSessions = 2000, ttl = 86400000 } = {}) {
    super();
    this.sessions = new Map();
    this.maxSessions = maxSessions;
    this.ttl = ttl;
    this.timer = setInterval(() => this.prune(), 60000);
    this.timer.unref();
  }
  prune() {
    for (const [id, entry] of this.sessions)
      if (entry.expires <= Date.now()) this.sessions.delete(id);
  }
  expires(value) {
    const timestamp = value.cookie?.expires ? new Date(value.cookie.expires).getTime() : Date.now() + this.ttl;
    return Number.isFinite(timestamp) ? timestamp : Date.now() + this.ttl;
  }
  get(id, done) {
    const entry = this.sessions.get(id);
    if (entry && entry.expires <= Date.now()) this.sessions.delete(id);
    const value = this.sessions.get(id);
    process.nextTick(() => done(null, value ? JSON.parse(value.json) : null));
  }
  set(id, value, done) {
    try {
      this.prune();
      if (!this.sessions.has(id) && this.sessions.size >= this.maxSessions)
        throw new Error("A munkamenetek száma elérte a korlátot.");
      const json = JSON.stringify(value);
      if (Buffer.byteLength(json, "utf8") > 65536) throw new Error("Túl nagy munkamenet.");
      this.sessions.set(id, { json, expires: this.expires(value) });
      process.nextTick(() => done?.());
    } catch (error) { process.nextTick(() => done?.(error)); }
  }
  touch(id, value, done) {
    const entry = this.sessions.get(id);
    if (entry) {
      const stored = JSON.parse(entry.json);
      stored.cookie = value.cookie;
      entry.json = JSON.stringify(stored);
      entry.expires = this.expires(value);
    }
    process.nextTick(() => done?.());
  }
  destroy(id, done) {
    this.sessions.delete(id);
    process.nextTick(() => done?.());
  }
  clear(done) {
    this.sessions.clear();
    process.nextTick(() => done?.());
  }
  close() { clearInterval(this.timer); }
}

module.exports = { SessionStore };
