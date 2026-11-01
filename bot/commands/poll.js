const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { cv2Reply, cv2Message, cv2DeferOptions, safeReply } = require("../utils/embedBuilder");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Szavazás indítása")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) =>
      sub
        .setName("yes-no")
        .setDescription("Egyszerű Igen/Nem szavazás")
        .addStringOption((o) =>
          o
            .setName("question")
            .setDescription("A szavazás kérdése")
            .setRequired(true)
            .setMaxLength(500),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("mixed")
        .setDescription("Több opciós szavazás (max 5 opció)")
        .addStringOption((o) =>
          o
            .setName("question")
            .setDescription("A szavazás kérdése")
            .setRequired(true)
            .setMaxLength(500),
        )
        .addStringOption((o) =>
          o.setName("option1").setDescription("1. opció").setRequired(true).setMaxLength(500),
        )
        .addStringOption((o) =>
          o.setName("option2").setDescription("2. opció").setRequired(true).setMaxLength(500),
        )
        .addStringOption((o) =>
          o.setName("option3").setDescription("3. opció").setRequired(false).setMaxLength(500),
        )
        .addStringOption((o) =>
          o.setName("option4").setDescription("4. opció").setRequired(false).setMaxLength(500),
        )
        .addStringOption((o) =>
          o.setName("option5").setDescription("5. opció").setRequired(false).setMaxLength(500),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply(cv2DeferOptions());
    const question = interaction.options.getString("question");

    if (sub === "yes-no") {
      const msg = await interaction.channel.send(
        cv2Message({
          title: "📊 Szavazás",
          description: `**${question}**`,
          thumbnailUrl: interaction.user.displayAvatarURL({ size: 128 }),
          footer: `Szavazás • ${interaction.user.username}`,
        }),
      );
      let complete = true;
      for (const emoji of ["👍", "👎"]) {
        try { await msg.react(emoji); } catch { complete = false; }
      }
      await safeReply(interaction, 
        cv2Reply({ description: complete ? "✅ Szavazás kész!" :
          "⚠️ A szavazás megjelent, de nem sikerült minden reakciót hozzáadni. Ellenőrizd a bot jogosultságait." }),
      );
    } else {
      const options = [];
      for (let i = 1; i <= 5; i++) {
        const v = interaction.options.getString(`option${i}`);
        if (v) options.push(v);
      }

      const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
      const desc =
        `**${question}**\n\n` +
        options.map((o, i) => `${emojis[i]} ${o}`).join("\n");

      const msg = await interaction.channel.send(
        cv2Message({
          title: "📊 Többopciós szavazás",
          description: desc,
          thumbnailUrl: interaction.user.displayAvatarURL({ size: 128 }),
          footer: `Szavazás • ${interaction.user.username}`,
        }),
      );
      let complete = true;
      for (let i = 0; i < options.length; i++) {
        try { await msg.react(emojis[i]); } catch { complete = false; }
      }
      await safeReply(interaction, 
        cv2Reply({ description: complete ? "✅ Többopciós szavazás kész!" :
          "⚠️ A szavazás megjelent, de nem sikerült minden reakciót hozzáadni. Ellenőrizd a bot jogosultságait." }),
      );
    }
  },
};
