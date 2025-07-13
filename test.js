import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Funzione per normalizzare il testo (rimozione accenti, caratteri speciali, ecc.)
function normalize(str) {
    if (!str) return '';
    return str
        .split(/\s*[\(\[{](?:feat|ft|featuring).*$/i)[0]
        .split(/\s*(?:feat|ft|featuring)\.?\s+.*$/i)[0]
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
}

// Lista artisti predefiniti per la modalità random
const DEFAULT_ARTISTS = [
    "Lazza", "Melons", "Sayf", "Sfera Ebbasta", "Ghali", "Baby Gang", 
    "Shiva", "Drake", "Tony Boy", "Kid Yugi", "21 savage", "Marracash", 
    "Capo Plaza", "Guè Pequeno", "King Von", "Chief Keef", "Lil Durk",
    "Tha Supreme", "Gemitaiz", "Fabri Fibra", "Simba La Rue", "Il tre",
    "Rondo Da Sosa", "Drefgold", "Noyz Narcos", "Salmo", "Clementino",
    "Rocco Hunt", "Luchè"
];

// Mappe per gestire le partite attive e le richieste pendenti
const activeGames = new Map();
const pendingArtistRequests = new Map();

// Funzione per ottenere una traccia random da iTunes
async function getRandomTrack(keyword = null) {
    const searchTerm = keyword || DEFAULT_ARTISTS[Math.floor(Math.random() * DEFAULT_ARTISTS.length)];
    
    const response = await axios.get('https://itunes.apple.com/search', {
        params: {
            term: searchTerm,
            country: 'IT',
            media: 'music',
            limit: 20
        }
    });

    const validTracks = response.data.results.filter(track => 
        track.previewUrl && track.trackName && track.artistName
    );

    if (!validTracks.length) {
        throw new Error(`Nessuna traccia trovata per ${searchTerm}`);
    }

    const selectedTrack = validTracks[Math.floor(Math.random() * validTracks.length)];
    return {
        title: selectedTrack.trackName,
        artist: selectedTrack.artistName,
        preview: selectedTrack.previewUrl
    };
}

// Funzione per inviare l'anteprima audio
async function sendAudioPreview(conn, chat, track, quotedMsg) {
    try {
        const audioResponse = await axios.get(track.preview, { responseType: 'arraybuffer' });
        const tmpDir = path.join(process.cwd(), 'tmp');
        
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const audioPath = path.join(tmpDir, `preview_${Date.now()}.mp3`);
        fs.writeFileSync(audioPath, Buffer.from(audioResponse.data));
        
        await conn.sendMessage(chat, { 
            audio: fs.readFileSync(audioPath),
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: quotedMsg });

        fs.unlinkSync(audioPath);
    } catch (error) {
        console.error('Errore nell\'invio dell\'audio:', error);
        throw new Error('Errore nella riproduzione dell\'anteprima');
    }
}

// Template per i messaggi di gioco
function gameMessages(track, timeLeft, isTimeout = false, isCorrect = false, reward = 0) {
    if (isTimeout) {
        return `
ㅤㅤ⋆｡˚『 ╭ \`TEMPO SCADUTO\` ╯ 』˚｡⋆
╭
│ ➤ \`Nessuno ha indovinato!\`
┃ 『  』🎵 \`Titolo:\` *${track.title}*
┃ 『  』👤 \`Artista:\` *${track.artist}*
┃
╰⭒─ׄ─ׅ─ׄ─⭒`;
    }

    if (isCorrect) {
        return `
ㅤㅤ⋆｡˚『 ╭ \`CORRETTA\` ╯ 』˚｡⋆
╭
│ ➤ \`Risposta Corretta!\`
┃ 『  』🎵 \`Titolo:\` *${track.title}*
┃ 『  』👤 \`Artista:\` *${track.artist}*
┃
┃ 『 🎁 』 \`Vincite:\`
│ ➤  \`${reward}\` *euro*
│ ➤  \`500\` *exp*
┃
╰⭒─ׄ─ׅ─ׄ─⭒`;
    }

    return `
⋆｡˚『 ╭ \`INDOVINA CANZONE\` ╯ 』˚｡⋆
╭
┃ 『 ⏱️ 』 \`Tempo:\` *${timeLeft} secondi* 
┃ 『 👤 』 \`Artista:\` *${track.artist}* 
┃
┃ \`Scrivi il titolo della canzone!\`
┃ \`vare ✧ bot\`
╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒`;
}

// Funzione principale per avviare il gioco
async function startGame(m, conn, artistName = null) {
    const chat = m.chat;

    if (activeGames.has(chat)) {
        return conn.reply(chat, '『 ⚠️ 』- `C\'è già una partita in corso in questo gruppo!`', m);
    }

    try {
        // Notifica l'avvio del gioco
        await conn.sendMessage(chat, { 
            text: artistName 
                ? `🔍 Sto cercando una canzone di *${artistName}*...` 
                : '🎵 Sto preparando una canzone casuale...'
        }, { quoted: m });

        // Ottieni la traccia
        const track = await getRandomTrack(artistName);
        
        // Invia l'anteprima audio
        await sendAudioPreview(conn, chat, track, m);

        // Crea il messaggio di gioco
        const gameMessage = await conn.reply(chat, gameMessages(track, 30), m);

        // Configura il gioco
        const game = {
            track,
            timeLeft: 30,
            message: gameMessage,
            interval: setInterval(async () => {
                game.timeLeft -= 5;
                
                if (game.timeLeft <= 0) {
                    endGame(conn, chat, game, true);
                    return;
                }

                try {
                    await conn.sendMessage(chat, {
                        text: gameMessages(track, game.timeLeft),
                        edit: gameMessage.key
                    });
                } catch (e) {
                    console.error('Errore nell\'aggiornamento del timer:', e);
                }
            }, 5000)
        };

        activeGames.set(chat, game);
    } catch (error) {
        console.error('Errore nell\'avvio del gioco:', error);
        conn.reply(chat, `❌ Errore: ${error.message}`, m);
    }
}

// Funzione per terminare il gioco
function endGame(conn, chat, game, isTimeout = false, winner = null) {
    clearInterval(game.interval);
    activeGames.delete(chat);

    // Elimina il messaggio di gioco
    conn.sendMessage(chat, { delete: game.message.key }).catch(console.error);

    // Invia il risultato
    const messageContent = isTimeout
        ? gameMessages(game.track, 0, true)
        : gameMessages(game.track, 0, false, true, winner.reward);

    conn.sendMessage(chat, {
        text: messageContent,
        buttons: [{ 
            buttonId: '.ic', 
            buttonText: { displayText: '『 🎵 』 Rigioca' }, 
            type: 1 
        }],
        headerType: 1
    }).catch(console.error);

    // Assegna premio se c'è un vincitore
    if (winner) {
        if (!global.db.data.users[winner.id]) {
            global.db.data.users[winner.id] = { euro: 0, exp: 0 };
        }
        global.db.data.users[winner.id].euro += winner.reward;
        global.db.data.users[winner.id].exp += 500;
    }
}

// Handler principale
handler = async (m, { conn, command }) => {
    const chat = m.chat;

    // Comando per scegliere artista
    if (command === 'sceglicantante') {
        const requestMsg = await conn.reply(chat, 
            'Rispondi a questo messaggio con il nome del cantante che vuoi!', 
            m
        );
        pendingArtistRequests.set(chat, requestMsg.key.id);
        return;
    }

    // Gestione risposta per scegli artista
    if (pendingArtistRequests.has(chat) && m.quoted && m.quoted.id === pendingArtistRequests.get(chat)) {
        const artistName = m.text?.trim();
        if (!artistName) return conn.reply(chat, 'Devi specificare un artista!', m);
        pendingArtistRequests.delete(chat);
        return startGame(m, conn, artistName);
    }

    // Avvia gioco normale
    return startGame(m, conn);
};

// Middleware per verificare le risposte
handler.before = async (m, { conn }) => {
    const chat = m.chat;
    if (!activeGames.has(chat)) return;

    const game = activeGames.get(chat);
    const userAnswer = normalize(m.text);
    const correctAnswer = normalize(game.track.title);

    // Calcola similarità tra risposta e titolo corretto
    function calculateSimilarity(str1, str2) {
        const words1 = str1.split(/\s+/);
        const words2 = str2.split(/\s+/);
        
        const matches = words1.filter(word1 => 
            words2.some(word2 => 
                word2.includes(word1) || word1.includes(word2)
        );
        
        return matches.length / Math.max(words1.length, words2.length);
    }

    const similarity = calculateSimilarity(userAnswer, correctAnswer);
    const isCorrect = similarity >= 0.7 || 
                     correctAnswer.includes(userAnswer) || 
                     userAnswer.includes(correctAnswer);

    if (isCorrect) {
        await conn.sendMessage(chat, { 
            react: { text: '✅', key: m.key } 
        }).catch(console.error);
        
        endGame(conn, chat, game, false, {
            id: m.sender,
            reward: Math.floor(Math.random() * 100) + 50
        });
    } else if (similarity >= 0.4) {
        await conn.sendMessage(chat, { 
            react: { text: '❌', key: m.key } 
        }).catch(console.error);
        conn.reply(chat, '👀 *Ci sei quasi!* Riprova...', m);
    }
};

handler.help = ['indovinacanzone', 'ic', 'sceglicantante'];
handler.tags = ['games'];
handler.command = ['indovinacanzone', 'ic', 'sceglicantante'];
handler.group = true;

export default handler;
