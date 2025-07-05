import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('jeda')
        .setDescription('Jeda lagu yang sedang diputar'),

    async execute(interaction) {
        const member = interaction.member;
        const distube = interaction.client.distube;

        if (!member.voice.channel) {
            return await interaction.reply({
                content: '❌ Kamu harus berada di voice channel untuk menjeda musik!',
                ephemeral: true
            });
        }

        const queue = distube.getQueue(interaction.guild.id);
        if (!queue) {
            return await interaction.reply({
                content: '❌ Tidak ada musik yang sedang diputar saat ini!',
                ephemeral: true
            });
        }

        if (queue.paused) {
            return await interaction.reply({
                content: '❌ Musik sudah dalam keadaan dijeda!',
                ephemeral: true
            });
        }

        try {
            await distube.pause(interaction.guild.id);
            
            await interaction.reply({
                content: '⏸️ **Musik dijeda!**'
            });
        } catch (error) {
            console.error('Error saat menjeda musik:', error);
            await interaction.reply({
                content: '❌ Terjadi kesalahan saat menjeda musik!',
                ephemeral: true
            });
        }
    },
};