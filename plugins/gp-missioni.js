// missioni.js
import fs from 'fs';

const handler = async (m, { conn, usedPrefix, command, args }) => {
    const nomeDelBot = global.db.data.nomedelbot || 'ChatUnity Bot';
    const image = fs.existsSync('./chatunity.png') ? fs.readFileSync('./chatunity.png') : null;

    // Inizializzazione utente
    const who = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;
    let user = global.db.data.users[who];
    
    if (!user) {
        global.db.data.users[who] = {
            money: 0,
            bank: 0,
            warn: 0,
            messaggi: 0,
            command: 0,
            missions: {
                daily: { completed: 0, lastReset: 0, current: [] },
                weekly: { completed: 0, lastReset: 0, current: [] }
            }
        };
        user = global.db.data.users[who];
    } else if (!user.missions) {
        user.missions = {
            daily: { completed: 0, lastReset: 0, current: [] },
            weekly: { completed: 0, lastReset: 0, current: [] }
        };
    }

    // Reset automatico missioni
    const now = Date.now();
    if (now - user.missions.daily.lastReset >= 86400000) resetDailyMissions(user);
    if (now - user.missions.weekly.lastReset >= 604800000) resetWeeklyMissions(user);

    // Gestione comandi
    if (!args[0]) {
        return showMainMenu(m, conn, usedPrefix, nomeDelBot, image, who);
    }

    switch (args[0].toLowerCase()) {
        case 'daily':
            return showDailyMissions(m, conn, user, nomeDelBot, image, usedPrefix, who);
        case 'weekly':
            return showWeeklyMissions(m, conn, user, nomeDelBot, image, usedPrefix, who);
        case 'claim':
            return claimRewards(m, conn, user, nomeDelBot, image, usedPrefix, who);
        default:
            return showMainMenu(m, conn, usedPrefix, nomeDelBot, image, who);
    }
};

// FUNZIONI DI VISUALIZZAZIONE
async function showMainMenu(m, conn, usedPrefix, nomeDelBot, image, who) {
    const buttons = [
        { buttonId: `${usedPrefix}missioni daily`, buttonText: { displayText: '📅 GIORNALIERE' }, type: 1 },
        { buttonId: `${usedPrefix}missioni weekly`, buttonText: { displayText: '📆 SETTIMANALI' }, type: 1 },
        { buttonId: `${usedPrefix}missioni claim`, buttonText: { displayText: '💰 RISCUOTI' }, type: 1 }
    ];

    const user = global.db.data.users[who];
    const dailyCompleted = user.missions.daily.current.filter(m => m.completed).length;
    const weeklyCompleted = user.missions.weekly.current.filter(m => m.completed).length;

    return conn.sendMessage(m.chat, {
        text: `🎯 *SISTEMA MISSIONI ${nomeDelBot.toUpperCase()}*\n\n` +
              `👤 Utente: @${who.split('@')[0]}\n` +
              `💰 Saldo: ${user.money} UnityCoins\n` +
              `📅 Daily complete: ${dailyCompleted}/${user.missions.daily.current.length}\n` +
              `📆 Weekly complete: ${weeklyCompleted}/${user.missions.weekly.current.length}\n\n` +
              `Seleziona il tipo di missioni:`,
        footer: 'Guadagna UnityCoins completando le missioni!',
        buttons: buttons,
        mentions: [who],
        headerType: 1,
        jpegThumbnail: image
    }, { quoted: m });
}

async function showDailyMissions(m, conn, user, nomeDelBot, image, usedPrefix, who) {
    let text = `📅 *MISSIONI GIORNALIERE* @${who.split('@')[0]}\n\n`;
    text += `⏳ Reset tra: ${formatTime(86400000 - (Date.now() - user.missions.daily.lastReset))}\n\n`;

    user.missions.daily.current.forEach(mission => {
        const progress = getProgress(user, mission.type);
        text += `▢ *${mission.title}*\n`;
        text += `➠ Progresso: ${progress}/${mission.target}\n`;
        text += `➠ Ricompensa: ${mission.reward} UnityCoins\n`;
        text += `➠ Stato: ${mission.completed ? '✅' : progress >= mission.target ? '💰 PRONTO' : '❌'}\n\n`;
    });

    const buttons = [
        { buttonId: `${usedPrefix}missioni claim`, buttonText: { displayText: '💰 RISCUOTI' }, type: 1 },
        { buttonId: `${usedPrefix}missioni weekly`, buttonText: { displayText: '📆 SETTIMANALI' }, type: 1 },
        { buttonId: `${usedPrefix}missioni`, buttonText: { displayText: '🔙 INDIETRO' }, type: 1 }
    ];

    return conn.sendMessage(m.chat, {
        text: text,
        footer: `Completa le missioni per guadagnare UnityCoins!`,
        buttons: buttons,
        mentions: [who],
        headerType: 1,
        jpegThumbnail: image
    }, { quoted: m });
}

