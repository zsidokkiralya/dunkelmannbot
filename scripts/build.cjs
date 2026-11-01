const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const result = spawnSync(process.execPath, [
  require.resolve("typescript/bin/tsc"), "--project", path.join(root, "tsconfig.json"),
], { cwd: root, stdio: "inherit" });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
fs.cpSync(path.join(root, "web", "public"), path.join(root, "dist", "web", "public"), { recursive: true });
console.log("Build kész: bot, web és statikus fájlok.");
