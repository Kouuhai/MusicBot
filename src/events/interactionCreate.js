import { Events, EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType, PermissionsBitField } from 'discord.js';
import { createHelpEmbed } from '../commands/help.js';
import { refreshPlayer, sendTempMessage } from '../utils/player.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        const client = interaction.client;
        const guild = interaction.guild;
        const member = interaction.member;

        const isDJ = () => member.permissions.has(PermissionsBitField.Flags.Administrator) || member.roles.cache.some(r => r.name.toLowerCase() === 'dj');

        // =================================================================
        // HANDLER UNTUK SLASH COMMANDS
        // =================================================================
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`Perintah "${interaction.commandName}" tidak ditemukan.`);
                return interaction.reply({ content: 'Waduh, perintah itu ga ada.', flags: [MessageFlags.Ephemeral] });
            }
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error pada perintah ${interaction.commandName}:`, error);
                const payload = { content: 'Waduh, ada yang error nih pas jalanin perintahnya!', flags: [MessageFlags.Ephemeral] };
                if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(()=>{});
                else await interaction.reply(payload).catch(()=>{});
            }
        }
        
        // =================================================================
        // HANDLER UNTUK TOMBOL (BUTTONS)
        // =================================================================
        else if (interaction.isButton()) {
            const { customId } = interaction;
            
            // Tombol yang tidak butuh antrian sama sekali
            if (customId === 'cancel_search') {
                return interaction.update({ content: 'Pencarian dibatalin, yaudah.', embeds: [], components: [] });
            }
            if (customId === 'add_song_button') {
                const modal = new ModalBuilder().setCustomId('add_song_modal').setTitle('Tambah Lagu via Pencarian');
                const songInput = new TextInputBuilder().setCustomId('song_input').setLabel("Judul Lagu").setStyle(TextInputStyle.Short).setPlaceholder('Tulus - Hati-Hati di Jalan').setRequired(true);
                return interaction.showModal(modal.addComponents(new ActionRowBuilder().addComponents(songInput)));
            }

            // Validasi umum untuk semua tombol musik lainnya
            const queue = client.distube.getQueue(guild);
            if (!member.voice.channel) return interaction.reply({ content: 'Masuk voice channel dulu, bro!', flags: [MessageFlags.Ephemeral] });
            if (!queue) return interaction.reply({ content: 'Lagi ga ada musik yang nyala, bos.', flags: [MessageFlags.Ephemeral] });
            if (queue.voice.channel.id !== member.voice.channel.id) return interaction.reply({ content: `Woy, gw lagi dipake di channel <#${queue.voice.channel.id}>. Masuk situ aja!`, flags: [MessageFlags.Ephemeral] });
            
            // Daftar tombol yang dilindungi oleh Mode DJ
            const djProtectedButtons = ['play_pause', 'skip_song', 'stop_bot', 'toggle_loop', 'toggle_autoplay', 'rewind_song', 'forward_song', 'volume_button', 'audio_effects_button', 'toggle_dj_mode_submenu', 'radio_button'];
            if (queue.djMode && djProtectedButtons.includes(customId) && !isDJ()) {
                return interaction.reply({ content: '🛡️ Mode DJ lagi aktif! Cuma admin atau yang punya role "DJ" yang bisa pake ini.', flags: [MessageFlags.Ephemeral] });
            }

            // Logika untuk setiap tombol
            try {
                // Tombol yang membalas langsung (bukan defer)
                if (customId === 'like_song') {
                    const song = queue.songs[0];
                    if (!song) return interaction.deferUpdate(); // Failsafe
                    if (!queue.songLikes.has(song.id)) queue.songLikes.set(song.id, new Set());
                    const likes = queue.songLikes.get(song.id);
                    const replyText = likes.has(interaction.user.id) ? (likes.delete(interaction.user.id), 'Yah, batal ngasih suka.. 💔') : (likes.add(interaction.user.id), 'Siipp, makasih udah suka lagu ini! ❤️');
                    await interaction.reply({ content: replyText, ephemeral: true });
                    await refreshPlayer(queue);
                    return;
                }
                if (customId === 'show_queue') {
                    const q = queue.songs.map((s, i) => `${i === 0 ? '▶️' : `**${i}.**`} ${s.name} - \`${s.formattedDuration}\``).slice(0, 10).join('\n');
                    const queueEmbed = new EmbedBuilder().setColor('#1DB954').setTitle('📜 Antrian Saat Ini').setDescription(q || 'Antrian kosong!').setFooter({ text: `Total lagu: ${queue.songs.length}`});
                    await interaction.reply({ embeds: [queueEmbed], ephemeral: true });
                    return;
                }
                if (customId === 'live_chat_button' || customId === 'volume_button' || customId === 'audio_effects_button') {
                    if (customId === 'live_chat_button') {
                        const modal = new ModalBuilder().setCustomId('live_chat_modal').setTitle('Kirim Pesan ke Live Chat');
                        const chatInput = new TextInputBuilder().setCustomId('chat_input').setLabel("Pesan Singkat (max 20 karakter)").setStyle(TextInputStyle.Short).setPlaceholder('Keren!').setMaxLength(20).setRequired(true);
                        await interaction.showModal(modal.addComponents(new ActionRowBuilder().addComponents(chatInput)));
                    } else if (customId === 'volume_button') {
                        const modal = new ModalBuilder().setCustomId('volume_modal').setTitle('Atur Volume Musik');
                        const volumeInput = new TextInputBuilder().setCustomId('volume_input').setLabel("Level Volume (angka 0 - 150)").setStyle(TextInputStyle.Short).setPlaceholder(`Volume saat ini: ${queue.volume}%`).setRequired(true);
                        await interaction.showModal(modal.addComponents(new ActionRowBuilder().addComponents(volumeInput)));
                    } else if (customId === 'audio_effects_button') {
                        const effects = ['lowbass', 'mediumbass', 'extremebass', 'nightcore', 'vaporwave', 'karaoke', 'flanger'];
                        const activeFilters = queue.filters.names;
                        const selectMenu = new StringSelectMenuBuilder().setCustomId('audio_effects_select').setPlaceholder('Pilih efek audio...').setMinValues(0).setMaxValues(effects.length).addOptions(effects.map(e => new StringSelectMenuOptionBuilder().setLabel(e.charAt(0).toUpperCase() + e.slice(1)).setValue(e).setEmoji('🎚️').setDefault(activeFilters.includes(e))));
                        const djButton = new ButtonBuilder().setCustomId('toggle_dj_mode_submenu').setLabel(queue.djMode ? 'Nonaktifkan DJ Mode' : 'Aktifkan DJ Mode').setEmoji('🛡️').setStyle(queue.djMode ? ButtonStyle.Success : ButtonStyle.Secondary);
                        await interaction.reply({ content: 'Menu Kontrol Lanjutan', components: [new ActionRowBuilder().addComponents(selectMenu), new ActionRowBuilder().addComponents(djButton)], ephemeral: true });
                    }
                    return;
                }

                // Aksi yang mengubah state dan butuh deferUpdate
                await interaction.deferUpdate();
                let ephemeralFeedback = null;
                
                switch(customId) {
                    case 'skip_song':
                        if (queue.songs.length <= 1 && !queue.autoplay) {
                            ephemeralFeedback = 'Woy, ini lagu terakhir, mau skip kemana lagi? 😅';
                        } else {
                            await queue.skip();
                        }
                        break;
                    case 'toggle_dj_mode_submenu':
                        queue.djMode = !queue.djMode;
                        ephemeralFeedback = `🛡️ Mode DJ sekarang **${queue.djMode ? 'AKTIF' : 'NONAKTIF'}**!`;
                        break;
                    case 'play_pause': queue.paused ? queue.resume() : queue.pause(); break;
                    case 'stop_bot': await queue.stop(); break;
                    case 'toggle_loop': queue.setRepeatMode(); ephemeralFeedback = `🔁 | Siap! Mode loop sekarang: **${['Off', 'Lagu', 'Antrian'][queue.repeatMode]}**!`; break;
                    case 'toggle_autoplay': queue.toggleAutoplay(); ephemeralFeedback = `🎶 Autoplay sekarang **${queue.autoplay ? 'AKTIF' : 'NONAKTIF'}**!`; break;
                    case 'rewind_song': await queue.seek(Math.max(0, queue.currentTime - 10)); ephemeralFeedback = '⏪ Cuy lagunya mundur dikit, chill lagi dah'; break;
                    case 'forward_song': await queue.seek(Math.min(queue.songs[0].duration - 1, queue.currentTime + 10)); ephemeralFeedback = '⏩ Gas geser ke depan lagunya, biar cepet klimaks cuy'; break;
                }
                
                await refreshPlayer(queue);
                if (ephemeralFeedback) await interaction.followUp({ content: ephemeralFeedback, ephemeral: true });

            } catch (error) { console.error("Error tombol:", error); }
        }
        
        else if (interaction.isModalSubmit()) {
            const queue = client.distube.getQueue(guild);
            if (interaction.customId === 'add_song_modal') {
                const query = interaction.fields.getTextInputValue('song_input');
                const voiceChannel = member.voice.channel;
                if (!voiceChannel) return interaction.reply({ content: 'Masuk VC dulu buat nambah lagu!', flags: [MessageFlags.Ephemeral] });
                await interaction.reply({ content: `🔍 Oke, gw cariin "${query}"...`, ephemeral: true });
                try {
                    const results = await client.distube.search(query, { limit: 10 });
                    if (!results.length) return interaction.editReply({ content: `❌ Ga nemu apa-apa buat "${query}".` });
                    const searchEmbed = new EmbedBuilder().setColor("#FF007F").setAuthor({ name: `Hasil Pencarian buat: "${query}"`}).setDescription("Nih hasilnya, pilih satu di bawah, sabi kali~");
                    const selectMenu = new StringSelectMenuBuilder().setCustomId('Youtube_select').setPlaceholder('Pilih satu dari 10 lagu...').addOptions(results.map((s, i) => new StringSelectMenuOptionBuilder().setLabel(`${i+1}. ${s.name}`.slice(0,100)).setDescription(`${s.uploader.name} | ${s.formattedDuration}`.slice(0,100)).setValue(s.url).setEmoji('🎶')));
                    const cancelBtn = new ButtonBuilder().setCustomId('cancel_search').setLabel('Batal').setStyle(ButtonStyle.Danger).setEmoji('❌');
                    await interaction.editReply({ content: "", embeds: [searchEmbed], components: [new ActionRowBuilder().addComponents(selectMenu), new ActionRowBuilder().addComponents(cancelBtn)] });
                } catch (e) { await interaction.editReply({ content: `❌ Waduh, error pas nyari lagu.` }); }
            }
            if (interaction.customId === 'volume_modal') {
                if (!queue) return interaction.reply({ content: 'Sesi musik udah berakhir.', flags: [MessageFlags.Ephemeral] });
                if (queue.djMode && !isDJ()) return interaction.reply({ content: '🛡️ Mode DJ aktif, gabisa ganti volume.', flags: [MessageFlags.Ephemeral] });
                const volumeLevel = interaction.fields.getTextInputValue('volume_input');
                const volume = parseInt(volumeLevel);
                if (isNaN(volume) || volume < 0 || volume > 150) return interaction.reply({ content: 'Waduh, masukin angka antara 0-150 aja ya.', flags: [MessageFlags.Ephemeral] });
                await queue.setVolume(volume);
                await interaction.reply({ content: `Oke volume udah gue atur jadi **${volume}%** bro!`, flags: [MessageFlags.Ephemeral] });
                await refreshPlayer(queue);
            }
            if (interaction.customId === 'live_chat_modal') {
                if (!queue || !queue.playing) return interaction.reply({ content: 'Lagu udah keburu berhenti.', ephemeral: true });
                const chatMessage = interaction.fields.getTextInputValue('chat_input');
                if (!queue.liveChatMessages) queue.liveChatMessages = [];
                queue.liveChatMessages.push({ user: interaction.user.username, text: chatMessage, timestamp: Date.now() });
                if (queue.liveChatMessages.length > 3) queue.liveChatMessages.shift();
                await interaction.reply({ content: 'Pesan terkirim!', ephemeral: true });
                await refreshPlayer(queue);
            }
        }

        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'audio_effects_select') {
                const queue = client.distube.getQueue(guild);
                if (!queue) return interaction.update({ content: 'Sesi musik sudah berakhir.', components: [] }).catch(()=>{});
                if (queue.djMode && !isDJ()) return interaction.reply({ content: '🛡️ Mode DJ aktif, cuma DJ yang bisa ganti efek.', flags: [MessageFlags.Ephemeral] });
                await queue.filters.set(interaction.values);
                await interaction.update({ content: `✅ Efek audio diupdate!`, components: [] });
                await refreshPlayer(queue);
            }
            
            if (interaction.customId === 'Youtube_select' || interaction.customId === 'prefix_search_select') {
                const voiceChannel = member.voice.channel;
                if (!voiceChannel) return interaction.reply({ content: 'Masuk VC dulu buat milih lagu!', flags: [MessageFlags.Ephemeral] });
                const queue = client.distube.getQueue(guild);
                if (queue && queue.voice.channel && voiceChannel.id !== queue.voice.channel.id) {
                    return interaction.reply({ content: `Woy, gw lagi dipake di channel <#${queue.voice.channel.id}>.`, flags: [MessageFlags.Ephemeral] });
                }
                const selectedUrl = interaction.values[0];
                await interaction.update({ content: `✅ Oke, pilihan diterima! Gas masuk antrian...`, embeds: [], components: [] });
                
                if (interaction.customId === 'prefix_search_select' && interaction.message.deletable) {
                    setTimeout(() => interaction.message.delete().catch(()=>{}), 1000);
                }
                try { 
                    await client.distube.play(voiceChannel, selectedUrl, { member: member, textChannel: interaction.channel }); 
                } catch (e) { 
                    sendTempMessage(interaction.channel, `❌ Gagal muter lagu pilihanmu.`); 
                }
            }
        }
    },
};