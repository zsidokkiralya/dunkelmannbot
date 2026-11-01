const express = require("express");
const router = express.Router();
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const axios = require("axios");
const config = require("../config");
const { csrfToken, validCsrf, canManageGuild } = require("./security");

router.use((req, res, next) => {
  const token = req.isAuthenticated() ? csrfToken(req) : "";
  res.locals.page = (options) => page({ ...options, csrf: token });
  next();
});

const BOT_API = `http://127.0.0.1:${config.BOT_API_PORT || 20022}`;

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

if (config.CLIENT_ID && config.CLIENT_SECRET) passport.use(
  new DiscordStrategy(
    {
      clientID: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET,
      callbackURL: `${config.BASE_URL}/auth/discord/callback`,
      scope: ["identify", "guilds"],
      state: true,
    },
    (accessToken, refreshToken, profile, done) => done(null, profile),
  ),
);

const getAuthHeader = () => config.BOT_API_SECRET ? { headers: { "x-bot-api-key": config.BOT_API_SECRET } } : {};

async function getBotStats() {
  try {
    const res = await axios.get(`${BOT_API}/api/bot/status`, { timeout: 2000, ...getAuthHeader() });
    return res.data;
  } catch {
    return { online: false, guilds: 0, users: 0, ping: null, uptime: 0, framework: "Sapphire Framework (TypeScript)" };
  }
}

async function getBotGuilds() {
  try {
    const res = await axios.get(`${BOT_API}/api/bot/guilds`, { timeout: 2000, ...getAuthHeader() });
    return new Set(res.data);
  } catch {
    return new Set();
  }
}

async function getBotGuildsDetails() {
  try {
    const res = await axios.get(`${BOT_API}/api/bot/guilds/details`, { timeout: 3000, ...getAuthHeader() });
    return res.data;
  } catch {
    return [];
  }
}

async function getGuildSettings(guildId) {
  try {
    const res = await axios.get(`${BOT_API}/api/bot/guild/${guildId}/settings`, { timeout: 2000, ...getAuthHeader() });
    return res.data;
  } catch {
    return null;
  }
}

async function updateGuildSettings(guildId, settings) {
  try {
    const res = await axios.post(`${BOT_API}/api/bot/guild/${guildId}/settings`, settings, { timeout: 2000, ...getAuthHeader() });
    return res.data;
  } catch (err) {
    console.error("[routes] updateGuildSettings error:", err ? (err.message || err) : "Error");
    return null;
  }
}

async function getGuildChannels(guildId) {
  try {
    const res = await axios.get(`${BOT_API}/api/bot/guild/${guildId}/channels`, { timeout: 2000, ...getAuthHeader() });
    return res.data;
  } catch {
    return [];
  }
}

async function getGuildWarnings(guildId) {
  try {
    const res = await axios.get(`${BOT_API}/api/bot/guild/${guildId}/warnings`, { timeout: 2000, ...getAuthHeader() });
    return res.data;
  } catch {
    return {};
  }
}

async function getDevsInfo() {
  try {
    const res = await axios.get(`${BOT_API}/api/bot/devs`, { timeout: 2000, ...getAuthHeader() });
    return res.data;
  } catch {
    return [
      { id: "1212864602140971008", username: "Dunkelmann", avatar: "https://cdn.discordapp.com/embed/avatars/0.png" },
      { id: "888072261846859806", username: "aø.", avatar: "https://cdn.discordapp.com/embed/avatars/1.png" },
    ];
  }
}

