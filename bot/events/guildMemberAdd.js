const { Events } = require("discord.js");
const { sendLog } = require("../utils/logManager");

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (!member.guild) return;

    const accountAge = Math.floor(
      (Date.now() - member.user.createdTimestamp) / 86400000,
    );
    const ageStr =
      accountAge < 1
        ? "kevesebb mint 1 nap"
        : accountAge < 30
          ? `${accountAge} nap`
          : `${Math.floor(accountAge / 30)} hónap`;

    await sendLog(member.guild, "members", {
      title: "📥 Tag csatlakozott",
      description: [
        `**Tag:** ${member.user} (\`${member.user.id}\`)`,
        `**Felhasználónév:** ${member.user.username}`,
        `**Fiók kora:** ${ageStr}`,
        `**Szerver tagszám:** ${member.guild.memberCount}`,
      ].join("\n"),
      footer: "Logging – Tagok",
    });
  },
};
