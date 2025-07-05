import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('berhenti')
        .setDescription('Berhenti memutar musik dan hapus semua antrian'),

    async execute(interaction) {
        const member = interaction.member;
        const distube = interaction.client.distube;

        if (!member.voice.channel) {
            return await interaction.reply({
                content: '❌ Kamu harus berada di voice channel untuk menghentikan musik!',
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

        try {
            await distube.stop(interaction.guild.id);
            
            await interaction.reply({
                content: '⏹️ **Musik dihentikan dan antrian dibersihkan!**'
            });
        } catch (error) {
            console.error('Error saat menghentikan musik:', error);
            await interaction.reply({
                content: '❌ Terjadi kesalahan saat menghentikan musik!',
                ephemeral: true
            });
        }
    },
};