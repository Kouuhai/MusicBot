import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Atur volume musik (0-150).')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Level volume baru (angka antara 0 - 150)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(150)
        ),
    async execute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction.guild);
        if (!queue) return interaction.reply({ content: 'Lagi ga ada musik yang nyala, bos.', flags: [MessageFlags.Ephemeral] });
        if (interaction.member.voice.channel?.id !== queue.voice.channel?.id) return interaction.reply({ content: `Masuk ke channel <#${queue.voice.channel.id}> dulu!`, flags: [MessageFlags.Ephemeral] });
        
        const volume = interaction.options.getInteger('level');
        queue.setVolume(volume);
        
        await interaction.reply({ content: `🔊 Volume sekarang diatur ke **${volume}%**`, flags: [MessageFlags.Ephemeral] });
    },
};