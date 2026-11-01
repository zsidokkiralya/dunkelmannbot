const { Events, PermissionFlagsBits } = require("discord.js");
const {
  cv2Reply,
  cv2Update,
  safeReply,
  safeUpdate,
} = require("../utils/embedBuilder");
const { getBan, deleteBan } = require("../utils/pendingActions");
const ticket = require("../utils/ticketManager");
const { sendLog } = require("../utils/logManager");

const cooldowns = new Map();

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand())
        return await handleSlash(interaction, client);
      if (interaction.isButton())
        return await handleButton(interaction, client);
      if (interaction.isStringSelectMenu())
        return await handleSelect(interaction, client);
    } catch (err) {
      console.error("[interaction] elkapott hiba:", err);
      await safeReply(
        interaction,
        cv2Reply({
          description:
            "❌ Valami elszállt. Próbáld újra, ha megint ilyen, szólj egy devnek.",
        }),
      );
    }
  },
};

async function handleSlash(interaction, client) {
  const command = client.commands?.get(interaction.commandName);

  if (!command) {
    console.warn(
      `[slash] ismeretlen parancs: "${interaction.commandName}" | betöltött parancsok: ${client.commands?.size ?? 0} db`,
    );
    return safeReply(
      interaction,
      cv2Reply({
        title: "❓ Ismeretlen parancs",
        description: `A \`/${interaction.commandName}\` parancsot nem találom. Ha frissen lett hozzáadva, indítsd újra a botot.\n-# Betöltött parancsok: ${client.commands?.size ?? 0} db`,
      }),
    );
  }

  if (command.guildOnly && !interaction.guild) {
    return safeReply(interaction, cv2Reply({ description: "❌ Ez a parancs csak szerveren használható." }, true));
  }
  const required = command.data.toJSON().default_member_permissions;
  if (required !== undefined && required !== null) {
    const permissions = interaction.memberPermissions || interaction.member?.permissions;
    const mask = BigInt(required) || PermissionFlagsBits.Administrator;
    if (!permissions?.has?.(mask)) {
      return safeReply(interaction, cv2Reply({ description: "❌ Ehhez nincs megfelelő jogosultságod." }, true));
    }
  }
  const cdKey = `${interaction.guildId || "dm"}_${interaction.user.id}_${interaction.commandName}`;
  const cdTime = command.cooldown ?? 3000;

  if (cooldowns.has(cdKey)) {
    const expires = cooldowns.get(cdKey) + cdTime;
    if (Date.now() < expires) {
      const left = ((expires - Date.now()) / 1000).toFixed(1);
      return safeReply(
        interaction,
        cv2Reply({
          description: `⏳ Lassíts! Várj még **${left}** másodpercet ezzel a paranccsal.`,
        }),
      );
    }
  }

  cooldowns.set(cdKey, Date.now());
  setTimeout(() => cooldowns.delete(cdKey), cdTime).unref?.();

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(`[slash] hiba (${interaction.commandName}):`, err);
    await safeReply(
      interaction,
      cv2Reply({
        description: "❌ Ez most elszállt. Próbáld újra pár mp múlva!",
      }),
    );
  }
}

async function handleButton(interaction, client) {
  const id = interaction.customId;

  if (id.startsWith("ban_confirm_") || id.startsWith("ban_cancel_")) {
    const parts = id.split("_");
    const action = parts[1];
    const guildId = parts[2];
    const targetId = parts[3];
    const requestId = parts[4];
    if (interaction.guild?.id !== guildId)
      return safeReply(interaction, cv2Reply({ description: "❌ Hibás szerverazonosító." }, true));
    const banData = getBan(guildId, targetId, requestId);

    if (!banData) {
      return safeUpdate(
        interaction,
        cv2Update({
          description: "❌ Ez a ban kérés már lejárt vagy meg lett vonva.",
        }),
      );
    }

    if (interaction.user.id !== banData.executorId) {
      return safeReply(
        interaction,
        cv2Reply({
          description: "❌ Csak az erősítheti meg, aki kiadta.",
        }),
      );
    }

    if (action === "cancel") {
      deleteBan(guildId, targetId, requestId);
      return safeUpdate(
        interaction,
        cv2Update({ description: "🚫 Ban visszavonva." }),
      );
    }

    try {
      await interaction.deferUpdate();
      const guild =
        client.guilds.cache.get(guildId) ??
        (await client.guilds.fetch(guildId));
      const executor = await guild.members.fetch({ user: interaction.user.id, force: true });
      let target;
      try { target = await guild.members.fetch({ user: targetId, force: true }); } catch (error) {
        if (error.code !== 10007 && error.status !== 404) throw error;
      }
      if (!executor.permissions.has(PermissionFlagsBits.BanMembers) ||
          targetId === guild.ownerId || targetId === client.user.id || targetId === executor.id ||
          (target && (!target.bannable || (executor.id !== guild.ownerId &&
            target.roles.highest.comparePositionTo(executor.roles.highest) >= 0)))) {
        return safeUpdate(interaction, cv2Update({ description: "❌ A jelenlegi jogosultságokkal ez a kitiltás nem hajtható végre." }));
      }
      if (!getBan(guildId, targetId, requestId))
        return safeUpdate(interaction, cv2Update({ description: "❌ Ez a kitiltási kérés már lejárt vagy feldolgozás alatt van." }));
      deleteBan(guildId, targetId, requestId);
      await guild.members.ban(targetId, {
        deleteMessageSeconds: (banData.days ?? 0) * 86400,
        reason: banData.reason,
      });
      await sendLog(guild, "moderation", {
        title: "🔨 Tag kitiltva (ban)",
        description: `**Tag:** ${banData.targetUsername} (\`${targetId}\`)\n**Indok:** ${banData.reason}\n**Végrehajtó:** ${interaction.user.username}`,
        footer: "Logging – Moderáció",
      });
      await safeUpdate(
        interaction,
        cv2Update({
          title: "✅ Bannolva!",
          description: `**${banData.targetUsername}** ki lett tiltva.\n**Indok:** ${banData.reason}`,
          footer: `Végrehajtó: ${interaction.user.username}`,
        }),
      );
    } catch (err) {
      console.error("[ban] ban hiba:", err);
      await safeUpdate(
        interaction,
        cv2Update({
          description: "❌ Nem sikerült kitiltani. Nincs jogom?",
        }),
      );
    }
    return;
  }

  if (id === "coinflip_again") {
    const { buildFlipPayload } = require("../commands/coinflip");
    return safeUpdate(interaction, buildFlipPayload());
  }

  if (id === "ticket_open") return ticket.openTicket(interaction, client);
  if (id === "ticket_close") return ticket.initiateClose(interaction);
  if (id === "ticket_confirm_close")
    return ticket.confirmClose(interaction, client);
  if (id === "ticket_cancel_close") return ticket.cancelClose(interaction);

  await safeReply(
    interaction,
    cv2Reply({
      description:
        "❓ Ezt a gombot már nem ismerem. Lehet régi üzenetből nyomtad.",
    }),
  );
}

async function handleSelect(interaction) {
  if (interaction.customId === "help_category") {
    const { buildHelpCategoryMessage } = require("../commands/help");
    return interaction.update(
      buildHelpCategoryMessage(interaction.values[0]),
    );
  }

  await safeReply(
    interaction,
    cv2Reply({
      description: "❓ Ezt a menüt már nem ismerem. Lehet régi üzenetből van.",
    }),
  );
}
