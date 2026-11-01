const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const {
  buildContainer,
  cv2Reply,
  cv2Flags,
  cv2DeferOptions,
  safeReply,
  safeEdit,
  sendCv2,
} = require("../utils/embedBuilder");
const config = require("../../config");
const { exec } = require("child_process");
const { promisify } = require("util");
const { reloadAndRegister } = require("../handlers/commandHandler");
const os = require("os");

const execAsync = promisify(exec);

function guard(interaction) {
  return config.DEV_IDS.includes(interaction.user.id);
}

function fmt(bytes) {
  const k = 1024,
    s = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
}

function fmtUptime(sec) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return [d && `${d}n`, h && `${h}ó`, m && `${m}p`, `${s}mp`]
    .filter(Boolean)
    .join(" ");
}

async function runEval(code, interaction, client) {
  try {
    let result = await eval(`(async () => {\n${code}\n})()`);
    if (typeof result !== "string")
      result = require("util").inspect(result, {
        depth: 2,
        maxArrayLength: 10,
      });
    return { ok: true, text: String(result).slice(0, 1800) };
  } catch (err) {
    return { ok: false, text: `${err.name}: ${err.message}` };
  }
}

async function runShell(cmd) {
  try {
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 10_000,
      maxBuffer: 512 * 1024,
    });
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (err) {
    return { ok: false, stdout: "", stderr: err.message };
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dev")
    .setDescription("[DEV] Fejlesztői parancsok")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s
        .setName("sysinfo")
        .setDescription("Részletes rendszer- és bot információk"),
    )
    .addSubcommand((s) =>
      s
        .setName("eval")
        .setDescription("JavaScript kód futtatása")
        .addStringOption((o) =>
          o.setName("code").setDescription("JS kód").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("exec")
        .setDescription("Shell parancs futtatása a hoston")
        .addStringOption((o) =>
          o
            .setName("command")
            .setDescription("Shell parancs")
            .setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s.setName("restart").setDescription("Bot újraindítása (PM2/Pterodactyl)"),
    )
    .addSubcommand((s) =>
      s.setName("reload").setDescription("Minden slash parancs újratöltése"),
    )
    .addSubcommand((s) =>
      s.setName("servers").setDescription("Szerverek listája"),
    )
    .addSubcommand((s) =>
      s
        .setName("announce")
        .setDescription("Üzenet küldése minden szerver rendszercsatornájába")
        .addStringOption((o) =>
          o.setName("message").setDescription("Az üzenet").setRequired(true),
        ),
    ),

  async execute(interaction, client) {
    if (!guard(interaction)) {
      return safeReply(
        interaction,
        cv2Reply(
          { description: "❌ Ez a parancs csak a bot fejlesztőinek szól!" },
          true,
        ),
      );
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "sysinfo") {
      await interaction.deferReply(cv2DeferOptions(true));

      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const procMem = process.memoryUsage();
      const cpus = os.cpus();
      const cpuModel = cpus[0]?.model ?? "N/A";

      let diskLine = "N/A";
      if (process.platform !== "win32") {
        const d = await runShell("df -h /");
        diskLine = d.ok ? (d.stdout.split("\n")[1] ?? "N/A") : "N/A";
      }

      const diskParts = diskLine.trim().split(/\s+/);
      const diskInfo =
        diskParts.length >= 5
          ? `${diskParts[2]} / ${diskParts[1]} (${diskParts[4]} használt)`
          : diskLine;

      const lines = [
        `🖥️ **Platform:** \`${os.platform()} ${os.arch()}\` | ${os.type()} ${os.release()}`,
        `⚙️ **CPU:** \`${cpuModel}\` × ${cpus.length} mag`,
        ``,
        `💾 **Rendszer RAM:** \`${fmt(totalMem - freeMem)} / ${fmt(totalMem)}\``,
        `💾 **Bot RAM:** \`${fmt(procMem.heapUsed)} heap / ${fmt(procMem.rss)} RSS\``,
        `💿 **Lemez (/):** \`${diskInfo}\``,
        ``,
        `⏱️ **Rendszer uptime:** \`${fmtUptime(os.uptime())}\``,
        `⏱️ **Bot uptime:** \`${fmtUptime(process.uptime())}\``,
        `🟢 **Node.js:** \`${process.version}\``,
        ``,
        `📡 **API Ping:** \`${Math.round(client.ws.ping)}ms\``,
        `🌐 **Szerverek:** \`${client.guilds.cache.size}\``,
        `👥 **Tagok (cache):** \`${client.users.cache.size}\``,
      ].join("\n");

      await safeEdit(interaction, {
        flags: cv2Flags(true),
        components: [
          buildContainer({
            title: "🖥️ Rendszer Információk",
            description: lines,
            footer: "Dev",
          }),
        ],
      });
    } else if (sub === "eval") {
      await interaction.deferReply(cv2DeferOptions(true));
      const code = interaction.options.getString("code");
      const result = await runEval(code, interaction, client);

      await safeEdit(interaction, {
        flags: cv2Flags(true),
        components: [
          buildContainer({
            title: result.ok ? "✅ Eval kimenet" : "❌ Eval hiba",
            description: `\`\`\`js\n${result.text}\n\`\`\``,
            footer: "Eval",
          }),
        ],
      });
    } else if (sub === "exec") {
      await interaction.deferReply(cv2DeferOptions(true));
      const cmd = interaction.options.getString("command");
      const result = await runShell(cmd);

      const out = result.stdout || "";
      const err = result.stderr || "";
      const body = [
        out && `**stdout:**\n\`\`\`\n${out.slice(0, 900)}\n\`\`\``,
        err && `**stderr:**\n\`\`\`\n${err.slice(0, 900)}\n\`\`\``,
        !out && !err && "_Nincs kimenet._",
      ]
        .filter(Boolean)
        .join("\n");

      await safeEdit(interaction, {
        flags: cv2Flags(true),
        components: [
          buildContainer({
            title: result.ok
              ? `✅ Exec: \`${cmd.slice(0, 50)}\``
              : `❌ Exec hiba: \`${cmd.slice(0, 50)}\``,
            description: body.slice(0, 1800),
            footer: "Exec",
          }),
        ],
      });
    } else if (sub === "restart") {
      await safeReply(
        interaction,
        cv2Reply({ description: "♻️ Bot újraindítása folyamatban…" }, true),
      );
      setTimeout(() => process.exit(0), 1500);
    } else if (sub === "reload") {
      await interaction.deferReply(cv2DeferOptions(true));
      await reloadAndRegister(client);

      await safeEdit(
        interaction,
        cv2Reply(
          {
            description: `✅ ${client.commands.size} parancs újratöltve és regisztrálva!`,
          },
          true,
        ),
      );
    } else if (sub === "servers") {
      await interaction.deferReply(cv2DeferOptions(true));
      const guilds = [...client.guilds.cache.values()].sort(
        (a, b) => b.memberCount - a.memberCount,
      );
      const lines = guilds
        .slice(0, 25)
        .map(
          (g, i) =>
            `**${i + 1}.** ${g.name} — \`${g.memberCount}\` tag | \`${g.id}\``,
        );
      if (guilds.length > 25)
        lines.push(`\n_… és még ${guilds.length - 25} szerver._`);

      await safeEdit(interaction, {
        flags: cv2Flags(true),
        components: [
          buildContainer({
            title: `🌐 Szerverek (${guilds.length})`,
            description: lines.join("\n") || "Nincs szerver.",
            footer: "Dev",
          }),
        ],
      });
    } else if (sub === "announce") {
      await interaction.deferReply(cv2DeferOptions(true));
      const msg = interaction.options.getString("message");
      let sent = 0,
        failed = 0;

      for (const guild of client.guilds.cache.values()) {
        const target =
          guild.systemChannel ??
          guild.channels.cache
            .filter(
              (c) =>
                c.type === ChannelType.GuildText &&
                c
                  .permissionsFor(guild.members.me)
                  ?.has(PermissionFlagsBits.SendMessages),
            )
            .sort((a, b) => a.position - b.position)
            .first();

        if (!target) {
          failed++;
          continue;
        }

        try {
          const message = await sendCv2(target, {
            title: "📢 Bot közlemény",
            description: msg,
            footer: `${interaction.user.username} üzenete`,
          });
          if (message) sent++;
          else failed++;
        } catch {
          failed++;
        }
      }

      await safeEdit(
        interaction,
        cv2Reply(
          {
            title: "📢 Közlemény elküldve",
            description: `**Sikeres:** \`${sent}\`\n**Sikertelen:** \`${failed}\``,
          },
          true,
        ),
      );
    }
  },
};
