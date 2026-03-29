# 🌿 GreenTrack Backend API

Node.js + Express backend using a JSON file as the database.
No native modules. No SQLite. Works on any free hosting platform.

---

## 📁 Structure

```
greentrack-backend/
├── server.js           ← Main entry point
├── package.json
├── .env.example        ← Copy to .env
├── data/
│   ├── db.js           ← JSON database helper
│   └── db.json         ← Your actual data (items, messages, subscribers)
├── middleware/
│   └── upload.js       ← Photo upload handler
├── routes/
│   ├── items.js        ← Lost & found reports API
│   └── contact.js      ← Contact form & newsletter API
└── uploads/            ← Uploaded photos saved here
```

---

## 🚀 Run Locally

```bash
npm install
cp .env.example .env
npm start
```

Visit http://localhost:3000/api/health — you should see `{"status":"ok"}`

---

## ☁️ Deploy FREE on Render.com

1. Push this folder to a GitHub repo
2. Go to render.com → Sign up free → New → Web Service
3. Connect your GitHub repo
4. Set these settings:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add environment variable: `CORS_ORIGIN` = your Netlify frontend URL
6. Click Deploy

Render gives you a free URL like:
`https://greentrack-backend.onrender.com`

---

## 📡 API Endpoints

| Method | URL | What it does |
|--------|-----|-------------|
| GET | `/api/health` | Check server is running |
| GET | `/api/items` | List all active items |
| GET | `/api/items/:id` | Get one item |
| POST | `/api/items` | Submit a new report |
| PATCH | `/api/items/:id/status` | Mark resolved/expired |
| DELETE | `/api/items/:id` | Delete an item |
| POST | `/api/contact` | Submit contact form |
| GET | `/api/contact` | List all messages |
| POST | `/api/contact/newsletter` | Subscribe email |
| GET | `/api/contact/newsletter` | List subscribers |

### Query parameters for GET /api/items
- `type` → `lost` or `found`
- `category` → e.g. `Electronics`
- `search` → searches title, description, location
- `sort` → `newest` (default) or `oldest`
- `page` → page number (default 1)
- `limit` → items per page (default 12, max 50)

---

## 🔗 Connecting the Frontend

### Report form (report-item.html)
```js
const formData = new FormData(document.getElementById('reportForm'));
const res = await fetch('https://your-render-url.onrender.com/api/items', {
  method: 'POST',
  body: formData
});
const data = await res.json();
```

### Browse listings (browse.html)
```js
const res = await fetch('https://your-render-url.onrender.com/api/items?sort=newest');
const { items } = await res.json();
```

### Contact form (index.html)
```js
const res = await fetch('https://your-render-url.onrender.com/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, subject, message })
});
```
