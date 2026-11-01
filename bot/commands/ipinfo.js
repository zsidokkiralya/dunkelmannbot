const { SlashCommandBuilder } = require("discord.js");
const { cv2Reply, cv2DeferOptions, safeEdit, safeReply } = require("../utils/embedBuilder");
const axios = require("axios");

const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$|^[a-f0-9:]+$/i;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ipinfo")
    .setDescription("IP cím adatok és VPN ellenőrzés")
    .addStringOption((o) =>
      o.setName("ip").setDescription("IP cím").setRequired(true),
    ),

  async execute(interaction) {
    const ip = interaction.options.getString("ip").trim();

    if (!IP_REGEX.test(ip)) {
      return safeReply(
        interaction,
        cv2Reply({ description: "❌ Rossz IP cím formátum!" }),
      );
    }

    await interaction.deferReply(cv2DeferOptions());

    try {
      const res = await axios.get(
        `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,isp,org,proxy,hosting,query`,
        { timeout: 8000 },
      );

      if (res.data.status === "fail") {
        return safeEdit(
          interaction,
          cv2Reply({ description: `❌ Hiba: **${res.data.message}**` }),
        );
      }

      const d = res.data;
      const vpnFlag = d.proxy || d.hosting ? "⚠️ **IGEN**" : "✅ **NEM**";

      const lines = [
        `🌐 **IP:** \`${d.query}\``,
        `📍 **Hely:** ${d.country ?? "N/A"}, ${d.regionName ?? ""}, ${d.city ?? ""}`
          .trimEnd()
          .replace(/,\s*$/, ""),
        `🏢 **ISP:** ${d.isp ?? "Ismeretlen"}`,
        `🏷️ **Org:** ${d.org ?? "Ismeretlen"}`,
        `🔒 **VPN/Proxy/Hosting:** ${vpnFlag}`,
      ].join("\n");

      await safeEdit(
        interaction,
        cv2Reply({
          title: "🔍 IP Információk",
          description: lines,
          footer: "ip-api.com",
        }),
      );
    } catch (err) {
      console.error("IP info hiba:", err.message);
      await safeEdit(
        interaction,
        cv2Reply({ description: "❌ Hiba az IP lekérdezésekor!" }),
      );
    }
  },
};