async function showWeeklyMissions(m, conn, user, nomeDelBot, image, usedPrefix, who) {
    let text = `📆 *MISSIONI SETTIMANALI* @${who.split('@')[0]}\n\n`;
    text += `⏳ Reset tra: ${formatTime(604800000 - (Date.now() - user.missions.weekly.lastReset))}\n\n`;

    user.missions.weekly.current.forEach(mission => {
        const progress = getProgress(user, mission.type);
        text += `▢ *${mission.title}*\n`;
        text += `➠ Progresso: ${progress}/${mission.target}\n`;
        text += `➠ Ricompensa: ${mission.reward} UnityCoins\n`;
        text += `➠ Stato: ${mission.completed ? '✅' : progress >= mission.target ? '💰 PRONTO' : '❌'}\n\n`;
    });

    const buttons = [
        { buttonId: `${usedPrefix}missioni claim`, buttonText: { displayText: '💰 RISCUOTI' }, type: 1 },
        { buttonId: `${usedPrefix}missioni daily`, buttonText: { displayText: '📅 GIORNALIERE' }, type: 1 },
        { buttonId: `${usedPrefix}missioni`, buttonText: { displayText: '🔙 INDIETRO' }, type: 1 }
    ];

    return conn.sendMessage(m.chat, {
        text: text,
        footer: `Missioni settimanali - Ricompense maggiori!`,
        buttons: buttons,
        mentions: [who],
        headerType: 1,
        jpegThumbnail: image
    }, { quoted: m });
}

// FUNZIONI DI GESTIONE
function resetDailyMissions(user) {
    user.missions.daily = {
        completed: 0,
        lastReset: Date.now(),
        current: generateDailyMissions()
    };
}

function resetWeeklyMissions(user) {
    user.missions.weekly = {
        completed: 0,
        lastReset: Date.now(),
        current: generateWeeklyMissions()
    };
}

function generateDailyMissions() {
    return [
        { title: "Invia 50 messaggi", type: "messaggi", target: 50, reward: 500 },
        { title: "Esegui 10 comandi", type: "command", target: 10, reward: 300 },
        { title: "Rimani senza warn", type: "no_warn", target: 1, reward: 700 }
    ].map(m => ({ ...m, progress: 0, completed: false }));
}

function generateWeeklyMissions() {
    return [
        { title: "Invia 300 messaggi", type: "messaggi", target: 300, reward: 2500 },
        { title: "Esegui 50 comandi", type: "command", target: 50, reward: 1500 },
        { title: "Rimani 7 giorni senza warn", type: "no_warn_week", target: 1, reward: 3500 },
        { title: "Raggiungi 1000 messaggi totali", type: "total_messaggi", target: 1000, reward: 5000 }
    ].map(m => ({ ...m, progress: 0, completed: false }));
}

function getProgress(user, type) {
    switch(type) {
        case 'messaggi':
            return user.messaggi || 0;
        case 'command':
            return user.command || 0;
        case 'no_warn':
            return user.warn > 0 ? 0 : 1;
        case 'no_warn_week':
            return user.warn > 0 ? 0 : 1;
        case 'total_messaggi':
            return user.messaggi || 0;
        default:
            return 0;
    }
}

async function claimRewards(m, conn, user, nomeDelBot, image, usedPrefix, who) {
    let total = 0;
    let claimed = 0;

    // Controlla missioni giornaliere
    user.missions.daily.current.forEach(mission => {
        const progress = getProgress(user, mission.type);
        if (progress >= mission.target && !mission.completed) {
            total += mission.reward;
            claimed++;
            mission.completed = true;
            user.missions.daily.completed++;
        }
    });

    // Controlla missioni settimanali
    user.missions.weekly.current.forEach(mission => {
        const progress = getProgress(user, mission.type);
        if (progress >= mission.target && !mission.completed) {
            total += mission.reward;
            claimed++;
            mission.completed = true;
            user.missions.weekly.completed++;
        }
    });

    if (claimed === 0) {
        return conn.reply(m.chat, `@${who.split('@')[0]} non hai missioni completate da riscuotere!`, m, { mentions: [who] });
    }

    user.money = (user.money || 0) + total;

    const buttons = [
        { buttonId: `${usedPrefix}portafoglio`, buttonText: { displayText: '💰 PORTAFOGLIO' }, type: 1 },
        { buttonId: `${usedPrefix}missioni`, buttonText: { displayText: '🎯 MISSIONI' }, type: 1 }
    ];

    // Messaggio di conferma con saldo aggiornato
    await conn.sendMessage(m.chat, {
        text: `🎉 @${who.split('@')[0]} hai riscosso *${total} UnityCoins* da ${claimed} missioni!\n\n` +
              `💰 Nuovo saldo: *${user.money} UnityCoins*\n` +
              `💳 Banca: *${user.bank || 0} UnityCoins*`,
        footer: 'Usa .portafoglio per vedere il tuo saldo',
        buttons: buttons,
        mentions: [who],
        headerType: 1,
        jpegThumbnail: image
    }, { quoted: m });

    // Mostra subito il saldo nel portafoglio
    await conn.reply(m.chat, `💰 Il tuo saldo attuale è: *${user.money} UnityCoins*`, m, { mentions: [who] });
}

// FUNZIONE DI UTILITY
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
}

handler.help = ['missioni'];
handler.tags = ['rpg'];
handler.command = ['missioni', 'missions', 'daily', 'weekly'];
handler.register = true;

export default handler;