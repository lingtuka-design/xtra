const express = require('express');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;
const AUTH_DIR = path.join(__dirname, 'auth_info');
const API_SECRET = process.env.API_SECRET || ''; // Optional secret token

let sock = null;
let currentQr = null;
let isConnected = false;
let userPhone = '';
let channelsList = [];

// Logger
const logger = pino({ level: 'silent' });

/**
 * Start Baileys WhatsApp Connection
 */
async function startWhatsApp() {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: true,
    browser: ['Xtra Football', 'Chrome', '124.0.0'],
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQr = await QRCode.toDataURL(qr);
      isConnected = false;
      console.log('[WhatsApp Bot] New QR Code generated. Visit web UI to scan.');
    }

    if (connection === 'close') {
      isConnected = false;
      currentQr = null;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.warn(`[WhatsApp Bot] Connection closed. Reason code: ${statusCode}. Reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(startWhatsApp, 3000);
      } else {
        console.error('[WhatsApp Bot] Logged out. Clearing auth credentials...');
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        } catch {}
        setTimeout(startWhatsApp, 2000);
      }
    } else if (connection === 'open') {
      isConnected = true;
      currentQr = null;
      userPhone = sock.user?.id ? sock.user.id.split(':')[0] : 'Connected';
      console.log(`[WhatsApp Bot] ✅ Connected successfully! Phone: ${userPhone}`);

      // Attempt to load newsletters/channels list
      try {
        if (typeof sock.newsletterSubscribed === 'function') {
          const subs = await sock.newsletterSubscribed();
          channelsList = Array.isArray(subs) ? subs : [];
        }
      } catch (err) {
        console.log('[WhatsApp Bot] Note: Could not fetch channel list automatically:', err.message);
      }
    }
  });
}

startWhatsApp();

/**
 * Web UI: Shows QR code or Connected status
 */
app.get('/', (req, res) => {
  if (isConnected) {
    const channelRows = channelsList.length > 0
      ? channelsList.map(c => `
          <div style="background:#18181b; padding:12px; border-radius:8px; margin-bottom:8px; border:1px solid #27272a;">
            <strong>${c.name || 'Channel'}</strong><br/>
            <code style="color:#22c55e; font-size:13px;">${c.id || c.jid}</code>
          </div>
        `).join('')
      : '<p style="color:#a1a1aa; font-size:14px;">Channels auto-detection is ready. Use your Channel JID (e.g. <code>120363xxxxxx@newsletter</code>).</p>';

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Xtra WhatsApp Bot</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #f4f4f5; display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0; }
            .card { background: #121215; border: 1px solid #27272a; border-radius: 16px; padding: 32px; max-width: 480px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            .badge { display:inline-block; background: #052e16; color: #4ade80; border: 1px solid #14532d; padding: 6px 14px; border-radius: 9999px; font-weight: 600; font-size: 14px; margin-bottom: 16px; }
            h1 { font-size: 22px; margin: 0 0 8px 0; }
            p { color: #a1a1aa; font-size: 14px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">● Online & Connected</span>
            <h1>WhatsApp Bot Nung Reng E!</h1>
            <p>Linked Phone: <strong>+${userPhone}</strong></p>
            <p>Xtra Cloudflare Functions atanga post thawn apiangin i WhatsApp Channel-ah a lut nghal zung zung tawh ang.</p>
            <hr style="border:0; border-top:1px solid #27272a; margin:20px 0;" />
            <h3 style="font-size:15px; margin-bottom:12px;">Managed Channels (Newsletters):</h3>
            ${channelRows}
          </div>
        </body>
      </html>
    `);
  }

  if (currentQr) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Link WhatsApp - Xtra Bot</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="refresh" content="5">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #f4f4f5; display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0; }
            .card { background: #121215; border: 1px solid #27272a; border-radius: 16px; padding: 32px; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            img { border-radius: 12px; margin: 16px 0; background: white; padding: 12px; }
            p { color: #a1a1aa; font-size: 14px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2 style="margin:0;">Scan QR Code</h2>
            <p>I phone-a WhatsApp hawng la, <strong>Linked Devices &gt; Link a Device</strong> tih thlangin he QR Code hi scan rawh:</p>
            <img src="${currentQr}" alt="WhatsApp QR Code" width="260" height="260" />
            <p style="font-size:12px; color:#71717a;">Page hi second 5 tinin a in-refresh reng ang.</p>
          </div>
        </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Connecting - Xtra Bot</title>
        <meta http-equiv="refresh" content="3">
      </head>
      <body style="font-family: sans-serif; background: #09090b; color: #f4f4f5; display:flex; justify-content:center; align-items:center; height:100vh;">
        <div style="text-align:center;">
          <h2>In-connect mek a ni...</h2>
          <p style="color:#a1a1aa;">QR Code a rawn in-generate mek, lo nghak lawk rawh...</p>
        </div>
      </body>
    </html>
  `);
});

/**
 * Resolve target identifier to WhatsApp Channel JID (e.g. 120363xxx@newsletter)
 */
async function resolveChannelJid(target) {
  if (!target) return null;
  let trimmed = target.trim();

  // If ends with @newsletter, check if the part before @ is pure digits
  if (trimmed.endsWith('@newsletter')) {
    const userPart = trimmed.split('@')[0];
    if (/^\d{10,}$/.test(userPart)) {
      return trimmed; // Real numeric JID e.g. 120363xxxxxxxxxx@newsletter
    }
    trimmed = userPart; // Strip @newsletter from invite code!
  }

  // If numeric JID
  if (/^\d{10,}$/.test(trimmed)) return `${trimmed}@newsletter`;

  // If it's a WhatsApp channel link or invite code (e.g. 0029Va9TAJnKbYMRVbHZbQ1A)
  const match = trimmed.match(/channel\/([A-Za-z0-9_-]+)/) || trimmed.match(/^([A-Za-z0-9_-]{15,})$/);
  const inviteCode = match ? match[1] : trimmed;

  if (inviteCode && sock && typeof sock.newsletterMetadata === 'function') {
    try {
      const meta = await sock.newsletterMetadata('invite', inviteCode);
      if (meta?.id) {
        console.log(`[WhatsApp Bot] Resolved invite ${inviteCode} to REAL numeric JID: ${meta.id} (${meta.name || 'Channel'})`);
        return meta.id;
      }
    } catch (e) {
      console.warn(`[WhatsApp Bot] Note: Could not resolve invite ${inviteCode} via API:`, e.message);
    }
  }

  return trimmed.includes('@') ? trimmed : `${trimmed}@newsletter`;
}

/**
 * Universal Post Endpoint (Supports /send, /messages/image, /messages/text)
 */
async function handleSend(req, res) {
  // Check optional bearer or secret token
  if (API_SECRET) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const reqSecret = req.body?.secret || req.query?.secret;
    if (token !== API_SECRET && reqSecret !== API_SECRET) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid API_SECRET' });
    }
  }

  if (!isConnected || !sock) {
    return res.status(503).json({ success: false, error: 'WhatsApp is not connected yet. Please scan QR code on homepage.' });
  }

  const { to, caption, body, media, imageUrl } = req.body;
  const targetRaw = to || process.env.CHANNEL_JID || '0029Va9TAJnKbYMRVbHZbQ1A';
  const textContent = caption || body || '';
  const photoUrl = media || imageUrl;

  if (!targetRaw) {
    return res.status(400).json({ success: false, error: 'Missing target channel JID ("to" or CHANNEL_JID environment variable)' });
  }

  // Resolve invite links / codes to JID
  const formattedJid = await resolveChannelJid(targetRaw);

  try {
    let resultMsg = null;
    let imagePayload = null;

    if (photoUrl) {
      if (photoUrl.startsWith('data:image/')) {
        // Decode Base64 data URL to Buffer
        const commaIdx = photoUrl.indexOf(',');
        const base64Data = photoUrl.slice(commaIdx + 1);
        imagePayload = Buffer.from(base64Data, 'base64');
      } else if (photoUrl.startsWith('http')) {
        imagePayload = { url: photoUrl };
      }
    }

    if (imagePayload) {
      console.log(`[WhatsApp Bot] Sending image with caption to ${formattedJid}...`);
      resultMsg = await sock.sendMessage(formattedJid, {
        image: imagePayload,
        caption: textContent,
      });
    } else {
      console.log(`[WhatsApp Bot] Sending text to ${formattedJid}...`);
      resultMsg = await sock.sendMessage(formattedJid, {
        text: textContent,
      });
    }

    const messageId = resultMsg?.key?.id || 'sent';
    console.log(`[WhatsApp Bot] Successfully sent message #${messageId}`);

    return res.json({
      success: true,
      messageId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[WhatsApp Bot] Error sending message:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

app.post('/send', handleSend);
app.post('/messages/image', handleSend);
app.post('/messages/text', handleSend);

/**
 * Resolve newsletter metadata from invite code
 */
app.get('/resolve', async (req, res) => {
  const code = req.query.code || '0029Va9TAJnKbYMRVbHZbQ1A';
  try {
    if (!sock) return res.status(503).json({ error: 'Socket not connected' });
    const meta = await sock.newsletterMetadata('invite', code);
    return res.json({ success: true, meta });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Health check & Keep-alive endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connected: isConnected,
    phone: userPhone,
    uptime: process.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`[WhatsApp Bot] Server listening on port ${PORT}`);
});
