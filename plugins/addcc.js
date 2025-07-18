let handler = async (m, { conn, args, isOwner }) => {
  if (!isOwner) return m.reply('❌ Solo il proprietario può usare questo comando.');

  const amount = parseInt(args[0]);
  if (isNaN(amount) || amount <= 0) return m.reply('❌ Inserisci un importo valido.');

  const user = m.mentionedJid?.[0] || m.sender;
  global.db.data.users[user] = global.db.data.users[user] || {};
  global.db.data.users[user].hollycash = (global.db.data.users[user].hollycash || 0) + amount;

  m.reply(`✅ Hai aggiunto ${amount} Holly Cash 💸 all'utente.`);
};

handler.help = ['addhc @user 500'];
handler.tags = ['owner'];
handler.command = /^addhc$/i;
handler.owner = true;

export default handler;
