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
} = require("discord.js");
const axios = require("axios");
const { cv2Reply, cv2DeferOptions, cv2Flags, safeEdit } = require("../utils/embedBuilder");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("meme")
    .setDescription("Hoz egy random mémet a Redditről"),

  async execute(interaction) {
    await interaction.deferReply(cv2DeferOptions());

    try {
      const res = await axios.get("https://meme-api.com/gimme", {
        timeout: 8000,
      });
      const data = res.data;

      if (!data?.url) {
        return safeEdit(
          interaction,
          cv2Reply({
            description: "❌ Nem sikerült mémet lekérni! Próbáld újra!",
          }),
        );
      }

      const postRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Reddit post")
          .setURL(data.postLink)
          .setStyle(ButtonStyle.Link),
      );

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## 😂 ${data.title.slice(0, 200)}`,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(SeparatorSpacingSize.Small),
        )
        .addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(data.url),
          ),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# 👍 ${data.ups} | r/${data.subreddit}`,
          ),
        )
        .addActionRowComponents(postRow);

      await safeEdit(interaction, {
        flags: cv2Flags(),
        components: [container],
      });
    } catch (err) {
      console.error("Meme hiba:", err.message);
      await safeEdit(
        interaction,
        cv2Reply({
          description: "❌ Nem sikerült mémet lekérni. Próbáld újra!",
        }),
      );
    }
  },
};
