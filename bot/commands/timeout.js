const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { buildContainer, cv2Reply, cv2DeferOptions, safeReply } = require("../utils/embedBuilder");
const { sendLog } = require("../utils/logManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Elnémít valakit egy ideig")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) =>
      o
        .setName("user")
        .setDescription("Kit akarsz elnámítani")
        .setRequired(true),
    )
    .addIntegerOption((o) =>
      o
        .setName("minutes")
        .setDescription("Mennyi ideig (percben, 1–40320)")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("reason").setDescription("Indok").setRequired(false).setMaxLength(512),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const minutes = interaction.options.getInteger("minutes");
    const reason =
      interaction.options.getString("reason") ?? "Nincs indok megadva";

    if (target.id === interaction.user.id) {
      return safeReply(interaction, 
        cv2Reply(
          { description: "❌ Saját magad nem némíthatod el!", isError: true },
        ),
      );
    }

    if (target.id === interaction.client.user.id) {
      return safeReply(interaction, 
        cv2Reply(
          { description: "❌ Engem nem tudsz elnámítani 😄", isError: true },
        ),
      );
    }

    if (target.id === interaction.guild.ownerId) {
      return safeReply(interaction, 
        cv2Reply(
          {
            description: "❌ A szerver tulaját nem lehet elnámítani.",
            isError: true,
          },
        ),
      );
    }

    await interaction.deferReply(cv2DeferOptions());
    const member = await interaction.guild.members
      .fetch(target.id)
      .catch(() => null);

    if (!member) {
      return safeReply(interaction, 
        cv2Reply(
          {
            description: "❌ Nem találom ezt a usert a szerveren.",
            isError: true,
          },
        ),
      );
    }

    if (!member.moderatable) {
      return safeReply(interaction, 
        cv2Reply(
          {
            description:
              "❌ Nincs jogom elnámítani. (Valószínűleg magasabb rangja van nálam.)",
            isError: true,
          },
        ),
      );
    }

    if (
      interaction.user.id !== interaction.guild.ownerId &&
      member.roles.highest.comparePositionTo(interaction.member.roles.highest) >= 0
    ) {
      return safeReply(interaction, 
        cv2Reply(
          {
            description:
              "❌ Olyat nem elnámíthatsz, akinek legalább akkora rangja van mint neked.",
            isError: true,
          },
        ),
      );
    }

    const durationMs = minutes * 60 * 1000;

    try {
      await member.timeout(durationMs, reason);

      const hrs = Math.floor(minutes / 60);
      const min = minutes % 60;
      const durationStrLog = hrs > 0 ? `${hrs}ó ${min}p` : `${min}p`;
      await sendLog(interaction.guild, "moderation", {
        title: "🔇 Tag elnémítva (timeout)",
        description: `**Tag:** ${target.username} (\`${target.id}\`)\n**Időtartam:** ${durationStrLog}\n**Indok:** ${reason}\n**Végrehajtó:** ${interaction.user.username}`,
        footer: "Logging – Moderáció",
      });

      const durationStr = durationStrLog;

      await safeReply(interaction, {
        flags: MessageFlags.IsComponentsV2,
        components: [
          buildContainer({
            title: "🔇 Elnámítva!",
            description: `**${target.username}** elnámítva **${durationStr}** időre.\n**Indok:** ${reason}`,
            isSuccess: true,
            footer: `Végrehajtó: ${interaction.user.username}`,
          }),
        ],
      });
    } catch (err) {
      console.error("[timeout] hiba:", err);
      await safeReply(interaction, 
        cv2Reply(
          {
            description: "❌ Nem sikerült elnámítani. Nincs elég jogom?",
            isError: true,
          },
        ),
      );
    }
  },
};
