const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { cv2Message } = require("../utils/embedBuilder");
const { createGiveaway } = require("../utils/giveawayManager");

module.exports = {
  data: new SlashCommandBuilder().setName("giveaway").setDescription("Nyereményjáték indítása")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addStringOption((option) => option.setName("prize").setDescription("A nyeremény").setRequired(true).setMaxLength(500))
    .addIntegerOption((option) => option.setName("duration").setDescription("Hossz percben").setMinValue(1).setMaxValue(10080).setRequired(true))
    .addIntegerOption((option) => option.setName("winners").setDescription("Nyertesek száma").setMinValue(1).setMaxValue(10)),
  async execute(interaction, client) {
    const prize = interaction.options.getString("prize");
    const endAt = Date.now() + interaction.options.getInteger("duration") * 60000;
    const winners = interaction.options.getInteger("winners") || 1;
    await interaction.reply(cv2Message({
      title: "🎉 NYEREMÉNYJÁTÉK 🎉",
      description: `Nyeremény: **${prize}**\nReagálj 🎉 emojival a részvételhez!\nVége: <t:${Math.floor(endAt / 1000)}:R>\nNyertesek: ${winners}`,
      footer: `Szervező: ${interaction.user.username}`,
    }));
    const message = await interaction.fetchReply();
    try {
      createGiveaway(client, {
        guildId: interaction.guild.id, channelId: interaction.channel.id,
        messageId: message.id, prize, endAt, winners,
      });
    } catch (error) {
      await message.edit(cv2Message({ title: "❌ A nyereményjáték nem indult el", description: "A mentés sikertelen. Próbáld meg később." }));
      throw error;
    }
    await message.react("🎉").catch((error) => console.error("[giveaway] Kezdő reakció:", error.code));
  },
};
