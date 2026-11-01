const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const config = require("../config");
const routes = require("./routes");
const { SessionStore } = require("./sessionStore");

function startWeb() {
  if (!config.CLIENT_ID || !config.CLIENT_SECRET) {
    console.warn(
      "Web OAuth nincs teljesen beállítva (CLIENT_ID / CLIENT_SECRET). A kezelőfelület korlátozottan fog működni.",
    );
  }

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.TRUST_PROXY);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"], scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "https://cdn.discordapp.com", "data:"],
          connectSrc: ["'self'"], objectSrc: ["'none'"], baseUri: ["'self'"],
          formAction: ["'self'"], frameAncestors: ["'none'"], upgradeInsecureRequests: null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Túl sok kérés érkezett erről az IP címről, kérjük próbáld újra később.",
  });
  app.use(limiter);

  app.use(express.json({ limit: "16kb" }));
  app.use(express.urlencoded({ extended: false, limit: "16kb" }));
  app.use(express.static(path.join(__dirname, "public")));

  const store = new SessionStore();
  app.locals.sessionStore = store;
  app.use(
    session({
      store,
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: config.SECURE_COOKIES,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "lax",
        httpOnly: true,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use("/", routes);

  app.use((req, res) => {
    res.status(404).send(`<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#ff3366">
<title>404 – Dunkelmann (Magyar)</title>
<link rel="stylesheet" href="/css/main.css">
</head>
<body style="align-items:center;justify-content:center;text-align:center;padding:24px">
  <div>
    <h1 style="font-size:6rem;font-weight:900;background:var(--accent-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">404</h1>
    <p style="color:var(--text-secondary);font-size:1.1rem;margin:12px 0 28px">Ez az oldal nem található a Dunkelmann hálózatában.</p>
    <a href="/" class="btn">Vissza a főoldalra</a>
  </div>
</body>
</html>`);
  });

  app.use((err, req, res, next) => {
    console.error("[web server error]", err.message);
    if (res.headersSent) return next(err);
    res.status(500).send(`<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="UTF-8">
<title>500 – Szerver Hiba</title>
<link rel="stylesheet" href="/css/main.css">
</head>
<body style="align-items:center;justify-content:center;text-align:center;padding:24px">
  <div>
    <h1 style="font-size:5rem;color:var(--danger)">500</h1>
    <p style="color:var(--text-secondary);font-size:1.1rem;margin:12px 0 28px">Belső szerver hiba történt. A fejlesztők értesítve lettek.</p>
    <a href="/" class="btn">Vissza a főoldalra</a>
  </div>
</body>
</html>`);
  });

  return app;
}

function listen() {
  const app = startWeb();
  const server = app.listen(config.WEB_PORT, () => {
    console.log(`🌐 Dunkelmann weboldal fut: ${config.WEB_PORT}`);
  });
  server.once("close", () => app.locals.sessionStore.close());
  return server;
}

module.exports = { start: listen, createWebApp: startWeb };
if (require.main === module) listen().on("error", (error) => {
  console.error("[web]", error.message);
  process.exitCode = 1;
});
