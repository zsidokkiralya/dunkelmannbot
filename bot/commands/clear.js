const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { cv2Reply, cv2DeferOptions } = require("../utils/embedBuilder");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Törli az üzeneteket a csatornából")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) =>
      o
        .setName("amount")
        .setDescription("Hány üzenetet töröljek (1–100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true),
    )
    .addUserOption((o) =>
      o
        .setName("user")
        .setDescription("Csak ettől a usertől töröljön")
        .setRequired(false),
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");
    const filterUser = interaction.options.getUser("user");

    await interaction.deferReply(cv2DeferOptions(true));

    try {
      let messages = await interaction.channel.messages.fetch({ limit: 100 });

      const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
      messages = messages.filter((m) => m.createdTimestamp > cutoff);

      if (filterUser) {
        messages = messages.filter((m) => m.author.id === filterUser.id);
      }

      const toDelete = [...messages.values()].slice(0, amount);

      if (toDelete.length === 0) {
        return interaction.editReply(
          cv2Reply({
            description:
              "❌ Nincs törölhető üzenet (bulk törlés max 14 napos üzenetekre működik).",
          }),
        );
      }

      const deleted = await interaction.channel.bulkDelete(toDelete, true);

      await interaction.editReply(
        cv2Reply({
          title: "🗑️ Kész!",
          description: `**${deleted.size}** üzenet törölve${filterUser ? ` (csak ${filterUser.username}-tól)` : ""}. ✅`,
          footer: `Végrehajtó: ${interaction.user.username}`,
        }),
      );
    } catch (err) {
      console.error("[clear] hiba:", err);
      await interaction.editReply(
        cv2Reply({
          description: "❌ Valami elment törlés közben. Próbáld újra!",
        }),
      );
    }
  },
};
