const express = require("express");
const { timingSafeEqual } = require("node:crypto");
const { Buffer } = require("node:buffer");
const { PermissionFlagsBits } = require("discord.js");
const config = require("../config");
const dm = require("./utils/dataManager");

const isId = (value) => typeof value === "string" && /^\d{17,20}$/.test(value);

class ValidationError extends Error {
  statusCode = 400;
}

function object(value, allowed) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).some((key) => !allowed.includes(key))) {
    throw new ValidationError("Érvénytelen vagy ismeretlen beállítás.");
  }
}

function boolean(value) {
  if (typeof value !== "boolean") throw new ValidationError("Logikai érték szükséges.");
  return value;
}

function integer(value, min, max) {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new ValidationError(`Egész szám szükséges (${min}–${max}).`);
  return value;
}

function createBotApi(client) {
  const app = express();
  app.disable("x-powered-by");
  // Authenticate before parsing JSON. Missing keys must fail closed, too.
  app.use((req, res, next) => {
    const supplied = req.headers["x-bot-api-key"];
    const expected = config.BOT_API_SECRET;
    if (typeof supplied !== "string" || typeof expected !== "string" || !expected) {
      return res.status(401).json({ error: "Jogosulatlan kérés." });
    }
    const left = Buffer.from(supplied);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right))
      return res.status(401).json({ error: "Jogosulatlan kérés." });
    next();
  });
  app.use(express.json({ limit: "16kb", strict: true }));
  app.use("/api/bot/guild/:id", (req, res, next) => {
    if (!isId(req.params.id)) return res.status(400).json({ error: "Hibás szerverazonosító." });
    if (!client?.isReady?.()) return res.status(503).json({ error: "Bot offline." });
    req.botGuild = client.guilds.cache.get(req.params.id);
    if (!req.botGuild) return res.status(404).json({ error: "Szerver nem található." });
    next();
  });

  const guildInfo = (guild) => ({
    id: guild.id, name: guild.name, memberCount: guild.memberCount, ownerId: guild.ownerId,
    icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=128` : null,
  });

  app.get("/api/bot/status", (req, res) => {
    const online = !!client?.isReady?.();
    res.json({
      online,
      guilds: online ? client.guilds.cache.size : 0,
      users: online ? client.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0) : 0,
      ping: online ? Math.round(client.ws.ping) : null,
      uptime: Math.floor(process.uptime()),
      framework: "Sapphire Framework (TypeScript)",
    });
  });
  app.get("/api/bot/guilds", (req, res) =>
    res.json(client?.isReady?.() ? [...client.guilds.cache.keys()] : []));
  app.get("/api/bot/guilds/details", (req, res) => {
    const guilds = client?.isReady?.() ? [...client.guilds.cache.values()].map(guildInfo) : [];
    res.json(guilds.sort((a, b) => b.memberCount - a.memberCount));
  });
  app.get("/api/bot/guild/:id", (req, res) => res.json(guildInfo(req.botGuild)));
  app.get("/api/bot/guild/:id/channels", (req, res) => res.json(
    [...req.botGuild.channels.cache.values()].filter((channel) => channel.type === 0)
      .map((channel) => ({ id: channel.id, name: channel.name, position: channel.position }))
      .sort((a, b) => a.position - b.position),
  ));

  // Fetch current membership rather than trusting an OAuth snapshot from login.
  app.get("/api/bot/guild/:id/access/:userId", async (req, res, next) => {
    if (!isId(req.params.userId)) return res.status(400).json({ error: "Hibás felhasználóazonosító." });
    try {
      const member = await req.botGuild.members.fetch({ user: req.params.userId, force: true });
      res.json({ allowed: member.permissions.has(PermissionFlagsBits.ManageGuild) });
    } catch (error) {
      if (error.code === 10007 || error.status === 404) return res.json({ allowed: false });
      next(error);
    }
  });

  app.get("/api/bot/guild/:id/settings", (req, res) => res.json({
    invite: dm.getInviteSettings(req.params.id),
    virustotal: dm.getVTSettings(req.params.id),
    profanity: dm.getProfanitySettings(req.params.id),
    emoji: dm.getEmojiSettings(req.params.id),
    counting: dm.getCountingSettings(req.params.id),
    logging: dm.getLogSettings(req.params.id),
  }));

  app.post("/api/bot/guild/:id/settings", (req, res) => {
    const guildId = req.params.id;
    const body = req.body;
    object(body, ["invite", "virustotal", "profanity", "emoji", "logging"]);
    const pending = [];
    function update(key, getter, saver, allowed, validate) {
      if (body[key] === undefined) return;
      object(body[key], allowed);
      const value = getter(guildId);
      if (body[key].enabled !== undefined) value.enabled = boolean(body[key].enabled);
      validate?.(value, body[key]);
      pending.push(() => {
        if (saver(guildId, value) === false) throw new Error("A beállítás mentése sikertelen.");
      });
    }
    update("invite", dm.getInviteSettings, dm.saveInviteSettings, ["enabled"], undefined);
    update("virustotal", dm.getVTSettings, dm.saveVTSettings, ["enabled", "threshold"], (value, input) => {
      if (input.threshold !== undefined) value.threshold = integer(input.threshold, 1, 10);
    });
    update("profanity", dm.getProfanitySettings, dm.saveProfanitySettings, ["enabled"], undefined);
    update("emoji", dm.getEmojiSettings, dm.saveEmojiSettings, ["enabled", "limit"], (value, input) => {
      if (input.limit !== undefined) value.limit = integer(input.limit, 1, 50);
    });
    update("logging", dm.getLogSettings, dm.saveLogSettings, ["enabled", "channel", "events"], (value, input) => {
      if (input.channel !== undefined) {
        if (input.channel !== null && (!isId(input.channel) ||
            !req.botGuild.channels.cache.get(input.channel)?.isTextBased?.())) {
          throw new ValidationError("A naplócsatorna nem ennek a szervernek a szöveges csatornája.");
        }
        value.channel = input.channel;
      }
      if (input.events !== undefined) {
        object(input.events, ["moderation", "messages", "members", "voice"]);
        value.events = { ...value.events };
        for (const [key, enabled] of Object.entries(input.events)) value.events[key] = boolean(enabled);
      }
      if (value.enabled && !value.channel) throw new ValidationError("Válassz naplócsatornát.");
    });
    // Validate the entire payload before performing any write.
    for (const save of pending) save();
    res.json({ success: true });
  });
  app.get("/api/bot/guild/:id/warnings", (req, res) => {
    const result = {};
    for (const [id, warnings] of Object.entries(dm.getGuildWarnings(req.params.id))) {
      result[id] = { username: client.users.cache.get(id)?.username || id, warnings };
    }
    res.json(result);
  });
  app.get("/api/bot/devs", (req, res) => res.json(config.DEV_IDS.map((id) => {
    const user = client?.users.cache.get(id);
    return {
      id, username: user?.username || id,
      avatar: user?.displayAvatarURL?.({ size: 128 }) || "https://cdn.discordapp.com/embed/avatars/0.png",
    };
  })));
  app.get("/api/bot/sysinfo", (req, res) => {
    const os = require("node:os");
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    res.json({
      platform: `${os.platform()} ${os.arch()}`, osType: `${os.type()} ${os.release()}`,
      cpu: os.cpus()[0]?.model || "N/A", cpuCores: os.cpus().length,
      totalMemory, freeMemory, usedMemory: totalMemory - freeMemory,
      heapUsed: process.memoryUsage().heapUsed, rss: process.memoryUsage().rss,
      nodeVersion: process.version, systemUptime: Math.floor(os.uptime()),
      botUptime: Math.floor(process.uptime()), apiPing: client?.ws?.ping ?? null,
      framework: "Sapphire Framework (TypeScript)",
    });
  });
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.statusCode || error.status || 500;
    if (status >= 500) console.error("[botApi]", error.message);
    res.status(status).json({ error: status < 500 ? error.message : "Belső API-hiba." });
  });
  return app;
}

function startBotApi(client) {
  return createBotApi(client).listen(config.BOT_API_PORT, "127.0.0.1", () => {
    console.log(`🔌 Bot API fut: 127.0.0.1:${config.BOT_API_PORT}`);
  });
}

module.exports = { createBotApi, startBotApi };
