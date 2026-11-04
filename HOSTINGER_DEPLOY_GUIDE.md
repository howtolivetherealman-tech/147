# NETI BHARATHAM (నేటి భారతం) – HOSTINGER HOSTING DEPLOYMENT GUIDE
**Official Domain:** https://netibhaaratham.com
**Contact Email:** netibhaarathamtelugu@gmail.com
**Super Admin Login:** Username `chakri` | Password `1977`

---

## 1. SUPPORTING FILES INCLUDED FOR HOSTINGER
1. **`server.js`** – Main Node.js startup script required by Hostinger hPanel Node.js Selector / Phusion Passenger.
2. **`public/.htaccess`** – Apache/LiteSpeed configuration for HTTPS redirection, GZIP compression, static asset caching, and port 3000 proxy routing.
3. **`ecosystem.config.cjs`** – PM2 process manager configuration for Hostinger VPS / Cloud Hosting.
4. **`package.json` & `next.config.ts`** – Configured with `output: 'standalone'` and `"start": "node server.js"` support.

---

## 2. HOW TO UPLOAD & DEPLOY ON HOSTINGER (hPanel Node.js Web App / Cloud / Business)

### Step 1: Export Project Files
- In AI Studio, click **Download / Export ZIP** (or push to GitHub) so you have the full project folder including:
  - `app/`, `components/`, `lib/`, `public/`
  - `server.js`, `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`
  - `public/.htaccess` and `ecosystem.config.cjs`

### Step 2: Upload to Hostinger File Manager or Git
1. Log in to **Hostinger hPanel** (`https://hpanel.hostinger.com`).
2. Select your domain **`netibhaaratham.com`**.
3. Open **Files → File Manager** and upload the project files into `public_html` (excluding `node_modules` and `.next`).
4. Copy `public/.htaccess` into the root `public_html/.htaccess` as well if using Apache/LiteSpeed proxy.

### Step 3: Configure Node.js in Hostinger hPanel
1. In Hostinger hPanel, go to **Advanced → Node.js** (or **VPS / Terminal**).
2. Set:
   - **Node.js Version:** `20.x` or `22.x`
   - **Application Mode:** `Production`
   - **Application Root:** `public_html`
   - **Application Startup File:** `server.js`
3. Click **NPM Install** (or run `npm install` in SSH terminal).
4. Run build command:
   ```bash
   npm run build
   ```
5. Click **Restart App** (or on Hostinger VPS run `pm2 start ecosystem.config.cjs`).

---

## 3. తెలుగులో సూచనలు (Hostinger అప్‌లోడ్ విధానం)
1. **ఫైల్స్ డౌన్‌లోడ్**: అడ్మిన్ పోర్టల్ (`chakri` / `1977`) లోని **Hostinger Hosting Files** విభాగం నుండి `server.js`, `.htaccess`, `ecosystem.config.cjs`, మరియు డేటాబేస్ బ్యాకప్ (`JSON`) డౌన్‌లోడ్ చేసుకోండి.
2. **Hostinger hPanel సెటప్**:
   - మీ Hostinger ఖాతాలో `netibhaaratham.com` డొమైన్‌ని ఎంచుకోండి.
   - Node.js విభాగంలో **Startup File** గా `server.js` ఎంచుకోండి.
   - టెర్మినల్‌లో `npm install` మరియు `npm run build` రన్ చేసి, ఆపై `node server.js` లేదా `pm2 start ecosystem.config.cjs` ద్వారా వెబ్‌సైట్‌ను లైవ్ చేయండి.
