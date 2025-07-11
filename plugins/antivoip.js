//anti internazionali/voip by chatunity
let handler = m => m
handler.before = async function (m, {conn, isAdmin, isBotAdmin, isOwner, isROwner}) {
    if (!m.isGroup) return false
    let chat = global.db.data.chats[m.chat]
    let bot = global.db.data.settings[conn.user.jid] || {}
    

    if (!isBotAdmin || !chat.antiArab || isAdmin || isOwner || isROwner || !bot.restrict) {
        return false
    }

    const allowedPrefix = '39'
    
 
    const userPrefix = m.sender.split('@')[0].split(':')[1]?.slice(0, allowedPrefix.length) || ''

    if (userPrefix === allowedPrefix) {
        return false
    }


    try {
        const response = await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
        if (response[0].status === "404") return
        console.log(`[ANTI-ARAB] Rimosso ${m.sender} - Prefisso non consentito: ${userPrefix}`)
        
        
        await conn.sendMessage(m.chat, {
            text: `⚠️ *Utente rimosso automaticamente*\n\nMotivo: Prefisso internazionale non consentito (${userPrefix})\nSono ammessi solo numeri italiani (+39)`,
            mentions: [m.sender]
        }, { quoted: m })
        
        return true
    } catch (e) {
        console.error('[ANTI-ARAB] Errore nella rimozione:', e)
        return false
    }
}

export default handler