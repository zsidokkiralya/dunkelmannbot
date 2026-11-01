const { SlashCommandBuilder } = require("discord.js");
const { cv2Reply, safeReply } = require("../utils/embedBuilder");

const PERM_HU = {
  Administrator: "Adminisztrátor",
  ManageGuild: "Szerver kezelése",
  ManageChannels: "Csatornák kezelése",
  ManageRoles: "Rangok kezelése",
  ManageMessages: "Üzenetek kezelése",
  ManageNicknames: "Becenév kezelése",
  KickMembers: "Tagok kirúgása",
  BanMembers: "Tagok kitiltása",
  ModerateMembers: "Tagok moderálása",
  MentionEveryone: "@everyone megemlítése",
  SendMessages: "Üzenet küldése",
  ReadMessageHistory: "Üzenet előzmény",
  ViewChannel: "Csatorna megtekintése",
  EmbedLinks: "Hivatkozás",
  AttachFiles: "Fájl csatolás",
  UseExternalEmojis: "Külső emoji",
  Connect: "Hangcsatorna csatlakozás",
  Speak: "Hangcsatorna beszéd",
  MoveMembers: "Tagok áthelyezése",
  DeafenMembers: "Tagok elnémítása",
  MuteMembers: "Mikrofon némítás",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roleinfo")
    .setDescription("Megnézed egy rang részleteit")
    .addRoleOption((o) =>
      o.setName("role").setDescription("A rang").setRequired(true),
    ),

  async execute(interaction) {
    const role = interaction.options.getRole("role");

    if (role.id === interaction.guild.id) {
      return safeReply(
        interaction,
        cv2Reply({
          description: "❌ Az @everyone rangra ez nem működik.",
        }),
      );
    }

    const createdTs = Math.floor(role.createdTimestamp / 1000);

    const perms =
      role.permissions
        .toArray()
        .map((p) => PERM_HU[p] ?? p)
        .slice(0, 10)
        .join(", ") || "Nincs különleges jog";

    const members = interaction.guild.members.cache.filter((m) =>
      m.roles.cache.has(role.id),
    ).size;

    const lines = [
      `🆔 **ID:** \`${role.id}\``,
      `📅 **Létrehozva:** <t:${createdTs}:D>`,
      `🎨 **Szín:** \`${role.hexColor}\``,
      `👥 **Tagok:** \`${members}\``,
      `📌 **Megjelenítve:** ${role.hoist ? "Igen" : "Nem"}`,
      `💬 **Megemlíthető:** ${role.mentionable ? "Igen" : "Nem"}`,
      `🔑 **Jogok:** ${perms}`,
    ].join("\n");

    await safeReply(
      interaction,
      cv2Reply({
        title: `🎭 ${role.name}`,
        description: lines,
        footer: "Rang adatok",
      }),
    );
  },
};
