const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { cv2Reply } = require("../utils/embedBuilder");
const dm = require("../utils/dataManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invitefilter")
    .setDescription("Discord invite szűrő beállítása")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) =>
      sub
        .setName("toggle")
        .setDescription("Szűrő be/kikapcsolása")
        .addBooleanOption((o) =>
          o.setName("enabled").setDescription("Állapot").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Jelenlegi állapot megtekintése"),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = dm.getInviteSettings(interaction.guild.id);

    if (sub === "toggle") {
      settings.enabled = interaction.options.getBoolean("enabled");
      dm.saveInviteSettings(interaction.guild.id, settings);

      await interaction.reply(
        cv2Reply(
          {
            title: "🔗 Invite szűrő frissítve",
            description: `**Állapot:** ${settings.enabled ? "✅ Bekapcsolva" : "❌ Kikapcsolva"}`,
            isSuccess: settings.enabled,
            isError: !settings.enabled,
          },
        ),
      );
    } else {
      await interaction.reply(
        cv2Reply(
          {
            title: "🔗 Invite szűrő – Státusz",
            description: `**Állapot:** ${settings.enabled ? "✅ Bekapcsolva" : "❌ Kikapcsolva"}`,
          },
        ),
      );
    }
  },
};
