import fs from 'fs';
import fetch from 'node-fetch';

const features = [
    { key: 'antiLink', label: 'Antilink' },
    { key: 'antiLinkHard', label: 'Antilinkhard' },
    { key: 'antiSpam', label: 'Antispam' },
    { key: 'antiTraba', label: 'Antitrava' },
    { key: 'antiviewonce', label: 'Antiviewonce' },
    { key: 'autosticker', label: 'Autosticker' },
    { key: 'welcome', label: 'Benvenuto' },
    { key: 'detect', label: 'Detect' },
    { key: 'risposte', label: 'Risposte' },
    { key: 'antibestemmie', label: 'Antibestemmie' },
    { key: 'gpt', label: 'GPT' },
    { key: 'jadibot', label: 'JadiBot' },
    { key: 'sologruppo', label: 'SoloGruppo' },
    { key: 'soloprivato', label: 'SoloPrivato' },
    { key: 'soloadmin', label: 'soloadmin' },
    { key: 'isBanned', label: 'BanGruppo' },
    { key: 'antiporno', label: 'Antiporno' },
    { key: 'antiCall', label: 'AntiCall' },
    { key: 'antiinsta', label: 'Antiinsta' },
    { key: 'antitiktok', label: 'AntiTikTok' },
    { key: 'antiArab', label: 'Antiarab' },
    { key: 'antivirus', label: 'Antivirus' },
    { key: 'antibot', label: 'Antibot' },
    { key: 'antivoip', label: 'Antivoip' },
    { key: 'chatbotPrivato', label: 'ChatbotPrivato' }
];

let handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin, isROwner }) => {
    // Get chat info
    let chat = await conn.getName(m.chat);
    let chatData = global.db.data.chats[m.chat] || {};

    // Stato attuale di ogni funzione
    let statusList = features.map(f => {
        let state;
        if (f.key === 'chatbotPrivato') {
            state = global.privateChatbot[m.sender] || false;
        } else if (f.key === 'antivoip') {
            state = global.db.data.chats[m.chat]?.antivoip || false;
        } else {
            state = chatData[f.key];
        }
        let emoji = state ? '🟢' : '🔴';
        return `┃◈┃${emoji} *${f.label}*`;
    }).join('\n');

    // Testo menu abbellito stile menu principale
    const menuText = `
╭〔 *🔧 𝑴𝑬𝑵𝑼 𝑺𝑰𝑪𝑼𝑹𝑬𝑿 𝑩𝑶𝑻 🔧* 〕┈⊷
┃◈╭─────────────·๏
┃◈┃• *𝐀𝐓𝐓𝐈𝐕𝐀/𝐃𝐈𝐒𝐀𝐁𝐈𝐋𝐈𝐓𝐀*
┃◈┃
┃◈┃• *ℹ 𝐂𝐎𝐌𝐄 𝐒𝐈 𝐔𝐒𝐀*
┃◈┃• 🟢 attiva [funzione]
┃◈┃• 🔴 disabilita [funzione]
┃◈┃• 🔴 disattiva [funzione]
┃◈┃
${statusList}
┃◈┃
┃◈└───────────┈⊷
┃◈┃• *𝑽𝑬𝑹𝑺𝑰𝑶𝑵𝑬:* ${typeof vs !== 'undefined' ? vs : ''}
┃◈┃•  𝐂𝐎𝐋𝐋𝐀𝐁: 𝐎𝐍𝐄 𝐏𝐈𝐄𝐂𝐄
┃◈┃• *𝐒𝐔𝐏𝐏𝐎𝐑𝐓𝐎:* (.supporto)
╰━━━━━━━━━━━━━┈·๏
`.trim();

    let chatTitle = '⚙️ Impostazioni ' + chat;

    // Prepare menu response
    const menuResponse = {
        text: menuText,
        footer: 'Seleziona una funzione da attivare/disattivare',
        title: chatTitle,
        buttonText: '📋 Lista Comandi',
        sections: [{
            title: '🔧 Funzioni',
            rows: features.map(f => ({
                title: f.label,
                description: `Attiva/Disattiva ${f.label}`,
                rowId: `${usedPrefix}attiva ${f.label.toLowerCase()}`
            }))
        }]
    };

    // Get the feature to toggle
    let featureArg = (args[0] || '').toLowerCase();
    let featureObj = features.find(f => f.label.toLowerCase() === featureArg);

    // Show menu if no valid feature specified
    if (!featureArg || !featureObj) {
        let defaultMsg = {
            key: {
                participants: '0@s.whatsapp.net',
                fromMe: false,
                id: '3EB0C7D95F5E5E5E'
            },
            message: {
                locationMessage: {
                    name: 'Impostazioni Bot',
                    jpegThumbnail: fs.readFileSync('./settings.png'),
                    vcard: 'BEGIN:VCARD...'
                }
            },
            participant: '0@s.whatsapp.net'
        };
        return await conn.sendMessage(m.chat, menuResponse, { quoted: defaultMsg });
    }

    // Determine action (enable/disattiva)
    let isEnable = /attiva|enable|on|1|true/i.test(command.toLowerCase());
    let isDisable = /disabilita|disattiva|disable|off|0|false/i.test(command.toLowerCase());
    if (isDisable) isEnable = false;

    // Gestione speciale per antivoip
    if (featureObj.key === 'antivoip') {
        chatData.antivoip = isEnable;
    } else if (featureObj.key === 'chatbotPrivato') {
        if (m.isGroup) {
            return conn.reply(m.chat, '❌ Puoi attivare/disattivare la funzione *ChatbotPrivato* solo in chat privata.', m);
        }
        global.privateChatbot[m.sender] = isEnable;
    } else {
        if (featureObj.key in chatData) {
            chatData[featureObj.key] = isEnable;
        } else {
            chatData[featureObj.key] = isEnable;
        }
    }

    let statusEmoji = (featureObj.key === 'chatbotPrivato' ? (global.privateChatbot[m.sender] ? '🟢' : '🔴') : (chatData[featureObj.key] ? '🟢' : '🔴'));
    let action = isEnable ? '𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐚' : '𝐝𝐢𝐬𝐚𝐭𝐭𝐢𝐯𝐚𝐭𝐚';
    let successMsg = `
╭〔 *🔧 𝑴𝑬𝑺𝑺𝑨𝑮𝑮𝑖𝑶 𝑺𝑻𝑨𝑻𝑶* 〕┈⊷
┃ 𝐅𝐮𝐧𝐳𝐢𝐨𝐧𝐞 *${featureObj.label}* ${action}
╰━━━━━━━━━━━━━┈·๏
`.trim();

    // Scegli l'immagine in base allo stato
    const imgUrl = isEnable
        ? 'https://telegra.ph/file/00edd0958c94359540a8f.png'
        : 'https://telegra.ph/file/de558c2aa7fc80d32b8c3.png';

    let successResponse = {
        key: {
            participants: '0@s.whatsapp.net',
            fromMe: false,
            id: '3EB0C7D95F5E5E5E'
        },
        message: {
            locationMessage: {
                name: 'Impostazioni Bot',
                jpegThumbnail: await (await fetch(imgUrl)).buffer(),
                vcard: 'BEGIN:VCARD...'
            }
        },
        participant: '0@s.whatsapp.net'
    };

    await conn.reply(m.chat, successMsg, null, { quoted: successResponse });
};

handler.help = ['attiva <feature>', 'disabilita <feature>', 'disattiva <feature>'];
handler.tags = ['group', 'owner'];
handler.command = /^(attiva|disabilita|disattiva|enable|disable)/i;
handler.group = true;
handler.admin = true;

export default handler;