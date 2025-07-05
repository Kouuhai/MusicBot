import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const colorPalette = [ '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFA1', '#FFC300', '#FF3333', '#33FFF3', '#F333FF' ];
export const TEMP_MESSAGE_DURATION = 15000;

export function sendTempMessage(channel, content) {
    if (!channel) return;
    channel.send(content)
        .then(msg => { setTimeout(() => msg.delete().catch(() => {}), TEMP_MESSAGE_DURATION); })
        .catch(console.error);
}

function createProgressBar(queue) {
    if (!queue || !queue.songs.length) return { bar: '[ ─ ]', time: '00:00 / 00:00' };
    const current = queue.currentTime;
    const total = queue.songs[0].duration;
    const formatTime = (time) => new Date(time * 1000).toISOString().slice(11, 19).replace(/^00:/, '');
    const timeString = `${formatTime(current)} / ${formatTime(total)}`;
    const size = 20;
    const progress = Math.max(0, Math.min(size, Math.round((size * current) / total)));
    const emptyProgress = size - progress;
    const bar = '─'.repeat(progress) + '🔘' + '─'.repeat(emptyProgress);
    return { bar: `[ ${bar} ]`, time: timeString };
}

export async function refreshPlayer(queue) {
    if (!queue || !queue.textChannel || !queue.songs || queue.songs.length === 0) {
        const cleanup = queue?.client?.distube.listeners('cleanup')?.[0];
        if (cleanup) cleanup(queue);
        return;
    }
    
    if (typeof queue.colorIndex !== 'number' || isNaN(queue.colorIndex)) queue.colorIndex = 0;

    const createMessagePayload = (currentQueue) => {
        const song = currentQueue.songs[0];
        if (!song) return null;

        const statusModes = ['Off', 'Lagu', 'Antrian'];
        const progress = createProgressBar(currentQueue);
        const activeFilters = currentQueue.filters.names.join(', ') || 'Off';
        const djModeStatus = currentQueue.djMode ? 'Aktif' : 'Nonaktif';
        const statusText = `Volume: ${currentQueue.volume}% | Loop: ${statusModes[currentQueue.repeatMode]} | DJ: ${djModeStatus}`;
        const nextSong = currentQueue.songs[1];
        const nextSongText = nextSong ? `Berikutnya: ${nextSong.name.substring(0, 35)}...` : (currentQueue.autoplay ? 'Autoplay...' : 'Antrian selesai.');
        const footerText = `Antrian: ${currentQueue.songs.length} lagu | ${nextSongText}`;
        const likeCount = currentQueue.songLikes?.get(song.id)?.size || 0;
        const likeEmoji = likeCount > 0 ? '❤️' : '🤍';
        const likeStyle = likeCount > 0 ? ButtonStyle.Danger : ButtonStyle.Primary;
        
        let chatText = '*Klik 💬 untuk mulai chat...*';
        if (currentQueue.liveChatMessages && currentQueue.liveChatMessages.length > 0) {
            chatText = currentQueue.liveChatMessages.map(msg => `> 💬 *${msg.user}:* ${msg.text}`).join('\n');
        }

        const embed = new EmbedBuilder()
            .setColor(colorPalette[currentQueue.colorIndex % colorPalette.length])
            .setAuthor({ name: `Diminta oleh: ${song.user.username}`, iconURL: song.user.displayAvatarURL() })
            .setTitle(song.name).setURL(song.url).setImage(song.thumbnail)
            .setFields(
                { name: '🎙️ Artis / Uploader', value: `[${song.uploader.name}](${song.uploader.url})`, inline: true },
                { name: '⏳ Durasi', value: `\`${song.formattedDuration}\``, inline: true },
                { name: '❤️ Disukai', value: `\`${likeCount} orang\``, inline: true },
                { name: `\u200b`, value: `**${progress.bar}**\n\`${progress.time}\`` },
                { name: '🎤 Live Chat', value: chatText },
                { name: '⚙️ Status', value: `\`${statusText}\`` },
                { name: '🎚️ Efek Aktif', value: `\`${activeFilters}\`` }
            )
            .setFooter({ text: footerText, iconURL: currentQueue.client.user.displayAvatarURL() }).setTimestamp();
        
        let loopStyle = ButtonStyle.Secondary;
        if (currentQueue.repeatMode === 1) loopStyle = ButtonStyle.Primary;
        if (currentQueue.repeatMode === 2) loopStyle = ButtonStyle.Success;

        const row1_Playback = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rewind_song').setLabel('Mundur').setEmoji('⏪').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('play_pause').setLabel(currentQueue.paused ? 'Play' : 'Pause').setEmoji(currentQueue.paused ? '▶️' : '⏸️').setStyle(currentQueue.paused ? ButtonStyle.Success : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('forward_song').setLabel('Maju').setEmoji('⏩').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('skip_song').setLabel('Skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('stop_bot').setLabel('Stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger)
        );
        
        const row2_Actions = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('like_song').setLabel('Suka').setEmoji(likeEmoji).setStyle(likeStyle),
            new ButtonBuilder().setCustomId('toggle_autoplay').setLabel('Autoplay').setEmoji('🎶').setStyle(currentQueue.autoplay ? ButtonStyle.Success : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('toggle_loop').setLabel('Loop').setEmoji('🔁').setStyle(loopStyle),
            new ButtonBuilder().setCustomId('show_queue').setLabel('Antrian').setEmoji('📜').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('add_song_button').setLabel('Tambah Lagu').setEmoji('➕').setStyle(ButtonStyle.Success)
        );
        
        const row3_Settings = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('volume_button').setLabel('Volume').setEmoji('🔊').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('audio_effects_button').setLabel('Kontrol Lanjutan').setEmoji('🎚️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('live_chat_button').setLabel('Live Chat').setEmoji('💬').setStyle(ButtonStyle.Primary)
        );

        return { embeds: [embed], components: [row1_Playback, row2_Actions, row3_Settings] };
    };
    
    try {
        const payload = createMessagePayload(queue);
        if (!payload) return;
        if (queue.nowPlayingMessage?.editable) {
            await queue.nowPlayingMessage.edit(payload);
        } else {
            const msg = await queue.textChannel.send(payload);
            queue.nowPlayingMessage = msg;
        }
    } catch (error) {
        console.error("Error di refreshPlayer:", error);
    }
}