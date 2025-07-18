let handler = async (m, { conn }) => {
  const user = m.sender;
  global.db.data.users[user] = global.db.data.users[user] || {};
  const data = global.db.data.users[user];

  if (!data.fifaPlayers || data.fifaPlayers.length === 0) {
    return m.reply('📭 La tua collezione FUT è vuota.');
  }

  const sorted = [...data.fifaPlayers].sort((a, b) => b.rating - a.rating);
  const top = sorted.slice(0, 10);

  let text = `🎮 *La tua FUT Club Collection*\n📦 Totale: ${data.fifaPlayers.length} carte\n\n`;

  for (let p of top) {
    text += `⭐ ${p.name} (${p.rating}) – ${p.position}, ${p.club}\n`;
  }

  await conn.sendMessage(m.chat, { text }, { quoted: m });
};

handler.help = ['futclub'];
handler.tags = ['fifa'];
handler.command = /^futclub$/i;

export default handler;