async function getSysInfo() {
  try {
    const res = await axios.get(`${BOT_API}/api/bot/sysinfo`, { timeout: 2000, ...getAuthHeader() });
    return res.data;
  } catch {
    return null;
  }
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function isDev(user) {
  return user && config.DEV_IDS.includes(user.id);
}

function hasAdminPerms(g) {
  try {
    const p = BigInt(g.permissions);
    return (p & 8n) === 8n || (p & 32n) === 32n;
  } catch {
    return false;
  }
}

function clamp(val, min, max) {
  const n = parseInt(val);
  return isNaN(n) ? min : Math.max(min, Math.min(max, n));
}

function navBar(user, currentPath = "/", csrf = "") {
  const isDevUser = isDev(user);
  const avatarUrl = user && user.avatar
    ? `https://cdn.discordapp.com/avatars/${esc(user.id)}/${esc(user.avatar)}.webp?size=64`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  const userHtml = user
    ? `<div class="nav-user">
        <img src="${avatarUrl}" class="nav-avatar" alt="" data-fallback="https://cdn.discordapp.com/embed/avatars/0.png">
        <span class="nav-username">${esc(user.username)}</span>
        <form action="/logout" method="POST"><input type="hidden" name="_csrf" value="${esc(csrf)}"><button type="submit" class="nav-logout">Kilépés</button></form>
       </div>`
    : `<a href="/auth/discord" class="btn btn-sm">Bejelentkezés</a>`;

  return `
  <nav>
    <a href="/" class="nav-logo">
      <span class="status-dot on" title="Dunkelmann Network (Magyar Bot)"></span>Dunkelmann <span class="badge badge-hu" style="font-size:0.7rem;margin-left:6px">🇭🇺 HU</span>
    </a>
    <div class="nav-links">
      <a href="/" class="${currentPath === '/' ? 'active' : ''}">Főoldal</a>
      <a href="/commands" class="${currentPath === '/commands' ? 'active' : ''}">Parancsok</a>
      ${user ? `<a href="/dashboard" class="${currentPath.startsWith('/dashboard') || currentPath.startsWith('/manage') ? 'active' : ''}">Kezelőfelület</a>` : ''}
      ${isDevUser ? `<a href="/admin" class="${currentPath.startsWith('/admin') ? 'active' : ''}" style="color:var(--accent);font-weight:700">👨‍💻 Dev Admin</a>` : ''}
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      ${userHtml}
      <button class="hamburger" data-action="mobile-menu" aria-label="Menü">☰</button>
    </div>
  </nav>

  <div class="mobile-menu" id="mobileMenu">
    <div class="mobile-drawer">
      <button class="mobile-close" data-action="mobile-menu">✕</button>
      <a href="/">Főoldal</a>
      <a href="/commands">Parancsok</a>
      ${user ? `<a href="/dashboard">Kezelőfelület</a>` : '<a href="/auth/discord">Bejelentkezés</a>'}
      ${isDevUser ? `<a href="/admin" style="color:var(--accent);font-weight:700">👨‍💻 Dev Admin Panel</a>` : ''}
      ${user ? `<form action="/logout" method="POST"><input type="hidden" name="_csrf" value="${esc(csrf)}"><button type="submit" class="nav-logout">Kilépés</button></form>` : ''}
    </div>
  </div>`;
}

function devPanelHtml() {
  return `
  <button class="dev-fab" id="devFab" data-action="dev-panel" title="Fejlesztők">👨‍💻</button>
  <div class="dev-panel" id="devPanel">
    <div class="dev-ph">
      <span>Fejlesztői Csapat (🇭🇺 Magyar)</span>
      <button class="dev-close" data-action="dev-panel">✕</button>
    </div>
    <div class="dev-row">
      <img src="https://cdn.discordapp.com/avatars/1212864602140971008/a_2f5d8e382a2d74ff7898d8e732d5e5d7.webp?size=128"
           class="dev-av" alt="" data-fallback="https://cdn.discordapp.com/embed/avatars/0.png">
      <div>
        <div class="dev-n">Dunkelmann 🇭🇺</div>
        <div class="dev-r">Alapító &amp; Főfejlesztő</div>
        <div class="dev-id">1212864602140971008</div>
      </div>
    </div>
    <div class="dev-row">
      <img src="https://cdn.discordapp.com/avatars/888072261846859806/3b7a10b3e649a31d1c3c8d7e0c5f4c1c.webp?size=128"
           class="dev-av" alt="" data-fallback="https://cdn.discordapp.com/embed/avatars/1.png">
      <div>
        <div class="dev-n">aø. 🇭🇺</div>
        <div class="dev-r">Webfejlesztő &amp; Dev</div>
        <div class="dev-id">888072261846859806</div>
      </div>
    </div>
    <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border);font-size:0.78rem;color:var(--text-muted);text-align:center">
      🛠️ <strong>Dunkelmann</strong> – Folyamatos fejlesztés
    </div>
  </div>`;
}

function pageFooter() {
  return `<footer>Dunkelmann &copy; 2021–${new Date().getFullYear()} &nbsp;|&nbsp; 🇭🇺 Magyar fejlesztésű Discord BOT &nbsp;|&nbsp; 🔄 Rolling Release &nbsp;|&nbsp; Fejlesztők: Dunkelmann &amp; aø. &nbsp;|&nbsp; <a href="/invite">Bot meghívása</a></footer>`;
}

function page({ title, body, user = null, currentPath = "/", csrf = "", description = "Dunkelmann – Magyar fejlesztésű Discord bot folyamatos fejlesztéssel." }) {
  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#ff3366">
<title>${esc(title)} – Dunkelmann (🇭🇺 Magyar)</title>
<link rel="stylesheet" href="/css/main.css">
</head>
<body>
${navBar(user, currentPath, csrf)}
<main class="content">${body}</main>
${devPanelHtml()}
${pageFooter()}
<script src="/js/main.js"></script>
</body>
</html>`;
}

const COMMANDS_DATA = [
  {
    cat: "🔧 Általános",
    cmds: [
      { name: "/help", desc: "Bot parancsainak súgója" },
      { name: "/ping", desc: "Bot válaszideje" },
      { name: "/stats", desc: "Bot és rendszer statisztikák" },
      { name: "/devs", desc: "Fejlesztői csapat adatai" },
    ],
  },
  {
    cat: "📋 Logging",
    cmds: [
      { name: "/log setup", desc: "Log csatorna beállítása", perm: "ManageGuild" },
      { name: "/log toggle", desc: "Log kategóriák ki-/bekapcsolása", perm: "ManageGuild" },
      { name: "/log status", desc: "Logging státusz megtekintése", perm: "ManageGuild" },
      { name: "/log disable", desc: "Logging kikapcsolása", perm: "ManageGuild" },
    ],
  },
  {
    cat: "🎭 Szórakozás",
    cmds: [
      { name: "/meme", desc: "Random mém a Redditről" },
      { name: "/joke", desc: "Random magyar vicc" },
      { name: "/coinflip", desc: "Pénzfeldobás (fej/írás)" },
      { name: "/8ball", desc: "Varázsgömb válaszol a kérdésedre" },
    ],
  },
  {
    cat: "🔍 Információ",
    cmds: [
      { name: "/avatar", desc: "Profilkép megjelenítése" },
      { name: "/userinfo", desc: "Felhasználói adatok" },
      { name: "/serverinfo", desc: "Szerver adatok" },
      { name: "/roleinfo", desc: "Rang részletei" },
      { name: "/permscheck", desc: "Egy rang összes jogosultságának ellenőrzése" },
      { name: "/whois", desc: "Domain WHOIS lekérdezés" },
      { name: "/ipinfo", desc: "IP cím & VPN ellenőrzés" },
      { name: "/screenshot", desc: "Weboldal pillanatkép készítése" },
    ],
  },
  {
    cat: "🎵 Zene",
    cmds: [
      { name: "/play", desc: "Zene lejátszása BeatCloud linkről" },
      { name: "/stop", desc: "Lejátszás megállítása" },
      { name: "/resume", desc: "Lejátszás folytatása" },
    ],
  },
  {
    cat: "🛡️ Moderáció",
    cmds: [
      { name: "/ban", desc: "Tag kitiltása szerverről", perm: "BanMembers" },
      { name: "/kick", desc: "Tag kirúgása szerverről", perm: "KickMembers" },
      { name: "/timeout", desc: "Tag elnémítása megadott időre", perm: "ModerateMembers" },
      { name: "/warn", desc: "Figyelmeztetések kezelése", perm: "ManageMessages" },
      { name: "/clear", desc: "Üzenetek tömeges törlése", perm: "ManageMessages" },
      { name: "/lock", desc: "Csatorna zárolása", perm: "ManageChannels" },
      { name: "/slowmode", desc: "Lassított mód beállítása", perm: "ManageChannels" },
      { name: "/snipe", desc: "Legutóbb törölt üzenet lekérése" },
      { name: "/say", desc: "Üzenet küldése a bot nevében", perm: "ManageMessages" },
    ],
  },
  {
    cat: "👑 Admin & Rendszer",
    cmds: [
      { name: "/role", desc: "Rangok kezelése", perm: "ManageRoles" },
      { name: "/channel", desc: "Csatornák kezelése", perm: "ManageChannels" },
      { name: "/category", desc: "Kategóriák kezelése", perm: "ManageChannels" },
      { name: "/ticket", desc: "Ticket rendszer", perm: "Administrator" },
      { name: "/ticketpanel", desc: "Ticket panel kiküldése", perm: "ManageGuild" },
      { name: "/dev", desc: "Dev vezérlőpult", perm: "Developer" },
    ],
  },
  {
    cat: "🎁 Események",
    cmds: [
      { name: "/poll", desc: "Szavazás indítása", perm: "ManageMessages" },
      { name: "/giveaway", desc: "Nyereményjáték indítása", perm: "ManageEvents" },
      { name: "/remind", desc: "Emlékeztető beállítása" },
    ],
  },
  {
    cat: "⚙️ Beállítások",
    cmds: [
      { name: "/profanity", desc: "Káromkodás szűrő", perm: "ManageMessages" },
      { name: "/invitefilter", desc: "Discord invite szűrő", perm: "ManageMessages" },
      { name: "/emojifilter", desc: "Emoji limit szűrő", perm: "ManageMessages" },
      { name: "/virustotal", desc: "VirusTotal link-védelem", perm: "ManageGuild" },
      { name: "/counting", desc: "Számolós játék", perm: "ManageChannels" },
    ],
  },
];

router.get("/api/status", async (req, res) => {
  const stats = await getBotStats();
  res.json(stats);
});

router.get("/", async (req, res) => {
  const stats = await getBotStats();
  const servers = stats.guilds;
  const users = stats.users;
  const cmds = COMMANDS_DATA.reduce((a, c) => a + c.cmds.length, 0);

  const authAlert = req.query.error === "auth"
    ? `<div class="alert alert-err" style="max-width:680px;margin:0 auto 24px">❌ Bejelentkezés sikertelen. Ellenőrizd a Discord OAuth beállításokat.</div>`
    : "";

  const pingLine = stats.online && stats.ping != null
    ? `<div class="stat-card"><span class="stat-num">${stats.ping}ms</span><span class="stat-lbl">Ping</span></div>`
    : "";

  const body = `
    ${authAlert}
    <div class="hero">
      <div class="hero-badge-container" style="display:flex;justify-content:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
        <span class="badge badge-hu">🇭🇺 Magyar Fejlesztésű BOT</span>
        <span class="badge badge-rolling">🔄 Folyamatos / Gördülő Fejlesztés (Rolling)</span>
        <span class="badge badge-on">⚡ Sapphire Framework (TS)</span>
      </div>
      <h1 class="hero-title">Dunkelmann</h1>
      <p class="hero-sub">Magyar fejlesztésű, teljes körű Discord bot Sapphire framework alapon: **moderáció**, **zene**, **logging**, **VirusTotal védelem** és webes kezelőfelület – ${stats.online ? "🟢 jelenleg online" : "🔴 offline"}.</p>
      
      <div class="dev-credits-banner" style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:12px;padding:12px 20px;max-width:650px;margin:18px auto 24px;font-size:0.9rem;color:var(--text-secondary)">
        👨‍💻 <strong>Készítők &amp; Fejlesztők:</strong> <u>Dunkelmann</u> (Alapító &amp; Főfejlesztő) és <u>aø.</u> (Webfejlesztő &amp; Dev)
      </div>

      <div class="hero-btns">
        <a href="/invite" class="btn">🚀 Bot meghívása</a>
        <a href="/dashboard" class="btn btn-ghost">📊 Kezelőfelület</a>
      </div>
    </div>

    <div class="stats">
      <div class="stat-card"><span class="stat-num">${servers}</span><span class="stat-lbl">Aktív szerver</span></div>
      <div class="stat-card"><span class="stat-num">${users.toLocaleString("hu")}</span><span class="stat-lbl">Felhasználó</span></div>
      <div class="stat-card"><span class="stat-num">${cmds}</span><span class="stat-lbl">Parancs</span></div>
      ${pingLine}
      <div class="stat-card"><span class="stat-num">24/7</span><span class="stat-lbl">Üzemeltetés</span></div>
    </div>

    <h2 class="section-title">Miért Dunkelmann?</h2>
    <p class="section-sub">Elsőrangú magyar Discord bot gördülő fejlesztéssel és webes vezérléssel.</p>
    <div class="features">
      <div class="feature-card">
        <div class="feature-icon">📋</div>
        <div class="feature-title">Esemény Logging</div>
        <div class="feature-desc">Moderációs akciók, törölt/szerkesztett üzenetek, belépések és hangcsatorna események naplózása.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🛡️</div>
        <div class="feature-title">Moderáció</div>
        <div class="feature-desc">Ban, kick, timeout, warn, invite szűrő és káromkodás szűrő az automatizált védelemért.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <div class="feature-title">VirusTotal Védelem</div>
        <div class="feature-desc">Automatikus link-ellenőrzés VirusTotal API-n keresztül a veszélyes weboldalak kiszűrésére.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎭</div>
        <div class="feature-title">Magyar Szórakozás</div>
        <div class="feature-desc">Magyar viccek, Reddit mémek, 8Ball, pénzfeldobás, szavazások és nyereményjátékok.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎵</div>
        <div class="feature-title">Zene Lejátszás</div>
        <div class="feature-desc">Zene streamelés BeatCloud linkekről közvetlenül a Discord hangcsatornába.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">⚙️</div>
        <div class="feature-title">Bővített Kezelőfelület</div>
        <div class="feature-desc">Szerver beállítások, tömeges modul kapcsolók, kereső és részletes konfiguráció webről.</div>
      </div>
    </div>
    <div style="text-align:center;margin-top:20px">
      <a href="/commands" class="btn btn-ghost">📋 Az összes parancs megtekintése</a>
    </div>`;

  res.send(res.locals.page({ title: "Főoldal", body, user: req.user, currentPath: "/" }));
});

router.get("/commands", (req, res) => {
  const sections = COMMANDS_DATA.map((cat) => {
    const cards = cat.cmds
      .map(
        (c) => `
        <div class="cmd-card">
          <span class="cmd-name">${esc(c.name)}</span>${c.perm ? `<span class="cmd-perm">${esc(c.perm)}</span>` : ""}
          <div class="cmd-desc">${esc(c.desc)}</div>
        </div>`,
      )
      .join("");
    return `<div class="cmd-section"><div class="cmd-cat"><span>${esc(cat.cat)}</span></div><div class="cmd-grid">${cards}</div></div>`;
  }).join("");

  const body = `
    <h1 style="margin-bottom:8px">📋 Bot parancsok (🇭🇺 Magyar)</h1>
    <p style="color:var(--text-secondary);margin-bottom:20px;font-size:0.95rem">
      Az összes elérhető slash parancs magyar nyelven. Használd a szűrőket és a keresőt!
    </p>

    <div class="cmd-controls" style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap">
      <input type="text" class="cmd-search" style="flex:1;min-width:240px" placeholder="🔍 Keresés parancs neve vagy leírása alapján..." data-filter="commands">
      <select data-filter-category class="ninput" style="width:200px">
        <option value="all">Minden kategória</option>
        ${COMMANDS_DATA.map(c => `<option value="${esc(c.cat)}">${esc(c.cat)}</option>`).join("")}
      </select>
    </div>

    ${sections}`;

  res.send(res.locals.page({ title: "Parancsok", body, user: req.user, currentPath: "/commands" }));
});

router.get("/dashboard", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/auth/discord");

  const user = req.user;
  const botGuilds = await getBotGuilds();
  const adminGuilds = (user.guilds || [])
    .filter(hasAdminPerms)
    .sort((a, b) => a.name.localeCompare(b.name, "hu"));

  const guildCards = adminGuilds
    .map((g) => {
      const iconUrl = g.icon
        ? `https://cdn.discordapp.com/icons/${esc(g.id)}/${esc(g.icon)}.webp?size=128`
        : null;
      const initials = esc(
        g.name
          .split(" ")
          .map((w) => w[0] || "")
          .join("")
          .toUpperCase()
          .slice(0, 2),
      );
      const iconHtml = iconUrl
        ? `<img src="${iconUrl}" class="guild-icon" alt="" loading="lazy" data-fallback-initials>`
        : "";
      const initDiv = `<div class="guild-icon guild-initials" style="${iconUrl ? "display:none" : ""}">${initials}</div>`;
      const isOnline = botGuilds.has(g.id);
      const badge = isOnline
        ? `<span class="badge badge-on">✅ Bot online</span>`
        : `<span class="badge badge-off">Bot nincs itt</span>`;
      const name = esc(g.name.length > 24 ? g.name.slice(0, 24) + "…" : g.name);

      return `<a href="/manage/${esc(g.id)}" class="guild-card" data-name="${esc(g.name.toLowerCase())}">
        ${iconHtml}${initDiv}
        <div>
          <div class="guild-name">${name}</div>
          ${badge}
        </div>
      </a>`;
    })
    .join("");

  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${esc(user.id)}/${esc(user.avatar)}.webp?size=128`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  const devAdminBtn = isDev(user)
    ? `<a href="/admin" class="btn" style="margin-left:auto">👨‍💻 Dev Admin Panel</a>`
    : "";

  const body = `
    <div style="display:flex;align-items:center;gap:18px;margin-bottom:30px;padding-bottom:24px;border-bottom:1px solid var(--border);flex-wrap:wrap">
      <img src="${avatarUrl}" style="width:60px;height:60px;border-radius:50%;border:2px solid var(--accent)" alt="" data-fallback="https://cdn.discordapp.com/embed/avatars/0.png">
      <div>
        <h2 style="font-size:1.5rem">Üdvözöllek, ${esc(user.username)}!</h2>
        <p style="color:var(--text-secondary);font-size:0.9rem;margin-top:2px">🇭🇺 Dunkelmann Magyar Vezérlőpult &nbsp;|&nbsp; 🔄 Rolling Release</p>
      </div>
      ${devAdminBtn}
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <h3 style="margin:0">Kezelni való szerverek <span style="color:var(--text-muted);font-weight:400">(${adminGuilds.length})</span></h3>
      <input type="text" class="ninput" style="width:260px" placeholder="🔍 Szerver keresése..." data-filter="dashboard">
    </div>

    ${
      adminGuilds.length === 0
        ? `<div class="empty"><p style="font-size:1.05rem;margin-bottom:8px">Nincs kezelni való szervered.</p><p style="font-size:0.88rem;opacity:0.7">Csak azok a szerverek jelennek meg, ahol admin jogod van.</p></div>`
        : `<div class="guild-grid" id="guildContainer">${guildCards}</div>`
    }

    <div style="margin-top:35px;text-align:center">
      <a href="/" class="btn btn-ghost">&larr; Vissza a főoldalra</a>
    </div>`;

  res.send(res.locals.page({ title: "Kezelőfelület", body, user, currentPath: "/dashboard" }));
});

router.get("/manage/:guildId", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/auth/discord");

  const { guildId } = req.params;
  const user = req.user;
  const guild = (user.guilds || []).find((g) => g.id === guildId && hasAdminPerms(g));

  if (!(await canManageGuild(user, guildId))) {
    return res.status(403).send(
      res.locals.page({
        title: "Hozzáférés megtagadva",
        user,
        body: `
          <div style="text-align:center;padding:80px 20px">
            <h2 style="color:var(--danger);margin-bottom:14px">🚫 Hozzáférés megtagadva</h2>
            <p style="color:var(--text-secondary);margin-bottom:24px">Nincs jogosultságod ennek a szervernek a kezeléséhez.</p>
            <a href="/dashboard" class="btn">Vissza a kezelőfelületre</a>
          </div>`,
      }),
    );
  }

  const settings = await getGuildSettings(guildId) || {
    invite: { enabled: false },
    virustotal: { enabled: false, threshold: 3 },
    profanity: { enabled: false },
    emoji: { enabled: false, limit: 5 },
    counting: { enabled: false, currentNumber: 0, record: 0 },
    logging: { enabled: false, channel: null, events: { moderation: true, messages: true, members: true, voice: true } },
  };

  const channels = await getGuildChannels(guildId);
  const warnings = await getGuildWarnings(guildId);

  const invSett = settings.invite;
  const vtSett = settings.virustotal;
  const profSett = settings.profanity;
  const emojiSett = settings.emoji;
  const countSett = settings.counting;
  const logSett = settings.logging;

  const warningList = Object.keys(warnings).map((id) => warnings[id]);
  const totalWarns = warningList.reduce((a, w) => a + (w.warnings?.length || 0), 0);

  const warnRows = Object.keys(warnings).length > 0
    ? warningList
        .map((w) => `<div class="info-row"><span class="info-lbl">${esc(w.username)}</span><span class="info-val">${w.warnings.length} figyelmeztetés</span></div>`)
        .join("")
    : `<div class="info-row"><span class="info-lbl" style="width:100%">Nincsenek figyelmeztetések ezen a szerveren.</span></div>`;

  const channelOptions = channels
    .map((c) => `<option value="${c.id}" ${logSett.channel === c.id ? "selected" : ""}>#${esc(c.name)}</option>`)
    .join("");

  const successAlert = req.query.success
    ? `<div class="alert alert-ok">✅ Beállítások sikeresen mentve!</div>`
    : "";
  const errorAlert = req.query.error
    ? `<div class="alert alert-err">❌ Hiba a mentés során. Próbáld újra!</div>`
    : "";

  const guildName = guild ? guild.name : `Szerver (${guildId})`;

  const body = `
    <a href="/dashboard" style="color:var(--accent);font-size:0.88rem;display:inline-block;margin-bottom:22px">&larr; Vissza a szerverekhez</a>
    
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <h1>⚙️ ${esc(guildName)}</h1>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm btn-ghost" data-action="toggle-all" data-enabled="true">✅ Összes modul be</button>
        <button class="btn btn-sm btn-ghost" data-action="toggle-all" data-enabled="false">❌ Összes modul ki</button>
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" data-tab="settings">⚙️ Moderáció &amp; Biztonság</button>
      <button class="tab" data-tab="logging">📋 Logging Rendszer</button>
      <button class="tab" data-tab="info">ℹ️ Szerver Infó &amp; Warnok</button>
    </div>

    <div class="settings-wrap">
      ${successAlert}${errorAlert}

      <form action="/manage/${esc(guildId)}" method="POST" id="manageForm">
        <input type="hidden" name="_csrf" value="${esc(csrfToken(req))}">
        <div class="tab-content active" id="tab-settings">
          <div class="cat-label">Moderáció – Automata Szűrők</div>

          <div class="sblock">
            <div class="sblock-left">
              <div class="sblock-title">🔗 Invite szűrő</div>
              <div class="sblock-desc">Automatikusan törli a Discord szerver meghívó linkeket az üzenetekből.</div>
            </div>
            <label class="switch"><input type="checkbox" class="mod-switch" name="invitefilter" ${invSett.enabled ? "checked" : ""}><span class="slider"></span></label>
          </div>

          <div class="sblock">
            <div class="sblock-left">
              <div class="sblock-title">🤐 Káromkodás szűrő</div>
              <div class="sblock-desc">Törli a feketelistás szavakat és trágár kifejezéseket.</div>
            </div>
            <label class="switch"><input type="checkbox" class="mod-switch" name="profanity" ${profSett.enabled ? "checked" : ""}><span class="slider"></span></label>
          </div>

          <div class="sblock">
            <div class="sblock-left">
              <div class="sblock-title">😀 Emoji limit szűrő</div>
              <div class="sblock-desc">Maximum megengedett emoji száma üzenetenként.</div>
            </div>
            <div style="display:flex;align-items:center;gap:14px;flex-shrink:0">
              <input type="number" name="emoji_limit" class="ninput" min="1" max="50" value="${emojiSett.limit}">
              <label class="switch"><input type="checkbox" class="mod-switch" name="emojifilter" ${emojiSett.enabled ? "checked" : ""}><span class="slider"></span></label>
            </div>
          </div>

          <div class="cat-label">Biztonság &amp; VirusTotal API</div>

          <div class="sblock">
            <div class="sblock-left">
              <div class="sblock-title">🛡️ VirusTotal Linkvédelem</div>
              <div class="sblock-desc">Minden gyanús webes linket ellenőriz a VirusTotal adatbázisában. Törlési küszöb:</div>
            </div>
            <div style="display:flex;align-items:center;gap:14px;flex-shrink:0">
              <input type="number" name="vt_threshold" class="ninput" min="1" max="10" value="${vtSett.threshold}" title="Törlési küszöb (1-10)">
              <label class="switch"><input type="checkbox" class="mod-switch" name="virustotal" ${vtSett.enabled ? "checked" : ""}><span class="slider"></span></label>
            </div>
          </div>

          <button type="submit" class="save-btn">💾 Változtatások mentése</button>
        </div>

        <div class="tab-content" id="tab-logging">
          <div class="cat-label">Logging Konfiguráció</div>

          <div class="sblock">
            <div class="sblock-left">
              <div class="sblock-title">📋 Logging Főkapcsoló</div>
              <div class="sblock-desc">A kiválasztott csatornába küldi a szerver események részletes naplóját.</div>
            </div>
            <label class="switch"><input type="checkbox" name="logging_enabled" ${logSett.enabled ? "checked" : ""}><span class="slider"></span></label>
          </div>

          <div class="sblock">
            <div class="sblock-left">
              <div class="sblock-title">📢 Log Csatorna Kiválasztása</div>
              <div class="sblock-desc">Válaszd ki a cél csatornát:</div>
            </div>
            <select name="logging_channel" class="ninput" style="width:200px">
              <option value="">-- Válassz csatornát --</option>
              ${channelOptions}
            </select>
          </div>

          <div class="cat-label">Naplózott Kategóriák</div>

          <div class="sblock">
            <div class="sblock-left"><div class="sblock-title">🛡️ Moderációs akciók</div><div class="sblock-desc">Ban, kick, timeout, warn események.</div></div>
            <label class="switch"><input type="checkbox" name="log_moderation" ${logSett.events?.moderation !== false ? "checked" : ""}><span class="slider"></span></label>
          </div>

          <div class="sblock">
            <div class="sblock-left"><div class="sblock-title">💬 Üzenet események</div><div class="sblock-desc">Törölt és szerkesztett üzenetek naplózása.</div></div>
            <label class="switch"><input type="checkbox" name="log_messages" ${logSett.events?.messages !== false ? "checked" : ""}><span class="slider"></span></label>
          </div>

          <div class="sblock">
            <div class="sblock-left"><div class="sblock-title">👥 Tag mozgások</div><div class="sblock-desc">Szerverre belépések és kilépések nyomon követése.</div></div>
            <label class="switch"><input type="checkbox" name="log_members" ${logSett.events?.members !== false ? "checked" : ""}><span class="slider"></span></label>
          </div>

          <div class="sblock">
            <div class="sblock-left"><div class="sblock-title">🔊 Hangcsatornák</div><div class="sblock-desc">Hangcsatorna csatlakozás, kilépés és váltás.</div></div>
            <label class="switch"><input type="checkbox" name="log_voice" ${logSett.events?.voice !== false ? "checked" : ""}><span class="slider"></span></label>
          </div>

          <button type="submit" class="save-btn">💾 Logging Mentése</button>
        </div>
      </form>

      <div class="tab-content" id="tab-info">
        <div class="cat-label">Számolós játék státusz</div>
        <div class="info-box">
          <div class="info-row"><span class="info-lbl">Játék Állapot</span><span class="info-val">${countSett.enabled ? "✅ Aktív" : "❌ Inaktív"}</span></div>
          <div class="info-row"><span class="info-lbl">Jelenlegi szám</span><span class="info-val">${countSett.currentNumber}</span></div>
          <div class="info-row"><span class="info-lbl">Szerver rekord</span><span class="info-val">${countSett.record}</span></div>
        </div>

        <div class="cat-label">⚠️ Aktív Figyelmeztetések (${totalWarns} db)</div>
        <div class="info-box">
          ${warnRows}
        </div>
      </div>
    </div>`;

  res.send(res.locals.page({ title: `${guildName} – Beállítások`, body, user, currentPath: `/manage/${guildId}` }));
});

