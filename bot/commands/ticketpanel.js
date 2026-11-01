const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { cv2Reply, cv2Flags, safeReply, cv2DeferOptions } = require("../utils/embedBuilder");
const dm = require("../utils/dataManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription("Kiküldöm a ticket panelt a csatornába")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o
        .setName("title")
        .setDescription("Panel cím (ha kihagyod: Támogatás)")
        .setMaxLength(80)
        .setRequired(false),
    )
    .addStringOption((o) =>
      o
        .setName("description")
        .setDescription("Mit írjak a panelre?")
        .setMaxLength(500)
        .setRequired(false),
    ),

  async execute(interaction) {
    const guildData = dm.getTicketData(interaction.guild.id);
    if (!guildData.settings?.categoryId) {
      return safeReply(
        interaction,
        cv2Reply(
          {
            description:
              "❌ Előbb állítsd be a ticketet a `/ticket setup` paranccsal!",
          },
          true,
        ),
      );
    }

    await interaction.deferReply(cv2DeferOptions(true));
    const title = interaction.options.getString("title") ?? "🎫 Támogatás";
    const desc =
      interaction.options.getString("description") ??
      "Ha elakadtál, nyiss egy ticketet! Visszajelzünk mielőbb. 🎫";

    const container = new ContainerBuilder()
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## ${title}`),
            new TextDisplayBuilder().setContent(desc),
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setCustomId("ticket_open")
              .setLabel("Ticket nyitása")
              .setEmoji("🎫")
              .setStyle(ButtonStyle.Primary),
          ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("-# Ticket rendszer"),
      );

    await interaction.channel.send({
      flags: cv2Flags(),
      components: [container],
    });

    await safeReply(
      interaction,
      cv2Reply({ description: "✅ Kész, kiment a panel!" }, true),
    );
  },
};
