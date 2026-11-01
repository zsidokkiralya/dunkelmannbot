const { Events } = require("discord.js");
const snipeStore = require("../utils/snipeStore");
const { sendLog } = require("../utils/logManager");
const { isSuppressed } = require("../utils/messageModeration");

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    if (!message.guild || message.author?.bot) return;
    if (!message.content && !message.attachments?.size) return;

    if (!isSuppressed(message.id)) snipeStore.set(message.channel.id, {
      content: message.content || null,
      authorUsername: message.author?.username ?? "Ismeretlen",
      authorAvatarURL:
        message.author?.displayAvatarURL({ size: 64 }) ?? null,
      attachments: [...(message.attachments?.values() || [])].map((a) => a.url),
      deletedAt: Date.now(),
    });

    const attachmentList =
      message.attachments?.size > 0
        ? `\n**Csatolmányok:** ${message.attachments.size} db`
        : "";

    await sendLog(message.guild, "messages", {
      title: "🗑️ Üzenet törölve",
      description: [
        `**Szerző:** ${message.author || "Ismeretlen"} (\`${message.author?.id || "Ismeretlen"}\`)`,
        `**Csatorna:** ${message.channel}`,
        message.content
          ? `\n**Tartalom:**\n\`\`\`\n${message.content.slice(0, 500)}\n\`\`\``
          : "",
        attachmentList,
      ]
        .filter(Boolean)
        .join("\n"),
      footer: "Logging – Üzenetek",
    });
  },
};

