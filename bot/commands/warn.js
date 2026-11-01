const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { buildContainer, cv2Reply, cv2DeferOptions, safeReply } = require("../utils/embedBuilder");
const dm = require("../utils/dataManager");
const { sendLog } = require("../utils/logManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warnok kezelése")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Warn kiadása valakinek")
        .addUserOption((o) =>
          o.setName("user").setDescription("A felhasználó").setRequired(true),
        )
        .addStringOption((o) =>
          o.setName("reason").setDescription("Indok").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("Megnézi valaki warnjait")
        .addUserOption((o) =>
          o.setName("user").setDescription("A felhasználó").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("clear")
        .setDescription("Törli valaki összes warnját")
        .addUserOption((o) =>
          o.setName("user").setDescription("A felhasználó").setRequired(true),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply(cv2DeferOptions());
    const target = interaction.options.getUser("user");

    if (sub === "add") {
      const reason = interaction.options.getString("reason");

      if (target.id === interaction.user.id) {
        return safeReply(interaction, 
          cv2Reply({
            description: "❌ Saját magad nem figyelmeztetheted!",
            isError: true,
          }),
        );
      }

      if (target.bot) {
        return safeReply(interaction, 
          cv2Reply({
            description: "❌ Botokat nem lehet warnolni!",
            isError: true,
          }),
        );
      }

      const warning = {
        id: `${Date.now()}`,
        reason,
        timestamp: Date.now(),
        moderatorId: interaction.user.id,
        moderatorUsername: interaction.user.username,
      };

      dm.addWarning(interaction.guild.id, target.id, warning);
      const warnings = dm.getWarnings(interaction.guild.id, target.id);

      await sendLog(interaction.guild, "moderation", {
        title: "⚠️ Figyelmeztetés kiadva (warn)",
        description: `**Tag:** ${target.username} (\`${target.id}\`)\n**Indok:** ${reason}\n**Összesen:** ${warnings.length} warn\n**Moderátor:** ${interaction.user.username}`,
        footer: "Logging – Moderáció",
      });

      await safeReply(interaction, {
        flags: MessageFlags.IsComponentsV2,
        components: [
          buildContainer({
            title: "⚠️ Warn kiadva!",
            description: `**${target.username}** warnot kapott.\n**Indok:** ${reason}\n**Összesen:** ${warnings.length} warn`,
            isWarning: true,
            footer: `Moderátor: ${interaction.user.username}`,
          }),
        ],
      });
    } else if (sub === "list") {
      const warnings = dm.getWarnings(interaction.guild.id, target.id);

      if (warnings.length === 0) {
        return safeReply(interaction, 
          cv2Reply(
            {
              description: `✅ **${target.username}**-nak nincs warnja!`,
              isSuccess: true,
            },
            true,
          ),
        );
      }

      const list = warnings
        .map(
          (w, i) =>
            `**${i + 1}.** ${w.reason}\n-# <t:${Math.floor(w.timestamp / 1000)}:D> • ${w.moderatorUsername}`,
        )
        .join("\n\n");

      await safeReply(interaction, {
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          buildContainer({
            title: `⚠️ ${target.username} warnjai`,
            description: list,
            isWarning: true,
            footer: `Összesen: ${warnings.length} warn`,
          }),
        ],
      });
    } else if (sub === "clear") {
      const warnings = dm.getWarnings(interaction.guild.id, target.id);

      if (warnings.length === 0) {
        return safeReply(interaction, 
          cv2Reply(
            {
              description: `ℹ️ **${target.username}**-nak amúgy sincs warnja!`,
              isWarning: true,
            },
            true,
          ),
        );
      }

      dm.clearWarnings(interaction.guild.id, target.id);

      await safeReply(interaction, {
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [
          buildContainer({
            title: "✅ Warnok törölve!",
            description: `**${target.username}** összes warnja (${warnings.length} db) törölve. 🗑️`,
            isSuccess: true,
          }),
        ],
      });
    }
  },
};
