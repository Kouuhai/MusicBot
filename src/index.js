import { Client, GatewayIntentBits, Collection, ActivityType } from 'discord.js';
import { DisTube } from 'distube';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import { refreshPlayer, sendTempMessage } from './utils/player.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MusicBot extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });
        this.commands = new Collection();
        this.activityIndex = 0;
        this.currentSongName = 'Tidak ada musik';
        
        this.distube = new DisTube(this, { 
            leaveOnEmpty: true, 
            leaveOnFinish: false, 
            leaveOnStop: true, 
            emptyCooldown: 180,
            savePreviousSongs: true, 
            searchSongs: 10, 
            searchCooldown: 30, 
            nsfw: false, 
            emitNewSongOnly: true, 
            emitAddSongWhenCreatingQueue: false,
            customFilters: {
                'lowbass': 'bass=g=5,dynaudnorm=f=200',
                'mediumbass': 'bass=g=10,dynaudnorm=f=200',
                'extremebass': 'bass=g=20,dynaudnorm=f=200',
            }
        });

        this.setupDisTubeEvents();
        this.loadCommands();
        this.loadEvents();
    }

    setupDisTubeEvents() {
        const cleanup = (queue) => {
            if (queue.updateInterval) clearInterval(queue.updateInterval);
            if (queue.nowPlayingMessage && queue.nowPlayingMessage.deletable) {
                queue.nowPlayingMessage.delete().catch(() => {});
            }
            if (queue) {
                Object.assign(queue, { 
                    nowPlayingMessage: null, 
                    updateInterval: null, 
                    liveChatMessages: [], 
                    songLikes: null, 
                    djMode: false, 
                    radioMode: false,
                    lastChannelState: null
                });
                if(queue.client) queue.client.currentSongName = 'Tidak ada musik';
            }
        };

        this.distube
            .on('playSong', (queue, song) => {
                queue.client.currentSongName = song.name;
                
                if (song.metadata?.isRadio) {
                    queue.radioMode = true;
                    queue.leaveOnEmpty = false;
                } else {
                    queue.radioMode = false;
                    queue.leaveOnEmpty = true;
                }
                
                if (typeof queue.djMode === 'undefined') queue.djMode = false;
                if (typeof queue.autoplay === 'undefined') queue.autoplay = false;
                if (!queue.songLikes) queue.songLikes = new Map();
                if (!queue.songLikes.has(song.id)) queue.songLikes.set(song.id, new Set());
                queue.liveChatMessages = [];
                // PERBAIKAN: Inisialisasi state untuk notifikasi kehadiran agar tidak spam
                queue.lastChannelState = 'initial'; 

                refreshPlayer(queue);

                if (queue.updateInterval) clearInterval(queue.updateInterval);
                queue.updateInterval = setInterval(() => {
                    const currentQueue = this.distube.getQueue(queue.id);
                    if (!currentQueue || !currentQueue.songs.length) {
                        return clearInterval(queue.updateInterval);
                    }
                    
                    const now = Date.now();
                    currentQueue.liveChatMessages = (currentQueue.liveChatMessages || []).filter(msg => (now - msg.timestamp) < 10000);
                    currentQueue.colorIndex = ((currentQueue.colorIndex || 0) + 1) % 10;
                    
                    refreshPlayer(currentQueue);
                }, 7000);
            })
            .on('addSong', (queue, song) => {
                sendTempMessage(queue.textChannel, `✅ Sipp, **${song.name}** udah masuk antrian.`);
                refreshPlayer(queue);
            })
            .on('addList', (queue, playlist) => {
                sendTempMessage(queue.textChannel, `🎶 Mantap! Playlist **${playlist.name}** (\`${playlist.songs.length}\` lagu) langsung gas masuk antrian.`);
                refreshPlayer(queue);
            })
            .on('finish', queue => {
                if (queue.autoplay) {
                    sendTempMessage(queue.textChannel, '🎶 Nyari lagu lain yang mirip...');
                    return;
                }
                sendTempMessage(queue.textChannel, '✅ Udah abis nih lagunya. Kalo sepi 3 menit, gw cabut ya!');
                cleanup(queue);
            })
            .on('empty', queue => { 
                sendTempMessage(queue.textChannel, `👋 Yah, sepi amat. Gw cabut dulu ya, bye!`);
                cleanup(queue);
            })
            .on('disconnect', queue => {
                sendTempMessage(queue.textChannel, `👋 Waduh, keputus nih. Ntar join lagi ya.`);
                cleanup(queue);
            })
            .on('stop', queue => {
                sendTempMessage(queue.textChannel, `⏹️ Oke, musiknya gw stop. Beres!`);
                cleanup(queue);
            })
            .on('error', (channel, error) => { 
                console.error(error);
                if (channel) {
                    sendTempMessage(channel, '❌ Waduh, error nih bos: ' + error.message.slice(0, 1000));
                }
            });
    }

    async loadCommands() {
        const commandsPath = join(__dirname, 'commands');
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        console.log('Memulai memuat file perintah...');
        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);
            try {
                const command = await import(`file://${filePath}`);
                if ('data' in command.default && 'execute' in command.default) {
                    this.commands.set(command.default.data.name, command.default);
                    console.log(`[✔] Berhasil memuat: ${command.default.data.name}`);
                } else {
                    console.log(`[❗] Peringatan: Perintah di ${filePath} tidak memiliki properti "data" atau "execute".`);
                }
            } catch (error) { console.error(`[❌] Gagal memuat perintah di ${filePath}:\n`, error); }
        }
    }

    async loadEvents() {
        const eventsPath = join(__dirname, 'events');
        const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const filePath = join(eventsPath, file);
            try {
                const event = await import(`file://${filePath}`);
                if (event.default.once) {
                    this.once(event.default.name, (...args) => event.default.execute(...args, this));
                } else {
                    this.on(event.default.name, (...args) => event.default.execute(...args, this));
                }
            } catch (error) { console.error(`[❌] Gagal memuat event di ${filePath}:\n`, error); }
        }
    }
    
    startActivityRotation() {
        this.activityIndex = 0;
        setInterval(() => {
            if (!this.user) return;
            let status = 'online';
            if (this.ws.ping > 150) status = 'dnd';
            else if (this.ws.ping > 50) status = 'idle';
            
            const songName = this.currentSongName.length > 50 ? this.currentSongName.substring(0, 50) + '...' : this.currentSongName;
            
            const activities = [
                { name: songName, type: ActivityType.Listening },
                { name: '/putar [judul lagu]', type: ActivityType.Playing }
            ];

            const currentActivity = activities[this.activityIndex];
            this.user.setPresence({
                activities: [currentActivity],
                status: status,
            });

            this.activityIndex = (this.activityIndex + 1) % activities.length;
        }, 15000);
    }
}

const client = new MusicBot();
process.on('unhandledRejection', error => console.error('Unhandled promise rejection:', error));
process.on('uncaughtException', error => console.error('Uncaught exception:', error));
client.login(process.env.DISCORD_TOKEN).catch(error => console.error('❌ Gagal login ke Discord:', error));