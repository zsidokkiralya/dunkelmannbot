const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { cv2Reply, cv2DeferOptions, safeReply } = require("../utils/embedBuilder");
const { withLock } = require("../utils/keyedQueue");
const dm = require("../utils/dataManager");
const changed = ["SendMessages", "SendMessagesInThreads", "AddReactions", "CreatePublicThreads", "CreatePrivateThreads"];

module.exports = {
  data: new SlashCommandBuilder().setName("lock").setDescription("Lezárja vagy feloldja a csatornát")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) => sub.setName("set").setDescription("Lezárja a csatornát")
      .addStringOption((option) => option.setName("reason").setDescription("Indok").setMaxLength(512)))
    .addSubcommand((sub) => sub.setName("unset").setDescription("Visszaállítja a lezárás előtti jogokat")
      .addStringOption((option) => option.setName("reason").setDescription("Indok").setMaxLength(512))),
  async execute(interaction) {
    const channel = interaction.channel;
    if (!channel.permissionOverwrites ||
        !channel.permissionsFor(interaction.guild.members.me)?.has(PermissionFlagsBits.ManageRoles))
      return safeReply(interaction, cv2Reply({ description: "❌ A botnak nincs joga a csatorna felülírásait módosítani." }, true));
    await interaction.deferReply(cv2DeferOptions());
    return withLock(`locks:${interaction.guild.id}`, async () => {
      const data = dm.getLockData(interaction.guild.id);
      const locking = interaction.options.getSubcommand() === "set";
      const reason = interaction.options.getString("reason") || "Csatornazár módosítása";
      const permissions = {};
      if (locking) {
        if (!data[channel.id]) {
          const current = channel.permissionOverwrites.cache.get(interaction.guild.id);
          const previous = {};
          for (const name of changed) {
            const flag = PermissionFlagsBits[name];
            previous[name] = current?.allow.has(flag) ? true : current?.deny.has(flag) ? false : null;
          }
          data[channel.id] = previous;
          dm.saveLockData(interaction.guild.id, data);
        }
        for (const name of changed) permissions[name] = false;
      } else {
        for (const name of changed) permissions[name] = data[channel.id]?.[name] ?? null;
      }
      await channel.permissionOverwrites.edit(interaction.guild.id, permissions, reason);
      if (!locking) {
        delete data[channel.id];
        dm.saveLockData(interaction.guild.id, data);
      }
      return safeReply(interaction, cv2Reply({
        title: locking ? "🔒 Lezárva" : "🔓 Feloldva",
        description: locking ? "A csatorna lezárva." : "A lezárás előtti csatornajogokat visszaállítottam.",
      }));
    });
  },
};
