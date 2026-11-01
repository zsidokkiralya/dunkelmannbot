const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");
const {
  buildContainer,
  cv2Reply,
  cv2DeferOptions,
  safeReply,
  safeEdit,
} = require("../utils/embedBuilder");
const dm = require("../utils/dataManager");

const CATEGORIES = ["moderation", "messages", "members", "voice"];
const CATEGORY_LABELS = {
  moderation: "🛡️ Moderáció",
  messages: "💬 Üzenetek",
  members: "👥 Tagok",
  voice: "🔊 Hang",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("log")
    .setDescription("Logging rendszer beállítása")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName("setup")
        .setDescription("Log csatorna beállítása")
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("A csatorna ahova a logok mennek")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("toggle")
        .setDescription("Egy log kategória ki-/bekapcsolása")
        .addStringOption((o) =>
          o
            .setName("category")
            .setDescription("A kategória")
            .setRequired(true)
            .addChoices(
              { name: "🛡️ Moderáció", value: "moderation" },
              { name: "💬 Üzenetek", value: "messages" },
              { name: "👥 Tagok", value: "members" },
              { name: "🔊 Hang", value: "voice" },
            ),
        ),
    )
    .addSubcommand((s) =>
      s.setName("status").setDescription("Jelenlegi logging beállítások"),
    )
    .addSubcommand((s) =>
      s.setName("disable").setDescription("Összes logging kikapcsolása"),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel");
      const settings = dm.getLogSettings(guildId);

      settings.enabled = true;
      settings.channel = channel.id;
      if (!settings.events) {
        settings.events = {
          moderation: true,
          messages: true,
          members: true,
          voice: true,
        };
      }
      dm.saveLogSettings(guildId, settings);

      await safeReply(
        interaction,
        cv2Reply({
          title: "✅ Logging beállítva!",
          description: `A logok mostantól ide mennek: ${channel}\n\nHasználd a \`/log toggle\` parancsot a kategóriák kezeléséhez.`,
          footer: "Logging",
        }),
      );
    } else if (sub === "toggle") {
      const category = interaction.options.getString("category");
      const settings = dm.getLogSettings(guildId);

      if (!settings.events) {
        settings.events = {
          moderation: true,
          messages: true,
          members: true,
          voice: true,
        };
      }

      settings.events[category] = !settings.events[category];
      dm.saveLogSettings(guildId, settings);

      const state = settings.events[category] ? "✅ Bekapcsolva" : "❌ Kikapcsolva";

      await safeReply(
        interaction,
        cv2Reply({
          title: `${CATEGORY_LABELS[category]} – ${state}`,
          description: `A **${category}** log kategória ${settings.events[category] ? "be" : "ki"}kapcsolva.`,
          footer: "Logging",
        }),
      );
    } else if (sub === "status") {
      const settings = dm.getLogSettings(guildId);

      if (!settings.enabled || !settings.channel) {
        return safeReply(
          interaction,
          cv2Reply({
            title: "📋 Logging státusz",
            description:
              "❌ A logging nincs beállítva ezen a szerveren.\n\nHasználd: `/log setup <csatorna>`",
            footer: "Logging",
          }),
        );
      }

      const lines = CATEGORIES.map((cat) => {
        const enabled = settings.events?.[cat] !== false;
        return `${enabled ? "✅" : "❌"} ${CATEGORY_LABELS[cat]}`;
      });

      await safeReply(
        interaction,
        cv2Reply({
          title: "📋 Logging státusz",
          description: [
            `**Csatorna:** <#${settings.channel}>`,
            `**Állapot:** ${settings.enabled ? "✅ Aktív" : "❌ Inaktív"}`,
            "",
            "**Kategóriák:**",
            ...lines,
          ].join("\n"),
          footer: "Logging",
        }),
      );
    } else if (sub === "disable") {
      const settings = dm.getLogSettings(guildId);
      settings.enabled = false;
      dm.saveLogSettings(guildId, settings);

      await safeReply(
        interaction,
        cv2Reply({
          title: "🔇 Logging kikapcsolva",
          description:
            "Az összes logging kikapcsolva ezen a szerveren.\n\nÚjra bekapcsolhatod: `/log setup`",
          footer: "Logging",
        }),
      );
    }
  },
};
