const { Events } = require("discord.js");
const { sendLog } = require("../utils/logManager");
const { moderateMessage } = require("../utils/messageModeration");

module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    if (newMessage.partial) {
      try { newMessage = await newMessage.fetch(); } catch { return; }
    }
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (await moderateMessage(newMessage)) return;
    if (oldMessage.content === newMessage.content) return;
    if (!oldMessage.content && !newMessage.content) return;

    const old = oldMessage.content || "_Üres_";
    const now = newMessage.content || "_Üres_";

    await sendLog(oldMessage.guild, "messages", {
      title: "✏️ Üzenet szerkesztve",
      description: [
        `**Szerző:** ${newMessage.author} (\`${newMessage.author?.id || "Ismeretlen"}\`)`,
        `**Csatorna:** ${oldMessage.channel}`,
        "",
        `**Előtte:**\n\`\`\`\n${old.slice(0, 500)}\n\`\`\``,
        `**Utána:**\n\`\`\`\n${now.slice(0, 500)}\n\`\`\``,
      ].join("\n"),
      footer: "Logging – Üzenetek",
    });
  },
};
