import { Events } from 'discord.js';
import { sendTempMessage } from '../utils/player.js';

export default {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        // Abaikan jika yang bergerak adalah bot itu sendiri
        if (newState.member.user.bot) return;

        const queue = newState.client.distube.getQueue(newState.guild.id);
        // Hentikan jika tidak ada musik yang berjalan
        if (!queue || !queue.voiceChannel) return;

        const botChannelId = queue.voice.channel.id;
        
        // Fungsi untuk menghitung anggota manusia
        const countHumanMembers = (channelId) => {
            const channel = newState.guild.channels.cache.get(channelId);
            return channel ? channel.members.filter(m => !m.user.bot).size : 0;
        };

        let humanCount = countHumanMembers(botChannelId);

        // Inisialisasi state jika belum ada
        if (typeof queue.lastChannelState === 'undefined') {
            queue.lastChannelState = 'initial';
        }

        // Kondisi 1: Menjadi sendirian
        if (humanCount === 1 && queue.lastChannelState !== 'lonely') {
            queue.lastChannelState = 'lonely';
            // Kirim pesan setelah 10 detik
            setTimeout(() => {
                sendTempMessage(queue.textChannel, `🤙 Lu sendirian aja bre, tenang gw temenin lu nge-chill.`);
            }, 10000);
        } 
        // Kondisi 2: Menjadi ramai dari yang tadinya sendirian
        else if (humanCount > 1 && queue.lastChannelState === 'lonely') {
            queue.lastChannelState = 'party';
            // Kirim pesan setelah 10 detik
            setTimeout(() => {
                 sendTempMessage(queue.textChannel, `🎉 Wih udah rame nih, gas nyanyi bareng cuy!`);
            }, 10000);
        } else if (humanCount > 1) {
            // Jika user join saat sudah ada orang lain, cukup update state tanpa kirim pesan
            queue.lastChannelState = 'party';
        }
    },
};