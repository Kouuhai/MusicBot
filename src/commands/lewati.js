import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Lanjut ke lagu berikutnya di antrian.'),

    async execute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction.guild);

        // Validasi 1: Apakah ada antrian musik?
        if (!queue) {
            return interaction.reply({ 
                content: 'Lagi ga ada musik yang nyala, bos.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // Validasi 2: Apakah pengguna ada di voice channel yang sama?
        if (interaction.member.voice.channel?.id !== queue.voice.channel?.id) {
            return interaction.reply({ 
                content: `Masuk ke channel <#${queue.voice.channel.id}> dulu baru bisa skip!`, 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // Validasi 3: Apakah ini lagu terakhir?
        if (queue.songs.length <= 1 && !queue.autoplay) {
            return interaction.reply({ 
                content: 'Woy, ini lagu terakhir, mau skip kemana lagi? 😅', 
                flags: [MessageFlags.Ephemeral] 
            });
        }
        
        try {
            // Lakukan aksi skip
            await queue.skip();
            
            // Kirim konfirmasi
            await interaction.reply({ 
                content: '⏭️ Siap, lagu diskip!', 
                flags: [MessageFlags.Ephemeral] 
            });
        } catch (error) {
            console.error('Error saat skip lagu:', error);
            await interaction.reply({ 
                content: '❌ Gagal skip lagu, ada error nih.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }
    },
};