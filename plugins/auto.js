import fetch from 'node-fetch'

let handler = async (m, { conn, command, usedPrefix, isAdmin }) => {
  global.autoGame = global.autoGame || {}

  if (command === 'auto') {
    if (!m.isGroup) return m.reply('⚠️ Questo comando funziona solo nei gruppi!')
    if (global.autoGame[m.chat]) return m.reply('⚠️ C\'è già una partita attiva! Usa .skipauto per interrompere.')

    // Lista auto base (puoi espandere o mettere una API)
    const autoList = [
      'Ferrari F40', 'Lamborghini Aventador', 'Tesla Model S',
      'Bugatti Veyron', 'Ford Mustang', 'Porsche 911', 'Audi R8',
    ]

    const scelta = autoList[Math.floor(Math.random() * autoList.length)]
    const query = encodeURIComponent(scelta)

    // Ottieni immagine con Car Imagery API
    const imageRes = await fetch(`https://www.carimagery.com/api.asmx/GetImageUrl?searchTerm=${query}`)
    const imageText = await imageRes.text()
    const imageUrl = imageText.match(/http.*jpg|jpeg|png/gi)?.[0] || null

    if (!imageUrl) return m.reply('❌ Immagine non trovata per quest\'auto.')

    // Inizia il gioco
    global.autoGame[m.chat] = {
      risposta: scelta.toLowerCase(),
      timeout: setTimeout(() => {
        conn.reply(m.chat, `⏰ Tempo scaduto!\nLa risposta era: *${scelta}*`, m)
        delete global.autoGame[m.chat]
      }, 30000)
    }

    await conn.sendFile(m.chat, imageUrl, 'auto.jpg', `🚗 *Indovina l'auto!*\n⌛ Hai 30 secondi!`, m)
  }

  // Salta gioco
  if (command === 'skipauto') {
    if (!m.isGroup) return m.reply('⚠️ Solo nei gruppi!')
    if (!global.autoGame[m.chat]) return m.reply('⚠️ Nessun gioco attivo!')
    if (!isAdmin && !m.fromMe) return m.reply('❌ Solo un admin può usare questo comando.')

    clearTimeout(global.autoGame[m.chat].timeout)
    await m.reply(`🚫 Gioco interrotto.\nLa risposta era: *${global.autoGame[m.chat].risposta}*`)
    delete global.autoGame[m.chat]
  }

  // Controllo risposta utente
  if (global.autoGame[m.chat] && !command) {
    const risposta = global.autoGame[m.chat].risposta
    if (m.text.toLowerCase().includes(risposta)) {
      clearTimeout(global.autoGame[m.chat].timeout)
      await m.reply(`🎉 *Corretto!* Hai indovinato: *${risposta}*`)
      delete global.autoGame[m.chat]
    }
  }
}

handler.command = ['auto', 'skipauto']
handler.group = true

export default handler
