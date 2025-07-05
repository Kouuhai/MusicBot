import { SlashCommandBuilder, MessageFlags } from 'discord.js';

// URL Lofi Girl stream yang stabil
const lofiURL = 'https://www.youtube.com/watch?v=jfKfPfyJRdk';

export default {
    data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('Nyalain atau matiin radio lofi 24/7.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('on')
                .setDescription('Nyalain radio lofi 24/7 nonstop.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('off')
                .setDescription('Matiin mode radio 24/7.')),

    async execute(interaction) {
        const { client, guild, member } = interaction;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'Masuk voice channel dulu buat nyalain radio, bro!', flags: [MessageFlags.Ephemeral] });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'on') {
            await interaction.deferReply();

            try {
                // Memainkan stream dengan opsi khusus agar tidak keluar saat channel kosong
                await client.distube.play(voiceChannel, lofiURL, {
                    member: member,
                    textChannel: interaction.channel,
                    leaveOnEmpty: false // INI KUNCINYA!
                });
                
                await interaction.editReply("✅ Siap! Nih radio chill 24/7, santuy aja gaskeun 📻");

            } catch (error) {
                console.error("Error saat menyalakan radio:", error);
                await interaction.editReply({ content: 'Waduh, ada masalah pas nyoba nyalain radio.' });
            }
        } 
        
        else if (subcommand === 'off') {
            const queue = client.distube.getQueue(guild);
            
            if (!queue) {
                return interaction.reply({ content: 'Radio emang lagi gak nyala, bro.', flags: [MessageFlags.Ephemeral] });
            }

            // Validasi tambahan: pastikan yang dihentikan benar-benar radio
            if (queue.songs[0].url !== lofiURL) {
                return interaction.reply({ content: 'Lagi muter lagu biasa, bukan mode radio. Pake `/stop` aja buat berhenti.', flags: [MessageFlags.Ephemeral] });
            }

            await queue.stop();
            await interaction.reply({ content: '🛑 Oke, mode radio 24/7 udah dimatiin. Bot akan keluar kalo sepi.' });
        }
    },
};