const { Events } = require("discord.js");
const dm = require("../utils/dataManager");
const { sendCv2Temporary } = require("../utils/embedBuilder");
const { moderateMessage } = require("../utils/messageModeration");
const { withLock } = require("../utils/keyedQueue");

async function handleCounting(message) {
  return withLock(`counting:${message.guild.id}`, async () => {
    const settings = dm.getCountingSettings(message.guild.id);
    if (!settings.enabled || message.channel.id !== settings.channelId) return false;
    const raw = message.content.trim();
    const number = /^\d+$/.test(raw) ? Number(raw) : NaN;
    let warning;
    if (!Number.isSafeInteger(number)) warning = "❌ Csak egész számokat írj!";
    else if (settings.lastUser === message.author.id) warning = "⏳ Várj, amíg más ír!";
    else if (number !== settings.currentNumber + 1) {
      warning = `❌ A helyes szám ${settings.currentNumber + 1} lett volna. Újrakezdés 0-ról.`;
      settings.currentNumber = 0;
      settings.lastUser = null;
      dm.saveCountingSettings(message.guild.id, settings);
    }
    if (warning) {
      await message.delete().catch((error) => console.error("[counting] Törlés:", error.code));
      await sendCv2Temporary(message.channel, { description: warning }, 5000);
      return true;
    }
    settings.currentNumber = number;
    settings.lastUser = message.author.id;
    settings.record = Math.max(settings.record || 0, number);
    dm.saveCountingSettings(message.guild.id, settings);
    await message.react("✅").catch(() => {});
    return true;
  });
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author?.bot || !message.guild) return;
    if (await moderateMessage(message)) return;
    await handleCounting(message);
  },
};
