const { SlashCommandBuilder } = require('discord.js');
const music = require('../utils/musicManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Zene lejátszása a BeatCloudról')
        .addStringOption(o => o.setName('url').setDescription('A BeatCloud zenelink').setRequired(true)),
    async execute(interaction) {
        const url = interaction.options.getString('url');
        await music.play(interaction, url);
    }
};
