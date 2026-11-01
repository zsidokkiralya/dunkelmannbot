const { SapphireClient } = require("@sapphire/framework");
const { GatewayIntentBits, Events, Partials } = require("discord.js");
const config = require("../config");
const { loadLocalCommands } = require("./handlers/commandHandler");
const { loadEvents } = require("./handlers/eventHandler");
const { startBotApi } = require("./botApi");

let client = null;
let apiServer;

async function startBot() {
  if (client) return client;
  if (!config.BOT_TOKEN) throw new Error("DISCORD_BOT_TOKEN nincs beállítva.");
  client = new SapphireClient({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Channel],
    loadMessageCommandListeners: false,
    baseUserDirectory: null,
    allowedMentions: { parse: [] },
    defaultPrefix: "!",
  });

  loadLocalCommands(client);
  loadEvents(client);

  await new Promise((resolve, reject) => {
    client.once(Events.ClientReady, () => {
      apiServer = startBotApi(client);
      apiServer.once("error", reject);
      apiServer.once("listening", () => {
        console.log(`[bot] Sapphire Client online: ${client.user?.tag || "Dunkelmann"}`);
        resolve(client);
      });
    });
    client.login(config.BOT_TOKEN).catch(reject);
  });
  return client;
}

async function stopBot() {
  require("./utils/musicManager").destroyAll();
  require("./utils/scheduler").cancelAll();
  if (apiServer?.listening) await new Promise((resolve) => apiServer.close(resolve));
  await client?.destroy();
  client = null;
}

module.exports = { start: startBot, stop: stopBot, getBot: () => client };
if (require.main === module) {
  const exit = (code) => stopBot().finally(() => { process.exitCode = code; });
  process.once("SIGINT", () => exit(0));
  process.once("SIGTERM", () => exit(0));
  startBot().catch((error) => { console.error("[bot]", error.message); exit(1); });
}

