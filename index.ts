const config = require("./config");
let webServer;
let bot;
let stopping;

async function start() {
  if (config.FEATURES.WEB) {
    const web = require("./web/index");
    webServer = web.start();
    await new Promise((resolve, reject) => {
      webServer.once("listening", resolve);
      webServer.once("error", reject);
    });
  }
  bot = require("./bot/index");
  await bot.start();
}

function stop() {
  if (stopping) return stopping;
  stopping = (async () => {
    await bot?.stop();
    if (webServer?.listening) await new Promise((resolve) => webServer.close(resolve));
  })();
  return stopping;
}

if (require.main === module) {
  const shutdown = (code) => {
    const timeout = setTimeout(() => process.exit(code), 10000);
    timeout.unref();
    stop().then(() => { clearTimeout(timeout); process.exitCode = code; })
      .catch((error) => { console.error("[shutdown]", error.message); process.exitCode = 1; });
  };
  const fatal = (error) => {
    console.error("[process]", error?.message || String(error));
    shutdown(1);
  };
  process.once("SIGINT", () => shutdown(0));
  process.once("SIGTERM", () => shutdown(0));
  process.once("unhandledRejection", fatal);
  process.once("uncaughtException", fatal);
  start().catch(fatal);
}

module.exports = { start, stop };
