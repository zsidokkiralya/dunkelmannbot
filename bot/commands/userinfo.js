const { SlashCommandBuilder } = require("discord.js");
const { cv2Reply, cv2DeferOptions, safeEdit } = require("../utils/embedBuilder");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Megnézed egy user adatait")
    .addUserOption((o) =>
      o
        .setName("user")
        .setDescription("Kinek a profilját? (ha kihagyod, te leszel)")
        .setRequired(false),
    ),

  async execute(interaction) {
    await interaction.deferReply(cv2DeferOptions());

    const target = interaction.options.getUser("user") || interaction.user;
    const member = interaction.guild
      ? await interaction.guild.members.fetch(target.id).catch(() => null)
      : null;

    const createdTs = Math.floor(target.createdTimestamp / 1000);
    const joinedTs = member ? Math.floor(member.joinedTimestamp / 1000) : null;

    const roles = member
      ? member.roles.cache
          .filter((r) => r.id !== interaction.guild.id)
          .sort((a, b) => b.position - a.position)
          .map((r) => r.toString())
          .slice(0, 8)
          .join(", ") || "Nincs rang"
      : "N/A";

    const lines = [
      `🆔 **ID:** \`${target.id}\``,
      `📅 **Fiók létrehozva:** <t:${createdTs}:D> (<t:${createdTs}:R>)`,
      joinedTs
        ? `📥 **Csatlakozott:** <t:${joinedTs}:D> (<t:${joinedTs}:R>)`
        : null,
      `🤖 **Bot:** ${target.bot ? "Igen" : "Nem"}`,
      member ? `🎭 **Rangok:** ${roles}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    await safeEdit(
      interaction,
      cv2Reply({
        title: target.username,
        thumbnailUrl: target.displayAvatarURL({ size: 256 }),
        description: lines,
        footer: "Felhasználói adatok",
      }),
    );
  },
};
