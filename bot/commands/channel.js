const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");
const { buildContainer, cv2Reply, cv2DeferOptions, safeReply } = require("../utils/embedBuilder");
const { canManageChannel } = require("../utils/channelAccess");

const TYPE_MAP = {
  text: ChannelType.GuildText,
  voice: ChannelType.GuildVoice,
  announcement: ChannelType.GuildAnnouncement,
  forum: ChannelType.GuildForum,
};

function nameOk(name) {
  return /^[a-z0-9\-_\u00e0-\u024f]{1,100}$/i.test(name);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("channel")
    .setDescription("Csatorna kezelése")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((s) =>
      s
        .setName("create")
        .setDescription("Új csatorna létrehozása")
        .addStringOption((o) =>
          o
            .setName("name")
            .setDescription("Csatorna neve")
            .setRequired(true)
            .setMaxLength(100),
        )
        .addStringOption((o) =>
          o
            .setName("type")
            .setDescription("Csatorna típusa")
            .setRequired(true)
            .addChoices(
              { name: "💬 Szöveges", value: "text" },
              { name: "🔊 Hangcsatorna", value: "voice" },
              { name: "📢 Közlemény", value: "announcement" },
              { name: "💬 Fórum", value: "forum" },
            ),
        )
        .addChannelOption((o) =>
          o
            .setName("category")
            .setDescription("Kategória (opcionális)")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(false),
        )
        .addStringOption((o) =>
          o
            .setName("topic")
            .setDescription("Csatorna témája (szöveges csatornánál)")
            .setMaxLength(1024)
            .setRequired(false),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("delete")
        .setDescription("Csatorna törlése")
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("A csatorna (alapértelmezett: jelenlegi)")
            .setRequired(false),
        )
        .addStringOption((o) =>
          o.setName("reason").setDescription("Indok").setRequired(false),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("rename")
        .setDescription("Csatorna átnevezése")
        .addStringOption((o) =>
          o
            .setName("name")
            .setDescription("Új név")
            .setRequired(true)
            .setMaxLength(100),
        )
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("A csatorna (alapértelmezett: jelenlegi)")
            .setRequired(false),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("topic")
        .setDescription("Csatorna témájának beállítása")
        .addStringOption((o) =>
          o
            .setName("topic")
            .setDescription("Új téma (max 1024 karakter)")
            .setMaxLength(1024)
            .setRequired(true),
        )
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("A csatorna (alapértelmezett: jelenlegi)")
            .setRequired(false),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("clone")
        .setDescription("Csatorna klónozása")
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("A csatorna (alapértelmezett: jelenlegi)")
            .setRequired(false),
        )
        .addStringOption((o) =>
          o
            .setName("name")
            .setDescription("Klón neve (opcionális)")
            .setMaxLength(100)
            .setRequired(false),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply(cv2DeferOptions());
    if (sub === "create") {
      const category = interaction.options.getChannel("category");
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) ||
          (category && !canManageChannel(interaction, category))) {
        return safeReply(interaction, cv2Reply({ description: "❌ Nincs jogod ezen a helyen csatornát létrehozni." }, true));
      }
    } else {
      const target = interaction.options.getChannel("channel") || interaction.channel;
      if (!canManageChannel(interaction, target))
        return safeReply(interaction, cv2Reply({ description: "❌ Nincs megfelelő jogosultság a kiválasztott csatornához." }, true));
    }

    if (sub === "create") {
      const name = interaction.options
        .getString("name")
        .toLowerCase()
        .replace(/\s+/g, "-");
      const type = interaction.options.getString("type");
      const category = interaction.options.getChannel("category");
      const topic = interaction.options.getString("topic");

      if (!nameOk(name)) {
        return safeReply(interaction, 
          cv2Reply(
            {
              description:
                "❌ Rossz csatornanév! Csak betűk, számok, kötőjel és aláhúzás jöhet.",
              isError: true,
            },
          ),
        );
      }

      try {
        const ch = await interaction.guild.channels.create({
          name,
          type: TYPE_MAP[type],
          parent: category?.id ?? null,
          topic: type === "text" && topic ? topic : undefined,
          reason: `Létrehozta: ${interaction.user.username}`,
        });

        await safeReply(interaction, {
          flags: MessageFlags.IsComponentsV2,
          components: [
            buildContainer({
              title: "✅ Csatorna létrehozva!",
              description: `${ch} (\`${ch.id}\`)\n**Típus:** ${type}\n${category ? `**Kategória:** ${category.name}` : ""}`,
              isSuccess: true,
            }),
          ],
        });
      } catch (err) {
        console.error("Csatorna létrehozási hiba:", err);
        await safeReply(interaction, 
          cv2Reply(
            {
              description: "❌ Nem sikerült létrehozni a csatornát!",
              isError: true,
            },
          ),
        );
      }
    } else if (sub === "delete") {
      const ch =
        interaction.options.getChannel("channel") ?? interaction.channel;
      const reason = interaction.options.getString("reason") ?? "Nincs megadva";

      if (ch.id === interaction.guild.systemChannelId) {
        return safeReply(interaction, 
          cv2Reply(
            {
              description: "❌ A rendszercsatornát nem törölheted!",
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
              description: "❌ A botnak nincs joga törölni ezt!",
              isError: true,
            },
          ),
        );
      }

      try {
        const name = ch.name;
        if (ch.id !== interaction.channel.id) {
          await ch.delete(reason);
          await safeReply(interaction, {
            flags: MessageFlags.IsComponentsV2,
            components: [
              buildContainer({
                title: "✅ Csatorna törölve!",
                description: `**#${name}** törölve.\n**Indok:** ${reason}`,
                isSuccess: true,
              }),
            ],
          });
        } else {
          await safeReply(interaction, {
            flags: MessageFlags.IsComponentsV2,
            components: [
              buildContainer({
                description: `🗑️ **#${name}** csatorna törlése folyamatban…`,
                isWarning: true,
              }),
            ],
          });
          await ch.delete(reason);
        }
      } catch (err) {
        console.error("Csatorna törlési hiba:", err);
        await safeReply(interaction, 
          cv2Reply(
            {
              description: "❌ Nem sikerült törölni a csatornát!",
              isError: true,
            },
          ),
        );
      }
    } else if (sub === "rename") {
      const newName = interaction.options
        .getString("name")
        .toLowerCase()
        .replace(/\s+/g, "-");
      const ch =
        interaction.options.getChannel("channel") ?? interaction.channel;

      if (!nameOk(newName)) {
        return safeReply(interaction, 
          cv2Reply(
            { description: "❌ Rossz csatornanév!", isError: true },
          ),
        );
      }

      try {
        const old = ch.name;
        await ch.setName(newName, `Átnevezte: ${interaction.user.username}`);
        await safeReply(interaction, {
          flags: MessageFlags.IsComponentsV2,
          components: [
            buildContainer({
              title: "✅ Csatorna átnevezve!",
              description: `\`#${old}\` → \`#${newName}\``,
              isSuccess: true,
            }),
          ],
        });
      } catch (err) {
        await safeReply(interaction, 
          cv2Reply(
            {
              description: "❌ Nem sikerült átnevezni a csatornát!",
              isError: true,
            },
          ),
        );
      }
    } else if (sub === "topic") {
      const topic = interaction.options.getString("topic");
      const ch =
        interaction.options.getChannel("channel") ?? interaction.channel;

      if (
        ch.type !== ChannelType.GuildText &&
        ch.type !== ChannelType.GuildAnnouncement
      ) {
        return safeReply(interaction, 
          cv2Reply(
            {
              description: "❌ Csak szöveges csatornának adhatsz témát!",
              isError: true,
            },
          ),
        );
      }

      try {
        await ch.setTopic(topic, `Beállította: ${interaction.user.username}`);
        await safeReply(interaction, {
          flags: MessageFlags.IsComponentsV2,
          components: [
            buildContainer({
              title: "✅ Téma beállítva!",
              description: `**${ch.name}** téma:\n${topic}`,
              isSuccess: true,
            }),
          ],
        });
      } catch (err) {
        await safeReply(interaction, 
          cv2Reply(
            {
              description: "❌ Nem sikerült beállítani a témát!",
              isError: true,
            },
          ),
        );
      }
    } else if (sub === "clone") {
      const ch =
        interaction.options.getChannel("channel") ?? interaction.channel;
      const newName = interaction.options.getString("name");

      try {
        const clone = await ch.clone({
          name: newName ?? `${ch.name}-copy`,
          reason: `Klónozta: ${interaction.user.username}`,
        });
        await safeReply(interaction, {
          flags: MessageFlags.IsComponentsV2,
          components: [
            buildContainer({
              title: "✅ Csatorna klónozva!",
              description: `${ch} → ${clone}`,
              isSuccess: true,
            }),
          ],
        });
      } catch (err) {
        await safeReply(interaction, 
          cv2Reply(
            {
              description: "❌ Nem sikerült klónozni a csatornát!",
              isError: true,
            },
          ),
        );
      }
    }
  },
};
