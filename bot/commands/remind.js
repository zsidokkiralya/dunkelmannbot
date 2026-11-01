const { SlashCommandBuilder } = require("discord.js");
const { cv2Reply } = require("../utils/embedBuilder");
const { scheduleReminder } = require("../utils/reminderManager");
const { randomUUID } = require("node:crypto");

const MAX_MINUTES = 43200;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remind")
    .setDescription("Beállítok neked egy emlékeztetőt")
    .addIntegerOption((o) =>
      o
        .setName("minutes")
        .setDescription("Hány perc múlva szóljak? (1–43200)")
        .setMinValue(1)
        .setMaxValue(MAX_MINUTES)
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("message").setDescription("Mit írjak ki?").setRequired(true).setMaxLength(1800),
    ),

  async execute(interaction) {
    const minutes = interaction.options.getInteger("minutes");
    const message = interaction.options.getString("message");

    const timestamp = Date.now() + minutes * 60 * 1000;
    const id = randomUUID();

    scheduleReminder(interaction.client, {
      id,
      userId: interaction.user.id,
      channelId: interaction.channel.id,
      message,
      timestamp,
    });

    const hrs = Math.floor(minutes / 60);
    const min = minutes % 60;
    const durationStr = hrs > 0 ? `${hrs} óra ${min} perc` : `${min} perc`;

    await interaction.reply(
      cv2Reply(
        {
          title: "⏰ Megvan!",
          description: `**${durationStr}** múlva emlékeztetlek:\n> ${message}\n\n<t:${Math.floor(timestamp / 1000)}:R>`,
          isSuccess: true,
          footer: "Emlékeztető",
        },
      ),
    );
  },
};
