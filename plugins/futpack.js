import fs from 'fs';
import Canvas from 'canvas';
fifaPla
const players = JSON.parse(fs.readFileSync('./plugins/', 'utf8'));

let handler = async (m, { conn, command, args }) => {
  const user = m.sender;
  global.db.data.users[user] = global.db.data.users[user] || {};
  const data = global.db.data.users[user];
  data.fifaInventory = data.fifaInventory || { bronze: 0, silver: 0, gold: 0 };
  data.fifaPlayers = data.fifaPlayers || [];
  data.hollycash = data.hollycash || 0;

  const prices = { bronze: 100, silver: 300, gold: 800 };

  // --- FUT INVENTORY & OPEN BUTTONS ---
  if (command === 'fut') {
    const txt =
      `💼 *Inventario FUT:*\n` +
      `🥉 Bronze: ${data.fifaInventory.bronze} • 🥈 Silver: ${data.fifaInventory.silver} • 🥇 Gold: ${data.fifaInventory.gold}\n\n` +
      `💸 Holly Cash: ${data.hollycash}\n\n` +
      `🎁 Scegli pacchetto da aprire 👇`;

    const buttons = [];
    for (let type of ['bronze','silver','gold']) {
      if (data.fifaInventory[type] > 0) {
        const emoji = type==='bronze'?'🥉': type==='silver'?'🥈':'🥇';
        buttons.push({
          buttonId: `.open ${type}`,
          buttonText: { displayText: `${emoji} Apri ${type.charAt(0).toUpperCase()+type.slice(1)}` },
          type: 1
        });
      }
    }
    if (buttons.length === 0) {
      buttons.push({
        buttonId: '.futstore',
        buttonText: { displayText: '🛒 Compra pacchetti' },
        type: 1
      });
    }

    return conn.sendMessage(m.chat, {
      text: txt,
      footer: 'Holly FUT Bot ⚽',
      buttons,
      headerType: 1
    }, { quoted: m });
  }

  // --- STORE & BUY BUTTONS ---
  if (command === 'futstore') {
    const txt =
      `🛒 *FUT Store*\n` +
      `🥉 Bronze: ${prices.bronze} 💸\n` +
      `🥈 Silver: ${prices.silver} 💸\n` +
      `🥇 Gold: ${prices.gold} 💸\n\n` +
      `💸 Saldo attuale: ${data.hollycash}`;

    return conn.sendMessage(m.chat, {
      text: txt,
      footer: 'Compra pacchetti con Holly Cash',
      buttons: ['bronze','silver','gold'].map(type=>({
        buttonId: `.futbuy ${type}`,
        buttonText: { displayText: `${type.charAt(0).toUpperCase()+type.slice(1)}` },
        type: 1
      })),
      headerType: 1
    }, { quoted: m });
  }

  // --- PURCHASE ---
  if (command === 'futbuy') {
    const type = args[0]?.toLowerCase();
    if (!prices[type]) return m.reply('❌ Usa: .futbuy bronze/silver/gold');

    if (data.hollycash < prices[type]) {
      return m.reply(`❌ Ti servono ${prices[type]} Holly Cash 💸 per un pacchetto ${type}`);
    }
    data.hollycash -= prices[type];
    data.fifaInventory[type]++;
    return m.reply(`✅ Acquistato un pacchetto *${type}*! Ne hai ora: ${data.fifaInventory[type]}`);
  }

  // --- OPEN PACK ---
  if (command === 'open') {
    const type = args[0]?.toLowerCase();
    if (!['bronze','silver','gold'].includes(type)) return m.reply('❌ Specifica il pacchetto da aprire.');
    if (data.fifaInventory[type] <= 0) return m.reply(`❌ Nessun pacchetto ${type} da aprire.`);

    data.fifaInventory[type]--;
    await conn.sendMessage(m.chat, { text: `🎉 Aprendo pacchetto *${type}*...` }, { quoted: m });

    const pool = players.filter(p=>p.pack===type);
    const cards = Array.from({length:3},()=> pool[Math.floor(Math.random()*pool.length)]);
    const best=cards.sort((a,b)=>b.rating-a.rating)[0];
    for (let [i,p] of cards.entries()) {
      if (i===0) {
        await conn.sendMessage(m.chat, {
          image:{url:p.image},
          caption:`🌟 *${p.name}* (${p.rating}⭐)\n📍 ${p.position} | ${p.club} | ${p.nation}`
        },{quoted:m});
      } else {
        await conn.sendMessage(m.chat,{text:`➕ ${p.name} (${p.rating}⭐)`},{quoted:m});
      }
    }
    data.fifaPlayers.push(...cards);
  }

  // --- FUTROSA: grafica collaglio ---
  if (command === 'futrosa') {
    if (!data.fifaPlayers.length) return m.reply('📭 Nessun giocatore in rosa.');

    const top = data.fifaPlayers.sort((a,b)=>b.rating-a.rating).slice(0,6); // max 6

    const canvas = Canvas.createCanvas(900, 600);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle='#222'; ctx.fillRect(0,0,900,600);

    for (let i=0;i<top.length;i++){
      const img = await Canvas.loadImage(top[i].image);
      const x = (i%3)*300, y = Math.floor(i/3)*300;
      ctx.drawImage(img,x,y,300,300);
    }

    const buffer = canvas.toBuffer();
    await conn.sendMessage(m.chat,{image:{buffer}}, {quoted:m});
  }
};

handler.command=/^(fut|futstore|futbuy|open|futrosa)$/i;
handler.tags=['fifa'];
handler.help=['fut','futstore','open <type>','futrosa'];
export default handler;
