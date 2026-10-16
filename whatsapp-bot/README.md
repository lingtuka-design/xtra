# Xtra WhatsApp Channel Bot (Baileys v6 / v7 on Render.com)

A 100% Free, 24/7 Node.js + `@whiskeysockets/baileys` microservice designed to run on **Render.com Free Tier Web Service** to automatically broadcast football updates directly to your **WhatsApp Channel (Newsletter)**.

---

## 🚀 How to Deploy on Render.com (Free)

### 1. Push to GitHub
1. Make sure this `whatsapp-bot` folder is pushed to your GitHub repository (or in the root of a repo).

### 2. Create Web Service on Render.com
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Select your GitHub repository.
4. Fill in the service details:
   - **Name**: `xtra-whatsapp-bot`
   - **Runtime**: `Node`
   - **Build Command**: `npm install` (or `bun install`)
   - **Start Command**: `node server.js`
   - **Instance Type**: **Free** ($0 / month)
5. Under **Environment Variables**, add:
   - `CHANNEL_JID`: `120363xxxxxx@newsletter` (Your WhatsApp Channel ID, or leave blank to detect from UI)
   - `API_SECRET`: (Any custom password/secret string to secure your webhook, e.g. `xtra_secret_123`)

Click **Create Web Service**.

---

### 3. Scan QR Code Once
1. Once deployed, open your Render app URL (e.g. `https://xtra-whatsapp-bot.onrender.com`).
2. You will see a clean QR Code page.
3. Open WhatsApp on your phone:
   - Go to **Settings > Linked Devices > Link a Device**.
   - Point your camera at the QR code on the Render screen.
4. That's it! The screen will update to:
   `✅ WhatsApp Bot Nung Reng E! Connected as +91xxxx`
   and it will list all your managed WhatsApp Channels with their Channel JIDs.

---

### 4. Connect to Xtra (Cloudflare Pages)
In your Cloudflare Pages dashboard (`xtra`):
Go to **Settings > Environment Variables**, add:
* `WHATSAPP_API_URL`: `https://xtra-whatsapp-bot.onrender.com`
* `WHATSAPP_API_TOKEN`: `xtra_secret_123` (Same as your `API_SECRET` on Render)
* `WHATSAPP_CHANNEL_ID`: `120363xxxxxx@newsletter`

Now, whenever you click **"Post to FB Now"** or whenever the **15-Minute Queue** auto-posts:
Xtra will automatically send the full-resolution photo and formatted Mizo caption to your **Facebook Page AND WhatsApp Channel simultaneously**!
