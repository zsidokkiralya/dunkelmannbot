const { SlashCommandBuilder } = require('discord.js');
const music = require('../utils/musicManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Lejátszás folytatása'),
    async execute(interaction) {
        await music.resume(interaction);
    }
};