router.post("/manage/:guildId", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/auth/discord");
  if (!validCsrf(req)) return res.status(403).send("Érvénytelen űrlap. Frissítsd az oldalt.");

  const { guildId } = req.params;
  const user = req.user;
  const guild = (user.guilds || []).find((g) => g.id === guildId && hasAdminPerms(g));

  if (!(await canManageGuild(user, guildId))) return res.status(403).send("Nincs jogosultságod.");

  const payload = {
    invite: { enabled: req.body.invitefilter === "on" },
    virustotal: {
      enabled: req.body.virustotal === "on",
      threshold: clamp(req.body.vt_threshold, 1, 10),
    },
    profanity: { enabled: req.body.profanity === "on" },
    emoji: {
      enabled: req.body.emojifilter === "on",
      limit: clamp(req.body.emoji_limit, 1, 50),
    },
    logging: {
      enabled: req.body.logging_enabled === "on",
      channel: req.body.logging_channel || null,
      events: {
        moderation: req.body.log_moderation === "on",
        messages: req.body.log_messages === "on",
        members: req.body.log_members === "on",
        voice: req.body.log_voice === "on",
      },
    },
  };

  const result = await updateGuildSettings(guildId, payload);
  if (result?.success) {
    res.redirect(`/manage/${guildId}?success=1`);
  } else {
    res.redirect(`/manage/${guildId}?error=1`);
  }
});

