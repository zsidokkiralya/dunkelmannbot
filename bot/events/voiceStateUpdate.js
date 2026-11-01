const { Events } = require("discord.js");
const { sendLog } = require("../utils/logManager");

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    const member = newState.member || oldState.member;
    if (!member || member.user?.bot) return;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (!oldChannel && newChannel) {
      await sendLog(guild, "voice", {
        title: "🔊 Hangcsatornába lépett",
        description: `**Tag:** ${member.user} (\`${member.user.id}\`)\n**Csatorna:** ${newChannel.name}`,
        footer: "Logging – Hang",
      });
      return;
    }

    if (oldChannel && !newChannel) {
      await sendLog(guild, "voice", {
        title: "🔇 Hangcsatornából kilépett",
        description: `**Tag:** ${member.user} (\`${member.user.id}\`)\n**Csatorna:** ${oldChannel.name}`,
        footer: "Logging – Hang",
      });
      return;
    }

    if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
      await sendLog(guild, "voice", {
        title: "🔀 Hangcsatornát váltott",
        description: `**Tag:** ${member.user} (\`${member.user.id}\`)\n**Honnan:** ${oldChannel.name}\n**Hova:** ${newChannel.name}`,
        footer: "Logging – Hang",
      });
    }
  },
};

