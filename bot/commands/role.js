const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const { cv2Reply, safeReply, cv2DeferOptions } = require("../utils/embedBuilder");

function parseColor(input) {
  if (!input) return null;
  const clean = input.startsWith("#") ? input.slice(1) : input;
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return null;
  return parseInt(clean, 16);
}

function hierarchyOk(interaction, role) {
  if (role.comparePositionTo(interaction.guild.members.me.roles.highest) >= 0)
    return "❌ A bot rangja alacsonyabb ennél a rangnál!";
  if (interaction.user.id !== interaction.guild.ownerId &&
      role.comparePositionTo(interaction.member.roles.highest) >= 0) return "❌ A te rangod ehhez kevés!";
  return null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("Rang kezelése")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((s) =>
      s
        .setName("create")
        .setDescription("Új rang létrehozása")
        .addStringOption((o) =>
          o
            .setName("name")
            .setDescription("Rang neve (max 100 karakter)")
            .setRequired(true)
            .setMaxLength(100),
        )
        .addStringOption((o) =>
          o
            .setName("color")
            .setDescription("Szín hexkódban (#FF3366)")
            .setRequired(false),
        )
        .addBooleanOption((o) =>
          o
            .setName("hoist")
            .setDescription("Megjelenjen külön a taglistában?")
            .setRequired(false),
        )
        .addBooleanOption((o) =>
          o
            .setName("mentionable")
            .setDescription("Megemlíthető legyen?")
            .setRequired(false),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("delete")
        .setDescription("Rang törlése")
        .addRoleOption((o) =>
          o.setName("role").setDescription("A törlendő rang").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("edit")
        .setDescription("Rang szerkesztése")
        .addRoleOption((o) =>
          o
            .setName("role")
            .setDescription("A szerkesztendő rang")
            .setRequired(true),
        )
        .addStringOption((o) =>
          o
            .setName("name")
            .setDescription("Új név")
            .setRequired(false)
            .setMaxLength(100),
        )
        .addStringOption((o) =>
          o
            .setName("color")
            .setDescription("Új szín (#FF3366)")
            .setRequired(false),
        )
        .addBooleanOption((o) =>
          o
            .setName("hoist")
            .setDescription("Legyen kiemelve a taglistában?")
            .setRequired(false),
        )
        .addBooleanOption((o) =>
          o
            .setName("mentionable")
            .setDescription("Megemlíthető?")
            .setRequired(false),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("give")
        .setDescription("Rang adása felhasználónak")
        .addUserOption((o) =>
          o.setName("user").setDescription("A felhasználó").setRequired(true),
        )
        .addRoleOption((o) =>
          o.setName("role").setDescription("A rang").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s
        .setName("take")
        .setDescription("Rang elvétele felhasználótól")
        .addUserOption((o) =>
          o.setName("user").setDescription("A felhasználó").setRequired(true),
        )
        .addRoleOption((o) =>
          o.setName("role").setDescription("A rang").setRequired(true),
        ),
    )
    .addSubcommand((s) =>
      s.setName("list").setDescription("Szerver rangjainak listázása"),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    await interaction.deferReply(cv2DeferOptions());

    if (sub === "create") {
      const name = interaction.options.getString("name");
      const colorInput = interaction.options.getString("color");
      const hoist = interaction.options.getBoolean("hoist") ?? false;
      const mentionable =
        interaction.options.getBoolean("mentionable") ?? false;

      const color = colorInput ? parseColor(colorInput) : null;
      if (colorInput && color === null) {
        return safeReply(interaction, 
          cv2Reply({
            description: "❌ Rossz színformátum! Használj hex kódot, pl. `#FF3366`.",
            isError: true,
          }),
        );
      }

      try {
        const role = await interaction.guild.roles.create({
          name,
          color: color ?? undefined,
          hoist,
          mentionable,
          reason: `Létrehozta: ${interaction.user.username}`,
        });

        await safeReply(
          interaction,
          cv2Reply({
            title: "✅ Rang létrehozva!",
            description: `${role} (\`${role.id}\`)`,
            footer: `Létrehozta: ${interaction.user.username}`,
          }),
        );
      } catch (e) {
        console.error("[role] create hiba:", e);
        await safeReply(interaction, 
          cv2Reply({
            description: "❌ Nem sikerült létrehozni a rangot!",
            isError: true,
          }),
        );
      }
    } else if (sub === "delete") {
      const role = interaction.options.getRole("role");

      if (role.managed) {
        return safeReply(interaction, 
          cv2Reply({
            description: "❌ Integráció/bot rangot nem lehet törölni!",
            isError: true,
          }),
        );
      }

      const err = hierarchyOk(interaction, role);
      if (err) {
        return safeReply(interaction, cv2Reply({ description: err, isError: true }));
      }

      try {
        const roleName = role.name;
        await role.delete(`Törölte: ${interaction.user.username}`);
        await safeReply(
          interaction,
          cv2Reply({
            title: "✅ Rang törölve!",
            description: `A **${roleName}** rang törölve.`,
          }),
        );
      } catch (e) {
        console.error("[role] delete hiba:", e);
        await safeReply(interaction, 
          cv2Reply({
            description: "❌ Nem sikerült törölni a rangot!",
            isError: true,
          }),
        );
      }
    } else if (sub === "edit") {
      const role = interaction.options.getRole("role");
      const name = interaction.options.getString("name");
      const colorInput = interaction.options.getString("color");
      const hoist = interaction.options.getBoolean("hoist");
      const mentionable = interaction.options.getBoolean("mentionable");

      if (role.managed) {
        return safeReply(interaction, 
          cv2Reply({
            description: "❌ Integráció/bot rangot nem lehet szerkeszteni!",
            isError: true,
          }),
        );
      }

      const err = hierarchyOk(interaction, role);
      if (err) {
        return safeReply(interaction, cv2Reply({ description: err, isError: true }));
      }

      const color = colorInput ? parseColor(colorInput) : undefined;
      if (colorInput && color === null) {
        return safeReply(interaction, 
          cv2Reply({
            description: "❌ Rossz színformátum! Használj hex kódot, pl. `#FF3366`.",
            isError: true,
          }),
        );
      }

      if (!name && colorInput === null && hoist === null && mentionable === null) {
        return safeReply(interaction, 
          cv2Reply({
            description: "❌ Adj meg legalább egy módosítandó mezőt!",
            isError: true,
          }),
        );
      }

      try {
        await role.edit({
          name: name ?? undefined,
          color: colorInput !== null ? color : undefined,
          hoist: hoist ?? undefined,
          mentionable: mentionable ?? undefined,
          reason: `Szerkesztette: ${interaction.user.username}`,
        });

        await safeReply(
          interaction,
          cv2Reply({
            title: "✅ Rang frissítve!",
            description: `${role} (\`${role.id}\`)`,
          }),
        );
      } catch (e) {
        console.error("[role] edit hiba:", e);
        await safeReply(interaction, 
          cv2Reply({
            description: "❌ Nem sikerült szerkeszteni a rangot!",
            isError: true,
          }),
        );
      }
    } else if (sub === "give") {
      const target = interaction.options.getUser("user");
      const role = interaction.options.getRole("role");

      const err = hierarchyOk(interaction, role);
      if (err) {
        return safeReply(interaction, cv2Reply({ description: err, isError: true }));
      }

      const member = await interaction.guild.members
        .fetch(target.id)
        .catch(() => null);
      if (!member) {
        return safeReply(interaction, 
          cv2Reply({
            description: "❌ Ez a felhasználó nincs a szerveren!",
            isError: true,
          }),
        );
      }

      if (member.roles.cache.has(role.id)) {
        return safeReply(interaction, 
          cv2Reply({
            description: `ℹ️ **${target.username}**-nak már megvan ez a rang!`,
            isWarning: true,
          }),
        );
      }

      try {
        await member.roles.add(role, `Adta: ${interaction.user.username}`);
        await safeReply(
          interaction,
          cv2Reply({
            title: "✅ Rang adva!",
            description: `${role} rang adva: **${target.username}**`,
          }),
        );
      } catch (e) {
        console.error("[role] give hiba:", e);
        await safeReply(interaction, 
          cv2Reply({
            description: "❌ Nem sikerült adni a rangot!",
            isError: true,
          }),
        );
      }
    } else if (sub === "take") {
      const target = interaction.options.getUser("user");
      const role = interaction.options.getRole("role");

      const err = hierarchyOk(interaction, role);
      if (err) {
        return safeReply(interaction, cv2Reply({ description: err, isError: true }));
      }

      const member = await interaction.guild.members
        .fetch(target.id)
        .catch(() => null);
      if (!member) {
        return safeReply(interaction, 
          cv2Reply({
            description: "❌ Ez a felhasználó nincs a szerveren!",
            isError: true,
          }),
        );
      }

      if (!member.roles.cache.has(role.id)) {
        return safeReply(interaction, 
          cv2Reply({
            description: `❌ **${target.username}**-nak nincs ilyen rangja!`,
            isError: true,
          }),
        );
      }

      try {
        await member.roles.remove(
          role,
          `Elvette: ${interaction.user.username}`,
        );
        await safeReply(
          interaction,
          cv2Reply({
            title: "✅ Rang elvéve!",
            description: `${role} rang elvéve: **${target.username}**`,
          }),
        );
      } catch (e) {
        console.error("[role] take hiba:", e);
        await safeReply(interaction, 
          cv2Reply({
            description: "❌ Nem sikerült elvenni a rangot!",
            isError: true,
          }),
        );
      }
    } else if (sub === "list") {
      const roles = [...interaction.guild.roles.cache.values()]
        .filter((r) => r.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position);

      const lines = roles
        .slice(0, 30)
        .map(
          (r) =>
            `${r} — \`${r.id}\` — ${r.members.size} tag${r.managed ? " _(bot)_" : ""}`,
        );
      if (roles.length > 30)
        lines.push(`\n_… és még ${roles.length - 30} rang._`);

      await safeReply(
        interaction,
        cv2Reply({
          title: `🎭 Rangok (${roles.length})`,
          description: lines.join("\n") || "Nincsenek rangok.",
        }),
      );
    }
  },
};
