const { Events, ActivityType } = require("discord.js");
const { loadReminders } = require("../utils/reminderManager");
const { loadGiveaways } = require("../utils/giveawayManager");
const {
  clearGuildCommands,
  registerCommands,
} = require("../handlers/commandHandler");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(
      `Bot online: ${client.user.tag} | ${client.guilds.cache.size} szerver`,
    );

    client.user.setPresence({
      status: "online",
      activities: [
        {
          name: `Dunkelmann | /help | ${client.guilds.cache.size} szerver`,
          type: ActivityType.Watching,
        },
      ],
    });

    // Persisted jobs must resume even when command registration is temporarily unavailable.
    await loadReminders(client);
    await loadGiveaways(client);
    // Removing guild commands is an explicit, one-time migration, not a startup side effect.
    if (process.env.CLEAR_GUILD_COMMANDS === "true") await clearGuildCommands(client);
    await registerCommands(client);
  },
};
