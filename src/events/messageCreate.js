import { Events, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createHelpEmbed } from '../commands/help.js';

const prefix = '!';

export default {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const client = message.client;
        
        const voiceChannel = message.member?.voice?.channel;
        const queue = client.distube.getQueue(message.guild);

        const canExecuteMusicCommand = () => {
            if (!voiceChannel) {
                message.reply('Masuk voice channel dulu, bro!').catch(() => {});
                return false;
            }
            if (queue && queue.voice.channel && voiceChannel.id !== queue.voice.channel.id) {
                message.reply(`Woy, gw lagi dipake di channel <#${queue.voice.channel.id}>.`).catch(() => {});
                return false;
            }
            return true;
        };
        
        switch (commandName) {
            case 'help': {
                const helpEmbed = createHelpEmbed(client);
                try {
                    await message.author.send({ embeds: [helpEmbed] });
                    const replyMsg = await message.reply('Bantuan udah meluncur ke DM kamu! 🚀');
                    setTimeout(() => replyMsg.delete().catch(() => {}), 10000);
                } catch (error) {
                    const replyMsg = await message.reply({ content: 'Gabisa kirim DM, ini bantuannya ya:', embeds: [helpEmbed] });
                    setTimeout(() => replyMsg.delete().catch(() => {}), 60000);
                }
                break;
            }

            case 'p':
            case 'putar': {
                if (queue) {
                    return message.reply('Udah ada lagu yang muter, bro! Pake tombol `➕ Tambah Lagu` di embed ya, atau pake `/putar`.').then(msg => {
                        setTimeout(() => msg.delete().catch(() => {}), 10000);
                    });
                }
                if (!canExecuteMusicCommand()) return;
                
                const query = args.join(' ');
                if (!query) {
                    return message.reply('Kasih judul lagu atau link juga dong, bos.').catch(() => {});
                }

                try {
                    const results = await client.distube.search(query, { limit: 10 });
                    if (!results || results.length === 0) {
                        return message.reply(`❌ Ga nemu apa-apa buat "${query}".`);
                    }

                    const searchEmbed = new EmbedBuilder()
                        .setColor("#FF007F")
                        .setAuthor({ name: `Hasil Pencarian buat: "${query}"`, iconURL: message.author.displayAvatarURL() })
                        .setDescription("Pilih salah satu dari 10 lagu di bawah ini untuk diputar dalam 1 menit.");

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('prefix_search_select')
                        .setPlaceholder('Pilih satu dari 10 lagu...')
                        .addOptions(
                            results.map((song, index) =>
                                new StringSelectMenuOptionBuilder()
                                    .setLabel(`${index + 1}. ${song.name}`.substring(0, 100))
                                    .setDescription(`${song.uploader.name} | ${song.formattedDuration}`.substring(0, 100))
                                    .setValue(song.url)
                                    .setEmoji('🎶')
                            )
                        );
                    
                    const cancelButton = new ButtonBuilder()
                        .setCustomId('cancel_search')
                        .setLabel('Batal')
                        .setEmoji('❌')
                        .setStyle(ButtonStyle.Danger);

                    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
                    const buttonRow = new ActionRowBuilder().addComponents(cancelButton);

                    const searchMessage = await message.channel.send({ embeds: [searchEmbed], components: [selectRow, buttonRow] });

                    const collector = searchMessage.createMessageComponentCollector({
                        // Filter untuk StringSelect dan Button
                        filter: (i) => i.user.id === message.author.id,
                        time: 60_000
                    });

                    collector.on('end', collected => {
                        // Hanya edit jika tidak ada interaksi sama sekali
                        if (collected.size === 0) {
                            searchMessage.edit({
                                content: 'Waduh, udah nungguin tapi kagak diputer, reset dah... gas search lagi cuy!',
                                embeds: [],
                                components: []
                            }).catch(() => {});
                        }
                    });

                } catch (error) {
                    console.error("Error di perintah !putar:", error);
                    message.reply('Waduh, ada error nih pas nyari lagunya.').catch(() => {});
                }
                break;
            }

            case 'volume':
            case 'vol': {
                if (!canExecuteMusicCommand()) return;
                if (!queue) return message.reply('Lagi ga ada musik yang nyala, bos.');
                
                const volume = parseInt(args[0]);
                if (isNaN(volume) || volume < 0 || volume > 150) {
                    return message.reply('Kasih angka volume antara 0-150, dong.');
                }
                
                queue.setVolume(volume);
                message.reply(`🔊 Volume sekarang diatur ke **${volume}%**`).then(msg => {
                    setTimeout(() => msg.delete().catch(() => {}), 10000);
                });
                break;
            }
                
            case 'ping': {
                message.channel.send('Pinging...').then(sent => {
                    sent.edit(`🏓 Pong! Kecepatan respon lo ke gw ${sent.createdTimestamp - message.createdTimestamp}ms. Ping gw ke Discord ${Math.round(client.ws.ping)}ms.`);
                });
                break;
            }
        }
    },
};