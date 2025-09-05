const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function startBot() {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('Scan this QR code to pair:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const status = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (status === DisconnectReason.loggedOut) {
        console.log('Logged out, please delete auth_info.json and restart.');
      } else {
        console.log('Disconnected, reconnecting...');
        startBot();
      }
    } else if (connection === 'open') {
      console.log('✅ Connected!');
    }
  });

  sock.ev.on('creds.update', saveState);

  return sock;
}

startBot();
