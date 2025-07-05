import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Ngintip antrian lagu yang nunggu giliran.'),
    async execute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction.guild);
        if (!queue || queue.songs.length === 0) {
            return interaction.reply({ content: 'Antrian kosong, sabi kali nambah lagu~', flags: [MessageFlags.Ephemeral] });
        }
        
        const q = queue.songs.map((song, i) => {
            if (i === 0) {
                return `▶️ **Now Playing:** [${song.name}](${song.url}) - \`${song.formattedDuration}\``;
            }
            return `**${i}.** [${song.name}](${song.url}) - \`${song.formattedDuration}\``;
        }).slice(0, 10).join('\n\n'); // Beri spasi antar lagu

        const queueEmbed = new EmbedBuilder()
            .setColor('#1DB954')
            .setTitle('📜 Antrian Saat Ini')
            .setDescription(q)
            .setFooter({ text: `Total lagu: ${queue.songs.length} | Total durasi: ${queue.formattedDuration}`});
            
        await interaction.reply({ embeds: [queueEmbed], flags: [MessageFlags.Ephemeral] });
    },
};