router.get("/admin", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/auth/discord");
  if (!isDev(req.user)) {
    return res.status(403).send(
      res.locals.page({
        title: "Dev Admin – Megtagadva",
        user: req.user,
        body: `<div style="text-align:center;padding:80px 20px"><h2 style="color:var(--danger)">🚫 Csak fejlesztőknek!</h2><p style="color:var(--text-secondary);margin-top:10px">Ez az oldal kizárólag a Dunkelmann bot fejlesztőinek (Dunkelmann &amp; aø.) érhető el.</p></div>`,
      }),
    );
  }

  const sys = await getSysInfo();
  const allGuilds = await getBotGuildsDetails();
  const stats = await getBotStats();

  const totalMembers = allGuilds.reduce((a, g) => a + (g.memberCount || 0), 0);

  const guildCards = allGuilds
    .map((g) => {
      const iconHtml = g.icon
        ? `<img src="${esc(g.icon)}" class="admin-guild-icon" alt="" data-fallback="https://cdn.discordapp.com/embed/avatars/0.png">`
        : `<div class="admin-guild-icon guild-initials">${esc(g.name.slice(0, 2))}</div>`;

      return `
      <div class="admin-guild-card">
        ${iconHtml}
        <div style="flex:1;min-width:0">
          <div class="admin-guild-name">${esc(g.name)}</div>
          <div class="admin-guild-meta">👥 ${g.memberCount} tag &nbsp;|&nbsp; ID: <code>${g.id}</code></div>
        </div>
        <a href="/manage/${g.id}" class="btn btn-sm">Vezérlés &rarr;</a>
      </div>`;
    })
    .join("");

  const sysHtml = sys
    ? `
    <div class="sys-grid">
      <div class="sys-card"><div class="sys-label">Platform / OS</div><div class="sys-value">${esc(sys.platform)}</div></div>
      <div class="sys-card"><div class="sys-label">Framework</div><div class="sys-value">${esc(sys.framework || "Sapphire Framework (TS)")}</div></div>
      <div class="sys-card"><div class="sys-label">CPU Magok</div><div class="sys-value">${esc(sys.cpu.slice(0, 28))} (${sys.cpuCores} mag)</div></div>
      <div class="sys-card"><div class="sys-label">Rendszer RAM</div><div class="sys-value">${Math.round(sys.usedMemory / 1024 / 1024)}MB / ${Math.round(sys.totalMemory / 1024 / 1024)}MB</div></div>
      <div class="sys-card"><div class="sys-label">Bot Heap RAM</div><div class="sys-value">${Math.round(sys.heapUsed / 1024 / 1024)}MB</div></div>
      <div class="sys-card"><div class="sys-label">Node.js Verzió</div><div class="sys-value">${esc(sys.nodeVersion)}</div></div>
      <div class="sys-card"><div class="sys-label">API Válaszidő</div><div class="sys-value">${sys.apiPing != null ? sys.apiPing + "ms" : "N/A"}</div></div>
      <div class="sys-card"><div class="sys-label">Fejlesztési Mód</div><div class="sys-value">🔄 Rolling Release (HU)</div></div>
    </div>`
    : `<div class="alert alert-err">Nem sikerült lekérni a rendszerinfókat.</div>`;

  const body = `
    <div class="admin-header">
      <div>
        <h1>👨‍💻 Dev Admin Vezérlőpult</h1>
        <p style="color:var(--text-secondary);font-size:0.9rem;margin-top:4px">Teljes hozzáférés a hálózathoz (Fejlesztők: Dunkelmann &amp; aø. 🇭🇺).</p>
      </div>
      <span class="badge badge-on" style="font-size:0.85rem;padding:6px 14px">⚡ SuperAdmin &amp; Sapphire TS</span>
    </div>

    <div class="admin-stats">
      <div class="admin-stat"><div class="admin-stat-num">${allGuilds.length}</div><div class="admin-stat-lbl">Összes Szerver</div></div>
      <div class="admin-stat"><div class="admin-stat-num">${totalMembers.toLocaleString("hu")}</div><div class="admin-stat-lbl">Összes Tag</div></div>
      <div class="admin-stat"><div class="admin-stat-num">${stats.ping ?? "?"}ms</div><div class="admin-stat-lbl">Discord Ping</div></div>
      <div class="admin-stat"><div class="admin-stat-num">${COMMANDS_DATA.reduce((a,c)=>a+c.cmds.length,0)}</div><div class="admin-stat-lbl">Parancsok</div></div>
    </div>

    <div class="cat-label">🖥️ Rendszer &amp; Host Státusz (Node.js Pterodactyl)</div>
    ${sysHtml}

    <div class="cat-label">🌐 Összes Szerver Kezelése (${allGuilds.length})</div>
    <input type="text" class="admin-search" placeholder="🔍 Keresés szerver név vagy ID alapján..." data-filter="servers">

    <div class="admin-guild-list">
      ${guildCards}
    </div>`;

  res.send(res.locals.page({ title: "Dev Admin Panel", body, user: req.user, currentPath: "/admin" }));
});

router.get("/auth/discord", (req, res) => {
  if (!config.CLIENT_ID || !config.CLIENT_SECRET) {
    return res.redirect("/?error=auth");
  }
  passport.authenticate("discord")(req, res);
});

router.get(
  "/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/?error=auth" }),
  (req, res) => res.redirect("/dashboard"),
);

router.get("/logout", (req, res) => res.redirect("/dashboard"));
router.post("/logout", (req, res, next) => {
  if (!validCsrf(req)) return res.status(403).send("Érvénytelen kérés.");
  req.logout((error) => {
    if (error) return next(error);
    req.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError);
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
});

router.get("/invite", (req, res) =>
  res.redirect(
    `https://discord.com/oauth2/authorize?client_id=${config.CLIENT_ID}&permissions=8&scope=bot%20applications.commands`,
  ),
);

module.exports = router;
