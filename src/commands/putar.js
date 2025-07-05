import { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, EmbedBuilder, MessageFlags, ButtonBuilder, ButtonStyle } from 'discord.js';

function isSupportedUrl(url) {
    const supportedDomains = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be|spotify\.com|soundcloud\.com)\/.+/;
    return supportedDomains.test(url);
}

export default {
    data: new SlashCommandBuilder()
        .setName('putar')
        .setDescription('Gas putar atau cari lagu favoritmu.')
        .addStringOption(option =>
            option.setName('lagu')
                .setDescription('Masukin judul lagu atau link dari YT, Spotify, dll.')
                .setRequired(true)),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: 'Masuk voice channel dulu, bro!', flags: [MessageFlags.Ephemeral] });
        }
        
        const queue = interaction.client.distube.getQueue(interaction.guild);
        if (queue && queue.songs.length > 0) {
             return interaction.reply({ content: 'Udah ada lagu yang muter, bro! Pake tombol `➕ Tambah Lagu` di embed ya.', flags: [MessageFlags.Ephemeral] });
        }
        if (queue && queue.voice.channel && interaction.member.voice.channel?.id !== queue.voice.channel.id) {
            return interaction.reply({ content: `Woy, gw lagi dipake di channel <#${queue.voice.channel.id}>. Masuk situ aja atau tungguin, ya!`, flags: [MessageFlags.Ephemeral] });
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        
        const query = interaction.options.getString('lagu');

        if (isSupportedUrl(query)) {
            await interaction.editReply({ content: `🎵 Oke, langsung gas dari URL...` });
            try {
                await interaction.client.distube.play(voiceChannel, query, { member: interaction.member, textChannel: interaction.channel });
            } catch (error) {
                await interaction.editReply({ content: `❌ Link-nya bermasalah nih, gabisa diputar. Coba yang lain.` });
            }
            return;
        }

        try {
            const results = await interaction.client.distube.search(query, { limit: 10 });
            if (!results || results.length === 0) {
                return interaction.editReply({ content: `❌ Ga nemu apa-apa buat "${query}". Coba kata kunci lain.` });
            }
            
            const searchEmbed = new EmbedBuilder()
                 .setColor("#FF007F")
                 .setAuthor({ name: `Hasil Pencarian buat: "${query}"`})
                 .setDescription("Nih hasilnya, pilih satu di bawah, sabi kali~")
                 .setFooter({text: "Cuma kamu yang bisa liat ini."});

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('Youtube_select')
                .setPlaceholder('Pilih satu dari 10 lagu...')
                .addOptions(results.map((song, index) => new StringSelectMenuOptionBuilder().setLabel(`${index + 1}. ${song.name}`.substring(0, 100)).setDescription(`${song.uploader.name} | ${song.formattedDuration}`.substring(0, 100)).setValue(song.url).setEmoji('🎶')));

            const cancelButton = new ButtonBuilder().setCustomId('cancel_search').setLabel('Batal').setEmoji('❌').setStyle(ButtonStyle.Danger);
            const selectRow = new ActionRowBuilder().addComponents(selectMenu);
            const buttonRow = new ActionRowBuilder().addComponents(cancelButton);
            
            await interaction.editReply({ embeds: [searchEmbed], components: [selectRow, buttonRow] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: `❌ Waduh, error pas nyari lagu. Coba lagi nanti.` });
        }
    },
};