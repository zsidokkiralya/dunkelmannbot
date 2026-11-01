const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { cv2Reply } = require("../utils/embedBuilder");
const dm = require("../utils/dataManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profanity")
    .setDescription("Káromkodás szűrő kezelése")
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
      sub
        .setName("add")
        .setDescription("Szó hozzáadása a feketelistához")
        .addStringOption((o) =>
          o.setName("word").setDescription("A szó").setRequired(true).setMaxLength(100),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Szó eltávolítása a feketelistáról")
        .addStringOption((o) =>
          o.setName("word").setDescription("A szó").setRequired(true).setMaxLength(100),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("Feketelistás szavak megtekintése"),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = dm.getProfanitySettings(interaction.guild.id);

    if (sub === "toggle") {
      settings.enabled = interaction.options.getBoolean("enabled");
      dm.saveProfanitySettings(interaction.guild.id, settings);

      await interaction.reply(
        cv2Reply(
          {
            title: "🤐 Káromkodás szűrő frissítve",
            description: `**Állapot:** ${settings.enabled ? "✅ Bekapcsolva" : "❌ Kikapcsolva"}`,
            isSuccess: settings.enabled,
            isError: !settings.enabled,
          },
        ),
      );
    } else if (sub === "add") {
      const word = interaction.options.getString("word").toLowerCase().trim();

      if (word.length < 2) {
        return interaction.reply(
          cv2Reply(
            {
              description:
                "❌ A szónak legalább 2 karakter hosszúnak kell lennie!",
              isError: true,
            },
          ),
        );
      }

      if (!settings.customWords.includes(word)) {
        if (settings.customWords.length >= 1000) {
          return interaction.reply(cv2Reply({ description: "❌ A tiltólista legfeljebb 1000 kifejezést tartalmazhat." }, true));
        }
        settings.customWords.push(word);
        dm.saveProfanitySettings(interaction.guild.id, settings);
      }

      await interaction.reply(
        cv2Reply(
          {
            title: "✅ Szó hozzáadva",
            description: `\`${word}\` hozzáadva a feketelistához.\n**Összesen:** ${settings.customWords.length} szó`,
            isSuccess: true,
          },
        ),
      );
    } else if (sub === "remove") {
      const word = interaction.options.getString("word").toLowerCase().trim();
      const before = settings.customWords.length;
      settings.customWords = settings.customWords.filter((w) => w !== word);

      if (settings.customWords.length === before) {
        return interaction.reply(
          cv2Reply(
            {
              description: `❌ A \`${word}\` szó nem szerepel a feketelistán!`,
              isError: true,
            },
          ),
        );
      }

      dm.saveProfanitySettings(interaction.guild.id, settings);
      await interaction.reply(
        cv2Reply(
          {
            title: "✅ Szó eltávolítva",
            description: `\`${word}\` törölve a feketelistáról.\n**Összesen:** ${settings.customWords.length} szó`,
            isSuccess: true,
          },
        ),
      );
    } else {
      const list =
        settings.customWords.length > 0
          ? settings.customWords.map((w) => `\`${w}\``).join(", ")
          : "Nincsenek szavak a feketelistán.";

      await interaction.reply(
        cv2Reply(
          {
            title: "📝 Feketelistás szavak",
            description: list,
          },
        ),
      );
    }
  },
};
