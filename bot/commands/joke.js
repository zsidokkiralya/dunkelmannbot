const { SlashCommandBuilder } = require("discord.js");
const { cv2Reply } = require("../utils/embedBuilder");

const JOKES = [
  "Miért nem alszanak a favágók? Mert mindig fáradtak.",
  "Mit csinál az űrhajós, ha szomjas? Fúr egy űrkutat.",
  "Hogy hívják a medve testvérét? Ugyan úgy – nem változtatta meg a nevét.",
  "Milyen a jó kávé? Olyan mint a matektanár: erős és felpezsdít.",
  'Mit mond a programozó, ha elromlik az autója? „Kiszállok és újra beszállok, hátha megjavul."',
  "Mi a különbség a pingvinek és a fejlesztők között? A pingvinnek van társasági élete.",
  "Miért nem mondja el a tudós a jégbábu vicchét? Mert attól tart, hogy átmegy.",
  "Mit mond a naptár, mikor meglátja a pénzt? Havonta jön.",
  "Miért nem játszik a számítógép teniszt? Mert fél a vírusoktól.",
  "Hány fejlesztő kell egy villanykörte cseréjéhez? Egy, de előbb 3 hétig mondja, hogy az elektromos rendszer a hibás.",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("joke")
    .setDescription("Elsütök egy viccet"),

  async execute(interaction) {
    const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
    await interaction.reply(
      cv2Reply({
        title: "😂 Vicc",
        description: joke,
      }),
    );
  },
};
