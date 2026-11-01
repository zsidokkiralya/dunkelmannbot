const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const { cv2Reply, cv2DeferOptions, safeReply } = require("../utils/embedBuilder");
const dm = require("../utils/dataManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket rendszer")
    .addSubcommand((s) =>
      s
        .setName("setup")
        .setDescription("Ticket rendszer beállítása")
        .addChannelOption((o) =>
          o
            .setName("category")
            .setDescription("Kategória a ticketeknek")
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true),
        )
        .addRoleOption((o) =>
          o.setName("staff").setDescription("Staff rang").setRequired(true),
        )
        .addChannelOption((o) =>
          o
            .setName("log")
            .setDescription("Log csatorna (opcionális)")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false),
        ),
    )
    .addSubcommand((s) =>
      s.setName("close").setDescription("Jelenlegi ticket lezárása"),
    )
    .addSubcommand((s) =>
      s
        .setName("add")
        .setDescription("Valaki hozzáadása a tickethez")
        .addUserOption((o) =>
          o.setName("user").setDescription("A user").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("remove")
        .setDescription("Valaki eltávolítása a ticketből")
        .addUserOption((o) =>
          o.setName("user").setDescription("A user").setRequired(true),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "add" || sub === "remove") await interaction.deferReply(cv2DeferOptions());

    if (sub === "setup") {
      if (
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      ) {
        return safeReply(interaction, 
          cv2Reply(
            { description: "❌ Ehhez admin kell!", isError: true },
          ),
        );
      }

      const category = interaction.options.getChannel("category");
      const staff = interaction.options.getRole("staff");
      const log = interaction.options.getChannel("log");

      const guildData = dm.getTicketData(interaction.guild.id);
      guildData.settings = {
        categoryId: category.id,
        staffRoleId: staff.id,
        logChannelId: log?.id ?? null,
      };
      dm.saveTicketData(interaction.guild.id, guildData);

      await safeReply(interaction, 
        cv2Reply(
          {
            title: "✅ Ticket rendszer kész!",
            description: [
              `**Kategória:** ${category}`,
              `**Staff rang:** ${staff}`,
              log ? `**Log csatorna:** ${log}` : null,
              `\nKüld ki a panelt a \`/ticketpanel\` paranccsal!`,
            ]
              .filter(Boolean)
              .join("\n"),
            isSuccess: true,
          },
        ),
      );
    } else if (sub === "close") {
      const { initiateClose } = require("../utils/ticketManager");
      await initiateClose(interaction);
    } else if (sub === "add") {
      const guildData = dm.getTicketData(interaction.guild.id);
      const ticketInfo = guildData.tickets?.[interaction.channel.id];

      if (!ticketInfo)
        return safeReply(interaction, 
          cv2Reply(
            { description: "❌ Ez nem ticket csatorna!", isError: true },
          ),
        );

      const settings = guildData.settings || {};
      const ok =
        (settings.staffRoleId &&
          interaction.member.roles.cache.has(settings.staffRoleId)) ||
        interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

      if (!ok)
        return safeReply(interaction, 
          cv2Reply(
            { description: "❌ Ehhez nincs jogod!", isError: true },
          ),
        );

      const target = interaction.options.getUser("user");
      try {
        await interaction.channel.permissionOverwrites.edit(target.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });
        await safeReply(interaction, 
          cv2Reply({
            description: `✅ **${target.username}** benne van!`,
            isSuccess: true,
          }),
        );
      } catch {
        await safeReply(interaction, 
          cv2Reply(
            { description: "❌ Nem sikerült hozzáadni!", isError: true },
          ),
        );
      }
    } else if (sub === "remove") {
      const guildData = dm.getTicketData(interaction.guild.id);
      const ticketInfo = guildData.tickets?.[interaction.channel.id];

      if (!ticketInfo)
        return safeReply(interaction, 
          cv2Reply(
            { description: "❌ Ez nem ticket csatorna!", isError: true },
          ),
        );

      const settings = guildData.settings || {};
      const ok =
        (settings.staffRoleId &&
          interaction.member.roles.cache.has(settings.staffRoleId)) ||
        interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

      if (!ok)
        return safeReply(interaction, 
          cv2Reply(
            { description: "❌ Ehhez nincs jogod!", isError: true },
          ),
        );

      const target = interaction.options.getUser("user");
      if (target.id === ticketInfo.userId) {
        return safeReply(interaction, 
          cv2Reply(
            {
              description: "❌ A ticket tulajdonosát nem lehet kivenni!",
              isError: true,
            },
          ),
        );
      }

      try {
        await interaction.channel.permissionOverwrites.edit(target.id, {
          ViewChannel: false,
        });
        await safeReply(interaction, 
          cv2Reply({
            description: `✅ **${target.username}** ki van véve.`,
            isSuccess: true,
          }),
        );
      } catch {
        await safeReply(interaction, 
          cv2Reply(
            { description: "❌ Nem sikerült eltávolítani!", isError: true },
          ),
        );
      }
    }
  },
};
