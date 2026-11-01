const { SlashCommandBuilder } = require("discord.js");
const { cv2Reply, cv2DeferOptions, safeEdit } = require("../utils/embedBuilder");
const os = require("os");

function formatBytes(b) {
  if (b === 0) return "0 B";
  const k = 1024,
    s = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
}

function formatUptime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${h}ó ${m}p ${sec}mp`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Bot és szerver statisztikák"),

  async execute(interaction, client) {
    await interaction.deferReply(cv2DeferOptions());

    const totalUsers = client.guilds.cache.reduce(
      (a, g) => a + g.memberCount,
      0,
    );
    const uptime = process.uptime();
    const memUsed = process.memoryUsage().heapUsed;
    const memTotal = os.totalmem();
    const cpuModel = os.cpus()[0]?.model ?? "N/A";

    const lines = [
      `🤖 **Bot**`,
      `Szerverek: \`${client.guilds.cache.size}\` | Tagok: \`${totalUsers}\``,
      `Ping: \`${Math.round(client.ws.ping)}ms\``,
      ``,
      `🖥️ **Rendszer**`,
      `RAM: \`${formatBytes(memUsed)} / ${formatBytes(memTotal)}\``,
      `CPU: \`${cpuModel}\``,
      `Uptime: \`${formatUptime(uptime)}\``,
      `Node.js: \`${process.version}\``,
    ].join("\n");

    await safeEdit(
      interaction,
      cv2Reply({
        title: "📊 Bot Statisztikák",
        description: lines,
      }),
    );
  },
};
