const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const { cv2Reply, cv2DeferOptions, cv2Flags, safeEdit } = require("../utils/embedBuilder");
const axios = require("axios");

module.exports = {
  cooldown: 10_000,

  data: new SlashCommandBuilder()
    .setName("screenshot")
    .setDescription("Képernyőképet készít egy weboldalról")
    .addStringOption((o) =>
      o
        .setName("url")
        .setDescription("Weboldal URL (pl. https://google.com)")
        .setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply(cv2DeferOptions());

    let url = interaction.options.getString("url").trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    let hostname;
    try {
      hostname = new URL(url).hostname;
    } catch {
      return safeEdit(
        interaction,
        cv2Reply({ description: "❌ Rossz URL!" }),
      );
    }

    try {
      const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false`;
      const res = await axios.get(apiUrl, { timeout: 20_000 });

      const imgUrl = res.data?.data?.screenshot?.url;
      if (!imgUrl) {
        return safeEdit(
          interaction,
          cv2Reply({
            description: "❌ Nem sikerült képernyőképet csinálni!",
          }),
        );
      }

      const openRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Weboldal megnyitása")
          .setURL(url)
          .setStyle(ButtonStyle.Link),
      );

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`## 📸 ${hostname}`),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(SeparatorSpacingSize.Small),
        )
        .addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(imgUrl),
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(SeparatorSpacingSize.Small),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("-# microlink.io"),
        )
        .addActionRowComponents(openRow);

      await safeEdit(interaction, {
        flags: cv2Flags(),
        components: [container],
      });
    } catch (err) {
      console.error("Screenshot hiba:", err.message);
      await safeEdit(
        interaction,
        cv2Reply({
          description: "❌ Valami hiba volt a weboldal lekérdezésekor!",
        }),
      );
    }
  },
};
