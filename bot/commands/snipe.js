const { SlashCommandBuilder } = require("discord.js");
const { cv2Reply } = require("../utils/embedBuilder");
const snipeStore = require("../utils/snipeStore");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("snipe")
    .setDescription("Megmutatom az utoljára törölt üzenetet"),

  async execute(interaction) {
    const data = snipeStore.get(interaction.channel.id);
    if (!data) {
      return interaction.reply(
        cv2Reply({
          description:
            "❌ Nincs mit snipelni — a bot utolsó indítása óta nem töröltek üzenetet.",
        }),
      );
    }

    const deletedTs = Math.floor(data.deletedAt / 1000);
    const bodyLines = [
      `**Szerző:** ${data.authorUsername}`,
      `**Törölve:** <t:${deletedTs}:R>`,
      data.content ? `\n**Üzenet:**\n${data.content.slice(0, 1000)}` : null,
      data.attachments[0] ? `**Melléklet:** ${data.attachments[0]}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    await interaction.reply(
      cv2Reply({
        title: "🔍 Törölt üzenet",
        description: bodyLines,
        thumbnailUrl: data.authorAvatarURL || undefined,
        footer: "Snipe",
      }),
    );
  },
};
