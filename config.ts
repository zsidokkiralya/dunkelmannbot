const path = require("path");
const fs = require("fs");
const { randomBytes } = require("crypto");

const PROJECT_ROOT = fs.existsSync(path.join(__dirname, "package.json"))
  ? __dirname
  : path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(PROJECT_ROOT, ".env"), quiet: true });

function port(value, fallback, name) {
  const number = value === undefined || value === "" ? fallback : Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 65535) {
    throw new Error(`${name}: 1 és 65535 közötti portot adj meg.`);
  }
  return number;
}

const WEB_PORT = port(process.env.PORT, 3000, "PORT");
const BOT_API_PORT = port(process.env.BOT_API_PORT, WEB_PORT === 20022 ? 20023 : 20022, "BOT_API_PORT");
if (WEB_PORT === BOT_API_PORT) throw new Error("A web és a belső API portja nem lehet azonos.");
const BASE_URL = new URL(process.env.BASE_URL || `http://localhost:${WEB_PORT}`);
if (!["http:", "https:"].includes(BASE_URL.protocol) || BASE_URL.username || BASE_URL.password) {
  throw new Error("BASE_URL: érvényes HTTP(S) webcímet adj meg.");
}

module.exports = {
  PROJECT_ROOT,
  DATA_DIR: path.resolve(PROJECT_ROOT, process.env.DATA_DIR || "data"),
  BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  CLIENT_ID: process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,

  WEB_PORT,
  SESSION_SECRET: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
  BASE_URL: BASE_URL.origin,
  SECURE_COOKIES: BASE_URL.protocol === "https:",
  TRUST_PROXY: process.env.TRUST_PROXY === undefined
    ? (BASE_URL.protocol === "https:" ? 1 : false)
    : (process.env.TRUST_PROXY === "true" ? 1 : false),

  BEATCLOUD_API_KEY: process.env.BEATCLOUD_API_KEY,
  BEATCLOUD_ALLOWED_HOSTS: (process.env.BEATCLOUD_ALLOWED_HOSTS || "")
    .split(",").map((host) => host.trim().toLowerCase()).filter(Boolean),
  BOT_API_PORT,
  // Both services share this module in the supported single-process deployment.
  BOT_API_SECRET: process.env.BOT_API_SECRET || randomBytes(32).toString("hex"),

  DEV_IDS: (process.env.DEV_IDS || "1212864602140971008,888072261846859806")
    .split(",")
    .map((s) => s.trim()).filter((s) => /^\d{17,20}$/.test(s)),

  FEATURES: {
    WEB: true,
    DASHBOARD: true,
    VOICE: true,
    MODERATION: true,
    LOGGING: true,
    SECURITY: true,
  },
};

