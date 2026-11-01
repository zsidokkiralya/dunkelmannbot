const { SlashCommandBuilder } = require("discord.js");
const { cv2Reply, cv2DeferOptions, safeEdit } = require("../utils/embedBuilder");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("whois")
    .setDescription("Domain WHOIS adatok (regisztráció, lejárat)")
    .addStringOption((o) =>
      o
        .setName("domain")
        .setDescription("Domain név (pl. example.com)")
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply(cv2DeferOptions());

    const raw = interaction.options.getString("domain").toLowerCase();
    const domain = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    if (!domain.includes(".")) {
      return safeEdit(
        interaction,
        cv2Reply({ description: "❌ Rossz domain formátum!" }),
      );
    }

    try {
      const res = await axios.get(`https://rdap.org/domain/${domain}`, {
        timeout: 8000,
      });
      const events = res.data.events ?? [];

      const find = (action) => {
        const e = events.find((ev) => ev.eventAction === action);
        return e ? Math.floor(new Date(e.eventDate).getTime() / 1000) : null;
      };

      const regTs = find("registration");
      const expTs = find("expiration");
      const updTs = find("last changed");

      const lines = [
        `🌐 **Domain:** \`${domain}\``,
        `📅 **Regisztrálva:** ${regTs ? `<t:${regTs}:D>` : "Ismeretlen"}`,
        `⏳ **Lejár:** ${expTs ? `<t:${expTs}:D> (<t:${expTs}:R>)` : "Ismeretlen"}`,
        updTs ? `🔄 **Utoljára módosítva:** <t:${updTs}:D>` : null,
      ]
        .filter(Boolean)
        .join("\n");

      await safeEdit(
        interaction,
        cv2Reply({
          title: `🔍 WHOIS: ${domain}`,
          description: lines,
          footer: "rdap.org",
        }),
      );
    } catch (err) {
      const status = err.response?.status;
      const msg =
        status === 404
          ? `❌ A **${domain}** domain nem található vagy nincs nyilvános RDAP adata.`
          : `❌ Nem sikerült lekérni a WHOIS adatokat! (${status ?? "időtúllépés"})`;
      await safeEdit(interaction, cv2Reply({ description: msg }));
    }
  },
};
