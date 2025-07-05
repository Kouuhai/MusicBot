import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Cek kecepatan respon bot.'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        interaction.editReply(`🏓 Pong! Kecepatan respon lo ke gw ${sent.createdTimestamp - interaction.createdTimestamp}ms. Ping gw ke Discord ${Math.round(interaction.client.ws.ping)}ms.`);
    },
};