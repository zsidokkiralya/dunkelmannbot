const {
  SlashCommandBuilder,
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("devs")
    .setDescription("A bot fejlesztői"),

  async execute(interaction) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "## 🛠️ Dunkelmann Fejlesztői Csapat\nEzek a srácok csinálják az egészet – köszönjük nekik! 🙌",
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small),
      )
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              "**👑 Dunkelmann**\nAlapító & Fejlesztő",
            ),
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setLabel("Profil")
              .setURL("https://discord.com/users/1212864602140971008")
              .setStyle(ButtonStyle.Link)
              .setEmoji("🔗"),
          ),
      )
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              "**💻 aø.**\nWeb Developer & Főfejlesztő",
            ),
          )
          .setButtonAccessory(
            new ButtonBuilder()
              .setLabel("Profil")
              .setURL("https://discord.com/users/888072261846859806")
              .setStyle(ButtonStyle.Link)
              .setEmoji("🔗"),
          ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
          .setSpacing(SeparatorSpacingSize.Small),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("-# Dunkelmann"),
      );

    await interaction.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  },
};
