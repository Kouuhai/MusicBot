import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class MusicControls {
    static createButtons() {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_pause_resume')
                    .setLabel('⏯️ Jeda/Lanjut')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('music_skip')
                    .setLabel('⏭️ Lewati')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('music_stop')
                    .setLabel('⏹️ Berhenti')
                    .setStyle(ButtonStyle.Danger)
            );

        return row;
    }

    static async handleButtonInteraction(interaction) {
        const member = interaction.member;
        const distube = interaction.client.distube;

        if (!member.voice.channel) {
            return await interaction.reply({
                content: '❌ Kamu harus berada di voice channel untuk mengontrol musik!',
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
            switch (interaction.customId) {
                case 'music_pause_resume':
                    if (queue.paused) {
                        await distube.resume(interaction.guild.id);
                        await interaction.reply({
                            content: '▶️ **Musik dilanjutkan!**',
                            ephemeral: true
                        });
                    } else {
                        await distube.pause(interaction.guild.id);
                        await interaction.reply({
                            content: '⏸️ **Musik dijeda!**',
                            ephemeral: true
                        });
                    }
                    break;

                case 'music_skip':
                    const skippedSong = queue.songs[0]?.name || 'Tidak diketahui';
                    await distube.skip(interaction.guild.id);
                    await interaction.reply({
                        content: `⏭️ **Dilewati:** ${skippedSong}`,
                        ephemeral: true
                    });
                    break;

                case 'music_stop':
                    await distube.stop(interaction.guild.id);
                    await interaction.reply({
                        content: '⏹️ **Musik dihentikan dan antrian dibersihkan!**',
                        ephemeral: true
                    });
                    break;

                default:
                    await interaction.reply({
                        content: '❌ Tombol tidak dikenal!',
                        ephemeral: true
                    });
            }
        } catch (error) {
            console.error('Error saat menangani button interaction:', error);
            await interaction.reply({
                content: '❌ Terjadi kesalahan saat memproses kontrol musik!',
                ephemeral: true
            });
        }
    }
}