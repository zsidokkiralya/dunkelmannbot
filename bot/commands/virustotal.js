const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { cv2Reply } = require("../utils/embedBuilder");
const dm = require("../utils/dataManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("virustotal")
    .setDescription("VirusTotal link-védelem beállítása")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("toggle")
        .setDescription("Védelem be/kikapcsolása")
        .addBooleanOption((o) =>
          o.setName("enabled").setDescription("Állapot").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("threshold")
        .setDescription("Törlési érzékenység beállítása")
        .addIntegerOption((o) =>
          o
            .setName("value")
            .setDescription("Hány detekciónál töröljön? (1–10)")
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Jelenlegi beállítások"),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = dm.getVTSettings(interaction.guild.id);

    if (sub === "toggle") {
      settings.enabled = interaction.options.getBoolean("enabled");
      dm.saveVTSettings(interaction.guild.id, settings);

      await interaction.reply(
        cv2Reply(
          {
            title: "🛡️ VirusTotal védelem frissítve",
            description: `**Állapot:** ${settings.enabled ? "✅ Be" : "❌ Ki"}\n**Küszöbérték:** \`${settings.threshold} detekció\``,
            isSuccess: settings.enabled,
            isError: !settings.enabled,
          },
        ),
      );
    } else if (sub === "threshold") {
      settings.threshold = interaction.options.getInteger("value");
      dm.saveVTSettings(interaction.guild.id, settings);

      await interaction.reply(
        cv2Reply(
          {
            title: "⚙️ Érzékenység frissítve",
            description: `Törlési küszöb: \`${settings.threshold} detekció\``,
            isSuccess: true,
          },
        ),
      );
    } else {
      await interaction.reply(
        cv2Reply(
          {
            title: "🛡️ VirusTotal – Státusz",
            description: [
              `**Állapot:** ${settings.enabled ? "✅ Be" : "❌ Ki"}`,
              `**Küszöbérték:** \`${settings.threshold} detekció\``,
              `**API kulcs:** ${process.env.VIRUSTOTAL_API_KEY ? "✅ Beállítva" : "❌ Nincs beállítva"}`,
            ].join("\n"),
          },
        ),
      );
    }
  },
};
