import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

const commands = [];
// Karena script ini ada di /src, path ke folder commands cukup seperti ini
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('Memulai memuat file perintah...');

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
        const command = await import(`file://${filePath}`);
        if ('data' in command.default && 'execute' in command.default) {
            commands.push(command.default.data.toJSON());
            console.log(`[✔] Berhasil memuat: ${command.default.data.name}`);
        } else {
            console.log(`[❗] Peringatan: Perintah di ${filePath} tidak memiliki properti "data" atau "execute".`);
        }
    } catch (error) {
        console.error(`[❌] Gagal memuat perintah di ${filePath}:\n`, error);
    }
}

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
    console.error('[❌] Error: Pastikan DISCORD_TOKEN, CLIENT_ID, dan GUILD_ID sudah diatur di file .env');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`\nMemulai me-refresh ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log(`✅ Berhasil memuat ulang ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();