const { randomBytes, timingSafeEqual } = require("node:crypto");
const { Buffer } = require("node:buffer");
const axios = require("axios");
const config = require("../config");

function csrfToken(req) {
  if (!req.session.csrfToken) req.session.csrfToken = randomBytes(32).toString("hex");
  return req.session.csrfToken;
}

function validCsrf(req) {
  const supplied = req.body?._csrf;
  const expected = req.session?.csrfToken;
  if (typeof supplied !== "string" || typeof expected !== "string") return false;
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function canManageGuild(user, guildId) {
  if (!user || !/^\d{17,20}$/.test(guildId) || !/^\d{17,20}$/.test(user.id)) return false;
  if (config.DEV_IDS.includes(user.id)) return true;
  try {
    const response = await axios.get(
      `http://127.0.0.1:${config.BOT_API_PORT}/api/bot/guild/${guildId}/access/${user.id}`,
      { timeout: 5000, headers: { "x-bot-api-key": config.BOT_API_SECRET } },
    );
    return response.data?.allowed === true;
  } catch {
    return false;
  }
}

module.exports = { csrfToken, validCsrf, canManageGuild };
