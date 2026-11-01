const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");
const { cv2Reply, cv2DeferOptions, safeReply } = require("../utils/embedBuilder");
const { canManageChannel } = require("../utils/channelAccess");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("category")
    .setDescription("Kategória kezelése")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((s) =>
      s
        .setName("create")
        .setDescription("Új kategória létrehozása")
        .addStringOption((o) =>
          o
            .setName("name")
            .setDescription("Kategória neve")
            .setRequired(true)
            .setMaxLength(100),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("delete")
        .setDescription("Kategória törlése")
        .addChannelOption((o) =>
          o
            .setName("category")
            .setDescription("A kategória")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true),
        )
        .addBooleanOption((o) =>
          o
            .setName("channels")
            .setDescription(
              "Törölje a benne lévő csatornákat is? (alapértelmezett: nem)",
            )
            .setRequired(false),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("rename")
        .setDescription("Kategória átnevezése")
        .addChannelOption((o) =>
          o
            .setName("category")
            .setDescription("A kategória")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true),
        )
        .addStringOption((o) =>
          o
            .setName("name")
            .setDescription("Új név")
            .setRequired(true)
            .setMaxLength(100),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply(cv2DeferOptions());
    if (sub === "create") {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels))
        return safeReply(interaction, cv2Reply({ description: "❌ Ehhez szerver-szintű csatornakezelési jog szükséges." }, true));
    } else if (!canManageChannel(interaction, interaction.options.getChannel("category"))) {
      return safeReply(interaction, cv2Reply({ description: "❌ Nincs megfelelő jogosultság a kategóriához." }, true));
    }

    if (sub === "create") {
      const name = interaction.options.getString("name");
      try {
        const cat = await interaction.guild.channels.create({
          name,
          type: ChannelType.GuildCategory,
          reason: `Létrehozta: ${interaction.user.username}`,
        });
        await safeReply(interaction, 
          cv2Reply({
            title: "✅ Kategória létrehozva!",
            description: `**${cat.name}** (ID: \`${cat.id}\`)`,
            isSuccess: true,
          }),
        );
      } catch (err) {
        await safeReply(interaction, 
          cv2Reply(
            {
              description: "❌ Nem sikerült létrehozni a kategóriát!",
              isError: true,
            },
          ),
        );
      }
    } else if (sub === "delete") {
      const cat = interaction.options.getChannel("category");
      const delChannels = interaction.options.getBoolean("channels") ?? false;

      const children = [
        ...interaction.guild.channels.cache
          .filter((c) => c.parentId === cat.id)
          .values(),
      ];
      if (delChannels && children.some((channel) => !canManageChannel(interaction, channel)))
        return safeReply(interaction, cv2Reply({ description: "❌ A kategória egyik csatornájának törléséhez nincs megfelelő jogosultság." }, true));
      const deletesCurrent = delChannels && children.some((channel) => channel.id === interaction.channel.id);

      try {
        if (delChannels) {
          if (deletesCurrent) await safeReply(interaction, cv2Reply({ description: "🗑️ A kategória és csatornái törlése folyamatban." }));
          for (const ch of children.sort((a, b) => Number(a.id === interaction.channel.id) - Number(b.id === interaction.channel.id))) {
            await ch.delete(`Kategória törlés: ${cat.name}`);
          }
        }
        await cat.delete(`Törölte: ${interaction.user.username}`);
        if (deletesCurrent) return;

        const msg = delChannels
          ? `**${cat.name}** kategória és **${children.length}** csatorna törölve.`
          : `**${cat.name}** kategória törölve.${children.length ? ` (${children.length} csatorna megmaradt)` : ""}`;

        if (delChannels) {
          await safeReply(interaction, 
            cv2Reply({
              title: "✅ Kategória törölve!",
              description: msg,
              isSuccess: true,
            }),
          );
        } else {
          await safeReply(interaction, 
            cv2Reply({
              title: "✅ Kategória törölve!",
              description: msg,
              isSuccess: true,
            }),
          );
        }
      } catch (err) {
        await safeReply(interaction, 
          cv2Reply(
            {
              description: "❌ Nem sikerült törölni a kategóriát!",
              isError: true,
            },
            !delChannels,
          ),
        );
      }
    } else if (sub === "rename") {
      const cat = interaction.options.getChannel("category");
      const name = interaction.options.getString("name");
      const old = cat.name;
      try {
        await cat.setName(name, `Átnevezte: ${interaction.user.username}`);
        await safeReply(interaction, 
          cv2Reply({
            title: "✅ Kategória átnevezve!",
            description: `\`${old}\` → \`${name}\``,
            isSuccess: true,
          }),
        );
      } catch (err) {
        await safeReply(interaction, 
          cv2Reply(
            {
              description: "❌ Nem sikerült átnevezni a kategóriát!",
              isError: true,
            },
          ),
        );
      }
    }
  },
};
