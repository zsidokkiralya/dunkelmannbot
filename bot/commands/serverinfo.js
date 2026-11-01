const {
  SlashCommandBuilder,
  ChannelType,
} = require("discord.js");
const { cv2Reply, cv2DeferOptions, safeEdit } = require("../utils/embedBuilder");

const VERIFICATION = ["Nincs", "Alacsony", "Közepes", "Magas", "Legmagasabb"];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Megnézed a szerver adatait"),

  async execute(interaction) {
    await interaction.deferReply(cv2DeferOptions());

    const guild = interaction.guild;
    await guild.fetch().catch(() => {});

    const owner = await guild.fetchOwner().catch(() => null);
    const createdTs = Math.floor(guild.createdTimestamp / 1000);
    const textCh = guild.channels.cache.filter(
      (c) => c.type === ChannelType.GuildText,
    ).size;
    const voiceCh = guild.channels.cache.filter(
      (c) => c.type === ChannelType.GuildVoice,
    ).size;

    const lines = [
      `👑 **Tulajdonos:** ${owner ? `${owner.user.username} (\`${guild.ownerId}\`)` : `\`${guild.ownerId}\``}`,
      `🆔 **ID:** \`${guild.id}\``,
      `📅 **Létrehozva:** <t:${createdTs}:D> (<t:${createdTs}:R>)`,
      ``,
      `👥 **Tagok:** \`${guild.memberCount}\``,
      `💬 **Csatornák:** \`${textCh}\` szöveges, \`${voiceCh}\` hang`,
      `🎭 **Rangok:** \`${guild.roles.cache.size - 1}\``,
      `😀 **Emojik:** \`${guild.emojis.cache.size}\``,
      ``,
      `🚀 **Boostok:** \`${guild.premiumSubscriptionCount}\` (Tier ${guild.premiumTier})`,
      `🔒 **Verifikáció:** ${VERIFICATION[guild.verificationLevel] ?? "Ismeretlen"}`,
    ].join("\n");

    await safeEdit(
      interaction,
      cv2Reply({
        title: guild.name,
        thumbnailUrl: guild.iconURL({ size: 256 }) ?? undefined,
        description: lines,
        footer: "Szerver adatok",
      }),
    );
  },
};
