const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const { cv2Reply } = require("../utils/embedBuilder");

const CATEGORIES = {
  general: {
    label: "🔧 Általános",
    description: "Alapvető parancsok",
    commands: [
      { name: "/help", desc: "Ez a súgó" },
      { name: "/ping", desc: "Válaszidő mérés" },
      { name: "/stats", desc: "Bot statisztikák" },
      { name: "/devs", desc: "Fejlesztői csapat" },
    ],
  },
  fun: {
    label: "🎭 Szórakozás",
    description: "Szórakoztató parancsok",
    commands: [
      { name: "/meme", desc: "Random mém" },
      { name: "/joke", desc: "Random vicc" },
      { name: "/coinflip", desc: "Pénzfeldobás" },
      { name: "/8ball", desc: "Sors dönt" },
    ],
  },
  info: {
    label: "🔍 Információ",
    description: "Lekérdező parancsok",
    commands: [
      { name: "/avatar", desc: "Profilkép" },
      { name: "/userinfo", desc: "Felhasználói adatok" },
      { name: "/serverinfo", desc: "Szerver adatok" },
      { name: "/roleinfo", desc: "Rang adatok" },
      { name: "/permscheck", desc: "Egy rang összes jogosultsága" },
      { name: "/whois", desc: "Domain WHOIS" },
      { name: "/ipinfo", desc: "IP cím info" },
      { name: "/screenshot", desc: "Weboldal screenshot" },
    ],
  },
  music: {
    label: "🎵 Zene",
    description: "Zenei parancsok",
    commands: [
      { name: "/play", desc: "Zene lejátszása" },
      { name: "/stop", desc: "Megállítás" },
      { name: "/resume", desc: "Folytatás" },
    ],
  },
  moderation: {
    label: "🛡️ Moderáció",
    description: "Moderátori parancsok",
    commands: [
      { name: "/ban", desc: "Tag kitiltása" },
      { name: "/kick", desc: "Tag kirúgása" },
      { name: "/timeout", desc: "Tag elnémítása" },
      { name: "/warn", desc: "Figyelmeztetések" },
      { name: "/clear", desc: "Üzenetek törlése" },
      { name: "/lock", desc: "Csatorna zárolása" },
      { name: "/slowmode", desc: "Lassított mód" },
      { name: "/snipe", desc: "Törölt üzenet visszanézés" },
      { name: "/say", desc: "Bot nevében üzenet" },
    ],
  },
  events: {
    label: "🎁 Események",
    description: "Esemény parancsok",
    commands: [
      { name: "/poll", desc: "Szavazás" },
      { name: "/giveaway", desc: "Nyereményjáték" },
      { name: "/remind", desc: "Emlékeztető" },
    ],
  },
  settings: {
    label: "⚙️ Beállítások",
    description: "Szerver beállítások",
    commands: [
      { name: "/profanity", desc: "Káromkodás szűrő" },
      { name: "/invitefilter", desc: "Invite szűrő" },
      { name: "/emojifilter", desc: "Emoji szűrő" },
      { name: "/virustotal", desc: "VirusTotal védelem" },
      { name: "/counting", desc: "Számolós játék" },
    ],
  },
  admin: {
    label: "👑 Admin",
    description: "Admin parancsok",
    commands: [
      { name: "/role", desc: "Rang kezelés" },
      { name: "/channel", desc: "Csatorna kezelés" },
      { name: "/category", desc: "Kategória kezelés" },
      { name: "/ticket", desc: "Ticket rendszer" },
      { name: "/ticketpanel", desc: "Ticket panel" },
    ],
  },
};

function buildSelectMenu(selected = null) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("help_category")
    .setPlaceholder("Válassz egy kategóriát...");

  for (const [id, cat] of Object.entries(CATEGORIES)) {
    const opt = new StringSelectMenuOptionBuilder()
      .setValue(id)
      .setLabel(cat.label)
      .setDescription(cat.description);
    if (selected === id) opt.setDefault(true);
    menu.addOptions(opt);
  }

  return new ActionRowBuilder().addComponents(menu);
}

function buildHelpCategoryMessage(categoryId) {
  const cat = CATEGORIES[categoryId] || CATEGORIES.general;
  const id = CATEGORIES[categoryId] ? categoryId : "general";

  const cmdList = cat.commands
    .map((c) => `\`${c.name}\` — ${c.desc}`)
    .join("\n");

  return cv2Reply({
    title: cat.label,
    description: cmdList,
    footer: "válassz kategóriát",
    actionRows: [buildSelectMenu(id)],
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Parancsok listája"),

  async execute(interaction) {
    await interaction.reply(
      cv2Reply({
        title: "📖 Dunkelmann — Súgó",
        description: "Válassz egy kategóriát lentről!",
        actionRows: [buildSelectMenu()],
      }),
    );
  },

  buildHelpCategoryMessage,
};
