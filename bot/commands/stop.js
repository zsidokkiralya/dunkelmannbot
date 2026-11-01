const { SlashCommandBuilder } = require('discord.js');
const music = require('../utils/musicManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Lejátszás megállítása'),
    async execute(interaction) {
        await music.stop(interaction);
    }
};
