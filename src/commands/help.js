import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

// Fungsi ini diekspor agar bisa dipanggil juga oleh perintah !help di messageCreate.js
export function createHelpEmbed(client) {
    const mainCommands = [
        '• **/putar** atau **!p** `<judul>` - Mencari & memutar lagu via daftar pilihan interaktif.',
        '• **/volume** `<0-150>` - Atur gede kecilnya suara.',
        '• **/ping** atau **!ping** - Cek kecepatan koneksi bot.',
        '• **/help** atau **!help** - Nampilin pesan bantuan ini.'
    ].join('\n');

    const buttonControls = [
        '• **▶️/⏸️ Play/Pause**: Jeda atau lanjutin musik.',
        '• **⏪/⏩ Mundur/Maju**: Geser durasi lagu 10 detik.',
        '• **⏭️ Skip**: Lanjut ke lagu berikutnya.',
        '• **⏹️ Stop**: Hentikan musik & keluar dari channel.',
        '• **❤️ Suka**: Klik buat suka/batal suka (toggle).',
        '• **🔁 Loop**: Ganti mode loop (Off, Lagu, Antrian).',
        '• **🎶 Autoplay**: Aktifkan putar otomatis lagu rekomendasi.',
        '• **📜 Antrian**: Ngintip antrian lagu.',
        '• **➕ Tambah Lagu**: Buka pop-up buat nambah lagu baru.',
        '• **💬 Live Chat**: Ngobrol singkat langsung di embed!',
        '• **🔊 Volume**: Buka pop-up untuk atur volume.',
        '• **🎚️ Kontrol Lanjutan**: Buka menu efek audio & Mode DJ.',
        '• **📻 Radio 24/7**: Memutar lofi nonstop (toggle on/off).'
    ].join('\n');

    const helpEmbed = new EmbedBuilder()
        .setColor('#8A2BE2')
        .setTitle('📘 Bantuan KouBot')
        .setDescription('Yo! Gw KouBot, siap ngeramein server lo pake musik. Ini contekan biar lo makin jago pake gw:')
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
            { 
                name: '🎧 PERINTAH UTAMA', 
                value: mainCommands
            },
            {
                name: '🎛️ KONTROL PLAYER (TOMBOL DI EMBED)',
                value: buttonControls
            },
            {
                name: '✨ FITUR UNGGULAN',
                value: 
                    '• **Satu Embed Canggih**: Info lagu nge-refresh sendiri, ga nyampah.\n' +
                    '• **Notif Santuy**: Semua notif dari gw bakal ilang sendiri setelah 15 detik.\n' +
                    '• **Anti AFK**: Otomatis cabut setelah 3 menit sepi (kecuali mode radio).'
            }
        )
        .setTimestamp()
        .setFooter({ text: 'KouBot | Selalu siap melayani.' });
    
    return helpEmbed;
}

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Nampilin semua perintah dan cara pake bot.'),
    async execute(interaction) {
        const helpEmbed = createHelpEmbed(interaction.client);
        try {
            // Coba kirim ke DM user
            await interaction.user.send({ embeds: [helpEmbed] });
            // Jika berhasil, balas di server dengan pesan ephemeral
            await interaction.reply({ content: 'Bantuan udah meluncur ke DM kamu! 🚀', flags: [MessageFlags.Ephemeral] });
        } catch (error) {
            console.error(`Gagal mengirim DM ke ${interaction.user.tag}.`);
            // Jika gagal (misal: DM user ditutup), kirim sebagai pesan ephemeral di channel
            await interaction.reply({ 
                content: 'Gabisa kirim DM ke kamu, mungkin DM kamu private. Ini bantuannya ya:',
                embeds: [helpEmbed], 
                flags: [MessageFlags.Ephemeral] 
            });
        }
    },
};