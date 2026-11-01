const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { cv2Reply } = require("../utils/embedBuilder");
const dm = require("../utils/dataManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("emojifilter")
    .setDescription("Emoji limit szűrő beállítása")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addBooleanOption((o) =>
      o.setName("enabled").setDescription("Be/ki").setRequired(true),
    )
    .addIntegerOption((o) =>
      o
        .setName("limit")
        .setDescription("Maximum emoji száma üzenetenként (1–50)")
        .setMinValue(1)
        .setMaxValue(50)
        .setRequired(false),
    ),

  async execute(interaction) {
    const enabled = interaction.options.getBoolean("enabled");
    const limit =
      interaction.options.getInteger("limit") ??
      dm.getEmojiSettings(interaction.guild.id).limit ??
      5;

    dm.saveEmojiSettings(interaction.guild.id, { enabled, limit });

    await interaction.reply(
      cv2Reply(
        {
          title: "😀 Emoji szűrő frissítve",
          description: `**Állapot:** ${enabled ? "✅ Bekapcsolva" : "❌ Kikapcsolva"}\n**Limit:** \`${limit} emoji / üzenet\``,
          isSuccess: enabled,
          isError: !enabled,
        },
      ),
    );
  },
};
