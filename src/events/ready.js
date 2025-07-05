import { Events, ActivityType } from 'discord.js';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ ${client.user.tag} siap beraksi!`);

        const updateStatus = () => {
            if (!client.user) return;

            // Fungsi helper untuk menentukan status berdasarkan ping
            const getStatus = () => {
                const ping = client.ws.ping;
                if (ping > 150) return 'dnd';    // Merah
                if (ping > 50) return 'idle';   // Kuning
                return 'online';                // Hijau
            };

            // TAHAP 1: WAKTU (0-10 detik)
            // Waktu dihitung saat akan ditampilkan agar selalu baru
            setTimeout(() => {
                if (!client.user) return;
                const timeWIB = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hourCycle: 'h23' });
                client.user.setPresence({
                    activities: [{ name: `${timeWIB} WIB`, type: ActivityType.Watching }],
                    status: getStatus(),
                });
            }, 0); // Mulai segera

            setTimeout(() => {
                if (!client.user) return;
                const timeWITA = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Makassar', hourCycle: 'h23' });
                client.user.setPresence({
                    activities: [{ name: `${timeWITA} WITA`, type: ActivityType.Watching }],
                    status: getStatus(),
                });
            }, 3300);

            setTimeout(() => {
                if (!client.user) return;
                const timeWIT = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Jayapura', hourCycle: 'h23' });
                client.user.setPresence({
                    activities: [{ name: `${timeWIT} WIT`, type: ActivityType.Watching }],
                    status: getStatus(),
                });
            }, 6600);

            // TAHAP 2: LAGU DIPUTAR (10-20 detik)
            setTimeout(() => {
                if (!client.user) return;
                // Mengambil judul lagu dari properti client yang diatur oleh index.js
                const songName = client.currentSongName || "Tidak ada musik";
                const displayName = songName.length > 50 ? songName.substring(0, 50) + '...' : songName;
                
                client.user.setPresence({
                    activities: [{ name: displayName, type: ActivityType.Listening }],
                    status: getStatus(),
                });
            }, 10000);

            // TAHAP 3: BY KOUHAI GANTENG | PING (20-30 detik)
            setTimeout(() => {
                if (!client.user) return;
                client.user.setPresence({
                    activities: [{ name: `By Kouhai Ganteng | ${client.ws.ping}ms`, type: ActivityType.Playing }],
                    status: getStatus(),
                });
            }, 20000);
        };

        // Jalankan updateStatus setiap 30 detik untuk memulai siklus baru
        updateStatus(); // Jalankan sekali di awal
        setInterval(updateStatus, 30000);
    },
};