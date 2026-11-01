const { SlashCommandBuilder } = require("discord.js");
const { cv2Reply } = require("../utils/embedBuilder");

const VALID = [
  "Határozottan igen!",
  "Minden jel erre mutat.",
  "Igen, biztos!",
  "Számíthatsz rá!",
  "A kilátások jók.",
];

const NEUTRAL = [
  "Most nem tudok válaszolni, próbáld újra!",
  "Kérdezd meg később!",
  "Jobb, ha most nem válaszolok.",
  "Nem egyértelmű.",
];

const NEGATIVE = [
  "Nem valószínű.",
  "Bizonyosan nem!",
  "Egyáltalán nem!",
  "A kilátások nem jók.",
  "Ne számíts rá!",
];

const ALL = [...VALID, ...NEUTRAL, ...NEGATIVE];

function getTone(answer) {
  if (VALID.includes(answer)) return "🟢";
  if (NEUTRAL.includes(answer)) return "🟡";
  return "🔴";
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Tedd fel a kérdésed, a sors válaszol")
    .addStringOption((o) =>
      o.setName("question").setDescription("A te kérdésed").setRequired(true),
    ),

  async execute(interaction) {
    const question = interaction.options.getString("question");
    const answer = ALL[Math.floor(Math.random() * ALL.length)];

    await interaction.reply(
      cv2Reply({
        title: "🎱 Magic 8 Ball",
        description: `**Kérdés:** ${question}\n\n**Válasz:** ${getTone(answer)} ${answer}`,
      }),
    );
  },
};
