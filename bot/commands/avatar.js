const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Profilkép megjelenítése")
    .addUserOption((o) =>
      o
        .setName("user")
        .setDescription("A felhasználó (alapértelmezett: te)")
        .setRequired(false),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("user") || interaction.user;
    const avatarUrl = target.displayAvatarURL({ size: 512, extension: "png" });
    const hasGif = target.avatar?.startsWith("a_");

    const linkRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("PNG letöltés")
        .setURL(target.displayAvatarURL({ size: 4096, extension: "png" }))
        .setStyle(ButtonStyle.Link),
    );

    if (hasGif) {
      linkRow.addComponents(
        new ButtonBuilder()
          .setLabel("GIF letöltés")
          .setURL(target.displayAvatarURL({ size: 4096, extension: "gif" }))
          .setStyle(ButtonStyle.Link),
      );
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## 🖼️ ${target.username} profilképe`,
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small),
      )
      .addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(avatarUrl),
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("-# Dunkelmann"),
      )
      .addActionRowComponents(linkRow);

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  },
};
