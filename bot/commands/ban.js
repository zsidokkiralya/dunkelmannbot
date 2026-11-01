const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { cv2Reply, safeReply, cv2DeferOptions } = require("../utils/embedBuilder");
const { addBan } = require("../utils/pendingActions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Kitilt valakit a szerverről")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) =>
      o
        .setName("user")
        .setDescription("Akit ki akarod tiltani")
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("reason").setDescription("Indok").setRequired(false).setMaxLength(512),
    )
    .addIntegerOption((o) =>
      o
        .setName("days")
        .setDescription("Mennyi napnyi üzenetet töröljenek (0-7)")
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") ?? "Nincs indok megadva";
    const days = interaction.options.getInteger("days") ?? 0;

    if (target.id === interaction.user.id) {
      return safeReply(
        interaction,
        cv2Reply({ description: "❌ Saját magad nem tilthatod ki!" }),
      );
    }

    if (target.id === interaction.client.user.id) {
      return safeReply(
        interaction,
        cv2Reply({ description: "❌ A botot nem tilthatod ki!" }),
      );
    }

    await interaction.deferReply(cv2DeferOptions());
    const member = await interaction.guild.members
      .fetch(target.id)
      .catch(() => null);

    if (member) {
      if (!member.bannable) {
        return safeReply(
          interaction,
          cv2Reply({
            description:
              "❌ Nem tudtam kitiltani! (Nincs jogom, vagy magasabb rangja van)",
          }),
        );
      }

      const executorMember = interaction.member;
      if (
        interaction.user.id !== interaction.guild.ownerId &&
        member.roles.highest.comparePositionTo(executorMember.roles.highest) >= 0
      ) {
        return safeReply(
          interaction,
          cv2Reply({
            description:
              "❌ Nem tilthatod ki, akinek ugyanolyan vagy magasabb a rangja!",
          }),
        );
      }

      if (target.id === interaction.guild.ownerId) {
        return safeReply(
          interaction,
          cv2Reply({
            description: "❌ A szerver tulaját nem lehet kitiltani!",
          }),
        );
      }
    }

    const requestId = addBan(interaction.guild.id, target.id, {
      targetId: target.id,
      targetUsername: target.username,
      reason,
      days,
      executorId: interaction.user.id,
    });

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ban_confirm_${interaction.guild.id}_${target.id}_${requestId}`)
        .setLabel("✅ Megerősítés")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`ban_cancel_${interaction.guild.id}_${target.id}_${requestId}`)
        .setLabel("❌ Mégsem")
        .setStyle(ButtonStyle.Secondary),
    );

    await safeReply(
      interaction,
      cv2Reply({
        title: "⚠️ Ban megerősítése",
        description: [
          `**Felhasználó:** ${target.username} (\`${target.id}\`)`,
          `**Indok:** ${reason}`,
          `**Üzenet törlés:** ${days} nap`,
        ].join("\n"),
        footer: "30 másodperced van rá",
        actionRows: [confirmRow],
      }),
    );
  },
};
