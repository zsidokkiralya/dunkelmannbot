const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");
const { cv2Reply, sendCv2 } = require("../utils/embedBuilder");
const dm = require("../utils/dataManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("counting")
    .setDescription("Számolós játék beállítása")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Számolós csatorna beállítása")
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("A csatorna")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("reset").setDescription("Számolás visszaállítása 0-ra"),
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Jelenlegi állapot megtekintése"),
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Számolós játék kikapcsolása"),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = dm.getCountingSettings(interaction.guild.id);

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel");
      settings.enabled = true;
      settings.channelId = channel.id;
      settings.currentNumber = 0;
      settings.lastUser = null;
      dm.saveCountingSettings(interaction.guild.id, settings);

      await interaction.reply(
        cv2Reply({
          title: "✅ Számolós játék beállítva",
          description: `**Csatorna:** ${channel}\n**Kezdő szám:** 0`,
        }),
      );

      await sendCv2(channel, {
        title: "🔢 Számolós játék",
        description: "Kezdjük a számolást! Első szám: **1**",
      });
    } else if (sub === "reset") {
      settings.currentNumber = 0;
      settings.lastUser = null;
      dm.saveCountingSettings(interaction.guild.id, settings);

      await interaction.reply(
        cv2Reply({
          title: "🔄 Visszaállítva",
          description: "A számolás újraindul **1**-től.",
        }),
      );

      if (settings.channelId) {
        const ch = interaction.guild.channels.cache.get(settings.channelId);
        if (ch) {
          await sendCv2(ch, {
            description:
              "🔄 A számolás visszaállítva **0**-ra. Következő szám: **1**",
          });
        }
      }
    } else if (sub === "status") {
      await interaction.reply(
        cv2Reply({
          title: "🔢 Számolós játék – Státusz",
          description: [
            `**Állapot:** ${settings.enabled ? "✅ Aktív" : "❌ Inaktív"}`,
            `**Jelenlegi szám:** \`${settings.currentNumber}\``,
            `**Rekord:** \`${settings.record}\``,
            settings.channelId
              ? `**Csatorna:** <#${settings.channelId}>`
              : null,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      );
    } else if (sub === "disable") {
      settings.enabled = false;
      dm.saveCountingSettings(interaction.guild.id, settings);

      await interaction.reply(
        cv2Reply({
          title: "❌ Számolós játék kikapcsolva",
          description: "A számolós játék le lett tiltva ezen a szerveren.",
        }),
      );
    }
  },
};
