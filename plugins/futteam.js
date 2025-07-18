let handler = async (m, { conn }) => {
  const user = m.sender;
  const data = global.db.data.users[user] || {};
  const players = data.fifaPlayers || [];

  if (!players || players.length < 11) {
    return m.reply('❌ Ti servono almeno 11 giocatori per formare una squadra.');
  }

  const formation = {
    GK: [],
    DEF: [],
    MID: [],
    ATT: []
  };

  for (const p of players) {
    const pos = p.position.toUpperCase();
    if (pos === 'GK') formation.GK.push(p);
    else if (['CB', 'LB', 'RB'].includes(pos)) formation.DEF.push(p);
    else if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) formation.MID.push(p);
    else if (['ST', 'CF', 'LW', 'RW'].includes(pos)) formation.ATT.push(p);
  }

  const team = [
    ...(formation.GK.sort((a, b) => b.rating - a.rating).slice(0, 1)),
    ...(formation.DEF.sort((a, b) => b.rating - a.rating).slice(0, 3)),
    ...(formation.MID.sort((a, b) => b.rating - a.rating).slice(0, 3)),
    ...(formation.ATT.sort((a, b) => b.rating - a.rating).slice(0, 2)),
  ];

  if (team.length < 9) return m.reply('❌ Non hai abbastanza giocatori nei ruoli giusti.');

  const renderLine = (label, players) =>
    players.map(p => `${label} *${p.name}* (${p.rating}⭐)`).join('\n');

  const gk = renderLine('🧤', team.filter(p => p.position.toUpperCase() === 'GK'));
  const def = renderLine('🛡️', team.filter(p => ['CB', 'LB', 'RB'].includes(p.position.toUpperCase())));
  const mid = renderLine('⚙️', team.filter(p => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position.toUpperCase())));
  const att = renderLine('🎯', team.filter(p => ['ST', 'CF', 'LW', 'RW'].includes(p.position.toUpperCase())));

  const message = `
⚽ *La tua squadra provvisoria* ⚽

${gk}

${def}

${mid}

${att}

💾 Premi il bottone per *salvare la rosa*
  `;

  await conn.sendMessage(m.chat, {
    text: message,
    buttons: [
      { buttonId: '.salvarosa', buttonText: { displayText: '💾 Salva Rosa' }, type: 1 }
    ],
    headerType: 1
  }, { quoted: m });

  // Salvataggio via bottone
  conn.saveRosa = conn.saveRosa || {};
  conn.saveRosa[user] = team;
};

handler.command = /^futformation$/i;
handler.tags = ['fifa'];
handler.help = ['futformation'];

export default handler;
