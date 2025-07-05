import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('antrian')
        .setDescription('Lihat antrian lagu saat ini'),

    async execute(interaction) {
        const distube = interaction.client.distube;
        const queue = distube.getQueue(interaction.guild.id);

        if (!queue || queue.songs.length === 0) {
            return await interaction.reply({
                content: '❌ Tidak ada lagu dalam antrian saat ini!',
                ephemeral: true
            });
        }

        const currentSong = queue.songs[0];
        const upcomingSongs = queue.songs.slice(1, 11); // Maksimal 10 lagu berikutnya

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🎵 Antrian Musik')
            .setThumbnail(currentSong.thumbnail)
            .setTimestamp()
            .setFooter({ text: 'By Kouhai' });

        // Lagu yang sedang diputar
        embed.addFields({
            name: '🎵 Sedang Diputar',
            value: `**[${currentSong.name}](${currentSong.url})**\n⏱️ ${currentSong.formattedDuration} | 👤 ${currentSong.user.displayName}`,
            inline: false
        });

        // Lagu selanjutnya
        if (upcomingSongs.length > 0) {
            const queueList = upcomingSongs.map((song, index) => 
                `**${index + 1}.** [${song.name}](${song.url})\n⏱️ ${song.formattedDuration} | 👤 ${song.user.displayName}`
            ).join('\n\n');

            embed.addFields({
                name: `📋 Selanjutnya (${upcomingSongs.length}/${queue.songs.length - 1})`,
                value: queueList.length > 1024 ? queueList.substring(0, 1021) + '...' : queueList,
                inline: false
            });
        }

        // Informasi tambahan
        embed.addFields(
            { name: '📊 Total Lagu', value: `${queue.songs.length}`, inline: true },
            { name: '🔊 Volume', value: `${queue.volume}%`, inline: true },
            { name: '🔄 Status', value: queue.paused ? '⏸️ Dijeda' : '▶️ Memutar', inline: true }
        );

        await interaction.reply({ embeds: [embed] });
    },
};