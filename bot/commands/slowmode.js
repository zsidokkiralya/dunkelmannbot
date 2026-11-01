const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");
const { buildContainer, cv2Reply, cv2DeferOptions, safeReply } = require("../utils/embedBuilder");
const { canManageChannel } = require("../utils/channelAccess");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Csatorna lassított módja")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((o) =>
      o
        .setName("seconds")
        .setDescription("Késleltetés másodpercben (0 = kikapcsol, max 21600)")
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true),
    )
    .addChannelOption((o) =>
      o
        .setName("channel")
        .setDescription("A csatorna (alapértelmezett: jelenlegi)")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    ),

  async execute(interaction) {
    const delay = interaction.options.getInteger("seconds");
    const ch = interaction.options.getChannel("channel") ?? interaction.channel;
    if (!canManageChannel(interaction, ch))
      return safeReply(interaction, cv2Reply({ description: "❌ Nincs megfelelő jogosultság a kiválasztott csatornához." }, true));

    if (
      ch.type !== ChannelType.GuildText &&
      ch.type !== ChannelType.GuildAnnouncement
    ) {
      return safeReply(interaction, 
        cv2Reply(
          {
            description:
              "❌ Slowmode-ot csak szöveges csatornán állíthatsz be!",
            isError: true,
          },
        ),
      );
    }

    const botPerms = ch.permissionsFor(interaction.guild.members.me);
    if (!botPerms?.has(PermissionFlagsBits.ManageChannels)) {
      return safeReply(interaction, 
        cv2Reply(
          {
            description: "❌ Nincs jogom kezelni ezt a csatornát.",
            isError: true,
          },
        ),
      );
    }

    await interaction.deferReply(cv2DeferOptions());
    try {
      await ch.setRateLimitPerUser(
        delay,
        `Beállította: ${interaction.user.username}`,
      );

      const off = delay === 0;
      const str =
        delay < 60
          ? `${delay} mp`
          : delay < 3600
            ? `${Math.floor(delay / 60)} perc`
            : `${Math.floor(delay / 3600)} óra`;

      await safeReply(interaction, {
        flags: MessageFlags.IsComponentsV2,
        components: [
          buildContainer({
            title: off ? "✅ Slowmode ki" : `⏱️ Slowmode: ${str}`,
            description: off
              ? `**#${ch.name}** – lassított mód kikapcsolva.`
              : `**#${ch.name}** – üzenetenként \`${str}\` várakozás.`,
            isSuccess: off,
            isWarning: !off,
            footer: `Beállította: ${interaction.user.username}`,
          }),
        ],
      });
    } catch (err) {
      console.error("[slowmode] hiba:", err);
      await safeReply(interaction, 
        cv2Reply(
          {
            description: "❌ Nem sikerült beállítani a slowmode-ot.",
            isError: true,
          },
        ),
      );
    }
  },
};
