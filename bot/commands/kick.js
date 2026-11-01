const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const { buildContainer, cv2Reply, cv2DeferOptions, safeReply } = require("../utils/embedBuilder");
const { sendLog } = require("../utils/logManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kirúg valakit a szerverről")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) =>
      o
        .setName("user")
        .setDescription("Akit ki akarod rúgni")
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("reason").setDescription("Indok").setRequired(false).setMaxLength(512),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") ?? "Nincs indok megadva";

    if (target.id === interaction.user.id) {
      return safeReply(interaction, 
        cv2Reply(
          { description: "❌ Saját magad nem rúghatod ki!", isError: true },
        ),
      );
    }

    if (target.id === interaction.client.user.id) {
      return safeReply(interaction, 
        cv2Reply(
          { description: "❌ A botot nem rúghatod ki!", isError: true },
        ),
      );
    }

    if (target.id === interaction.guild.ownerId) {
      return safeReply(interaction, 
        cv2Reply(
          {
            description: "❌ A szerver tulaját nem lehet kirúgni!",
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
          { description: "❌ Ez a user nincs a szerveren!", isError: true },
        ),
      );
    }

    if (!member.kickable) {
      return safeReply(interaction, 
        cv2Reply(
          {
            description:
              "❌ Nem tudtam kirúgni! (Magasabb rangja van vagy nincs jogom)",
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
              "❌ Nem rúghatod ki, akinek ugyanolyan vagy magasabb a rangja!",
            isError: true,
          },
        ),
      );
    }

    try {
      await member.kick(reason);
      await sendLog(interaction.guild, "moderation", {
        title: "👢 Tag kirúgva (kick)",
        description: `**Tag:** ${target.username} (\`${target.id}\`)\n**Indok:** ${reason}\n**Végrehajtó:** ${interaction.user.username}`,
        footer: "Logging – Moderáció",
      });
      await safeReply(interaction, {
        flags: MessageFlags.IsComponentsV2,
        components: [
          buildContainer({
            title: "✅ Kirúgva!",
            description: `**${target.username}** kirúgva. ✈️\n**Indok:** ${reason}`,
            isSuccess: true,
            footer: `Csinálta: ${interaction.user.username}`,
          }),
        ],
      });
    } catch (err) {
      console.error("Kick hiba:", err);
      await safeReply(interaction, 
        cv2Reply(
          {
            description: "❌ Nem tudtam kirúgni! (Nincs jogom?)",
            isError: true,
          },
        ),
      );
    }
  },
};
