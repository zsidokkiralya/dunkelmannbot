const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { cv2Reply, cv2DeferOptions, safeReply, sendCv2 } = require("../utils/embedBuilder");

module.exports = {
  data: new SlashCommandBuilder().setName("say").setDescription("Üzenetet küld a bot nevében")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((option) => option.setName("message").setDescription("Az elküldendő szöveg")
      .setRequired(true).setMaxLength(3500)),
  async execute(interaction) {
    const text = interaction.options.getString("message");
    if (!text || text.length > 3500)
      return safeReply(interaction, cv2Reply({ description: "❌ Az üzenet 1–3500 karakter lehet." }, true));
    await interaction.deferReply(cv2DeferOptions(true));
    const sent = await sendCv2(interaction.channel, { description: text, footer: "Dunkelmann" });
    return safeReply(interaction, cv2Reply({
      description: sent ? "✅ Üzenet elküldve." : "❌ Az üzenetet nem sikerült elküldeni.",
    }, true));
  },
};
