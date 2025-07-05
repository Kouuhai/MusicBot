import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('lanjut')
        .setDescription('Lanjutkan musik yang sedang dijeda'),

    async execute(interaction) {
        const member = interaction.member;
        const distube = interaction.client.distube;

        if (!member.voice.channel) {
            return await interaction.reply({
                content: '❌ Kamu harus berada di voice channel untuk melanjutkan musik!',
                ephemeral: true
            });
        }

        const queue = distube.getQueue(interaction.guild.id);
        if (!queue) {
            return await interaction.reply({
                content: '❌ Tidak ada musik dalam antrian!',
                ephemeral: true
            });
        }

        if (!queue.paused) {
            return await interaction.reply({
                content: '❌ Musik tidak dalam keadaan dijeda!',
                ephemeral: true
            });
        }

        try {
            await distube.resume(interaction.guild.id);
            
            await interaction.reply({
                content: '▶️ **Musik dilanjutkan!**'
            });
        } catch (error) {
            console.error('Error saat melanjutkan musik:', error);
            await interaction.reply({
                content: '❌ Terjadi kesalahan saat melanjutkan musik!',
                ephemeral: true
            });
        }
    },
};