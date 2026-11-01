const { Events } = require("discord.js");
const { sendLog } = require("../utils/logManager");

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    if (!member.guild) return;

    const roles = member.roles?.cache
      ?.filter((r) => r.id !== member.guild.id)
      .map((r) => r.name)
      .join(", ");

    await sendLog(member.guild, "members", {
      title: "📤 Tag kilépett",
      description: [
        `**Tag:** ${member.user} (\`${member.user.id}\`)`,
        `**Felhasználónév:** ${member.user.username}`,
        roles ? `**Rangjai voltak:** ${roles}` : "",
        `**Szerver tagszám:** ${member.guild.memberCount}`,
      ]
        .filter(Boolean)
        .join("\n"),
      footer: "Logging – Tagok",
    });
  },
};
