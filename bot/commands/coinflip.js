const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { cv2Reply } = require("../utils/embedBuilder");

function buildFlipPayload() {
  const fej = Math.random() < 0.5;
  return cv2Reply({
    title: "🪙 Pénzfeldobás",
    description: `## Eredmény: **${fej ? "🪙 Fej" : "✍️ Írás"}**`,
    actionRows: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("coinflip_again")
          .setLabel("Újra!")
          .setEmoji("🔄")
          .setStyle(ButtonStyle.Secondary),
      ),
    ],
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Dob egy érmét – fej vagy írás?"),

  async execute(interaction) {
    await interaction.reply(buildFlipPayload());
  },

  buildFlipPayload,
};
