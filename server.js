require('dotenv').config();
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

// CORS — allow any localhost origin (Windsurf live server, etc)
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false, lastModified: false,
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-store'),
}));

// ─── Minimal RSS/XML parser (no extra deps) ───────────────────
function parseRSS(xml) {
  const items = [];
  const rx = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = rx.exec(xml)) !== null) {
    const block = m[1];
    const get = (tag) => {
      const r = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i');
      const found = r.exec(block);
      return found ? (found[1] || found[2] || '').trim() : '';
    };
    const title = get('title');
    const desc  = get('description') || get('content:encoded') || '';
    const link  = get('link');
    const date  = get('pubDate') || get('dc:date') || '';
    const creator = get('dc:creator') || get('author') || '';
    const cats  = [];
    const catRx = /<category[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/category>/gi;
    let cm;
    while ((cm = catRx.exec(block)) !== null) cats.push(cm[1].trim());

    if (title) items.push({ title, desc: desc.replace(/<[^>]+>/g,'').slice(0,300), link, date, creator, cats });
  }
  return items;
}

// ─── Spanish location dictionary (name → {lat,lon,region}) ────
const LOCATIONS = {
  // Autonomous communities
  'galicia':         {lat:42.75,lon:-8.0,reg:'Galicia'},
  'asturias':        {lat:43.36,lon:-5.85,reg:'Asturias'},
  'cantabria':       {lat:43.18,lon:-3.98,reg:'Cantabria'},
  'euskadi':         {lat:43.0,lon:-2.5,reg:'País Vasco'},
  'país vasco':      {lat:43.0,lon:-2.5,reg:'País Vasco'},
  'navarra':         {lat:42.7,lon:-1.65,reg:'Navarra'},
  'la rioja':        {lat:42.28,lon:-2.37,reg:'La Rioja'},
  'aragón':          {lat:41.6,lon:-0.9,reg:'Aragón'},
  'cataluña':        {lat:41.8,lon:1.5,reg:'Cataluña'},
  'catalonia':       {lat:41.8,lon:1.5,reg:'Cataluña'},
  'baleares':        {lat:39.5,lon:2.9,reg:'Baleares'},
  'comunidad valenciana':{lat:39.4,lon:-0.38,reg:'Valencia'},
  'valencia':        {lat:39.47,lon:-0.38,reg:'Valencia'},
  'murcia':          {lat:37.98,lon:-1.12,reg:'Murcia'},
  'andalucía':       {lat:37.5,lon:-4.5,reg:'Andalucía'},
  'andalucia':       {lat:37.5,lon:-4.5,reg:'Andalucía'},
  'extremadura':     {lat:39.0,lon:-6.15,reg:'Extremadura'},
  'castilla-la mancha':{lat:39.5,lon:-2.5,reg:'Castilla-La Mancha'},
  'castilla y león': {lat:41.6,lon:-4.0,reg:'Castilla y León'},
  'castilla la mancha':{lat:39.5,lon:-2.5,reg:'Castilla-La Mancha'},
  'madrid':          {lat:40.42,lon:-3.7,reg:'Madrid'},
  'canarias':        {lat:28.3,lon:-15.5,reg:'Canarias'},
  'canary':          {lat:28.3,lon:-15.5,reg:'Canarias'},
  // Cities
  'bilbao':          {lat:43.26,lon:-2.93,reg:'País Vasco'},
  'zaragoza':        {lat:41.65,lon:-0.88,reg:'Aragón'},
  'barcelona':       {lat:41.38,lon:2.17,reg:'Cataluña'},
  'sevilla':         {lat:37.39,lon:-5.98,reg:'Andalucía'},
  'seville':         {lat:37.39,lon:-5.98,reg:'Andalucía'},
  'málaga':          {lat:36.72,lon:-4.42,reg:'Andalucía'},
  'córdoba':         {lat:37.89,lon:-4.78,reg:'Andalucía'},
  'granada':         {lat:37.18,lon:-3.6,reg:'Andalucía'},
  'almería':         {lat:36.84,lon:-2.47,reg:'Andalucía'},
  'huelva':          {lat:37.26,lon:-6.94,reg:'Andalucía'},
  'cádiz':           {lat:36.53,lon:-6.3,reg:'Andalucía'},
  'badajoz':         {lat:38.88,lon:-6.97,reg:'Extremadura'},
  'cáceres':         {lat:39.47,lon:-6.37,reg:'Extremadura'},
  'a coruña':        {lat:43.37,lon:-8.4,reg:'Galicia'},
  'ferrol':          {lat:43.49,lon:-8.24,reg:'Galicia'},
  'vigo':            {lat:42.23,lon:-8.72,reg:'Galicia'},
  'lugo':            {lat:43.01,lon:-7.56,reg:'Galicia'},
  'pontevedra':      {lat:42.43,lon:-8.65,reg:'Galicia'},
  'oviedo':          {lat:43.36,lon:-5.85,reg:'Asturias'},
  'gijón':           {lat:43.54,lon:-5.66,reg:'Asturias'},
  'santander':       {lat:43.46,lon:-3.81,reg:'Cantabria'},
  'san sebastián':   {lat:43.32,lon:-1.98,reg:'País Vasco'},
  'vitoria':         {lat:42.85,lon:-2.68,reg:'País Vasco'},
  'pamplona':        {lat:42.82,lon:-1.65,reg:'Navarra'},
  'logroño':         {lat:42.47,lon:-2.44,reg:'La Rioja'},
  'valladolid':      {lat:41.65,lon:-4.73,reg:'Castilla y León'},
  'burgos':          {lat:42.34,lon:-3.7,reg:'Castilla y León'},
  'salamanca':       {lat:40.96,lon:-5.66,reg:'Castilla y León'},
  'segovia':         {lat:40.95,lon:-4.12,reg:'Castilla y León'},
  'toledo':          {lat:39.86,lon:-4.02,reg:'Castilla-La Mancha'},
  'albacete':        {lat:38.99,lon:-1.86,reg:'Castilla-La Mancha'},
  'alicante':        {lat:38.35,lon:-0.48,reg:'Valencia'},
  'castellón':       {lat:39.98,lon:-0.03,reg:'Valencia'},
  'palma':           {lat:39.57,lon:2.65,reg:'Baleares'},
  'cartagena':       {lat:37.61,lon:-0.99,reg:'Murcia'},
  'paterna':         {lat:39.5,lon:-0.44,reg:'Valencia'},
  // Energy infrastructure locations
  'escombreras':     {lat:37.56,lon:-0.96,reg:'Murcia'},
  'garoña':          {lat:42.78,lon:-3.18,reg:'Castilla y León'},
  'almaraz':         {lat:39.81,lon:-5.7,reg:'Extremadura'},
  'cofrentes':       {lat:39.25,lon:-1.07,reg:'Valencia'},
  'ascó':            {lat:41.2,lon:0.57,reg:'Cataluña'},
  'vandellós':       {lat:40.93,lon:0.87,reg:'Cataluña'},
  'trillo':          {lat:40.69,lon:-2.58,reg:'Castilla-La Mancha'},
  // Special
  'europa':          {lat:48.5,lon:2.3,reg:'Europa'},
  'france':          {lat:46.5,lon:2.3,reg:'Francia'},
  'francia':         {lat:46.5,lon:2.3,reg:'Francia'},
  'portugal':        {lat:39.5,lon:-8.0,reg:'Portugal'},
  'madrid':          {lat:40.42,lon:-3.7,reg:'Madrid'},
  'españa':          {lat:40.4,lon:-3.7,reg:'España'},
  'spain':           {lat:40.4,lon:-3.7,reg:'España'},
};

function extractLocation(text) {
  const lower = text.toLowerCase();
  // Longest match first
  const keys = Object.keys(LOCATIONS).sort((a,b) => b.length - a.length);
  for (const k of keys) {
    if (lower.includes(k)) {
      const loc = LOCATIONS[k];
      return { lat: loc.lat, lon: loc.lon, name: LOCATIONS[k].reg || k };
    }
  }
  return { lat: 40.4, lon: -3.7, name: 'España' }; // default: Spain center
}

function categorize(title, cats) {
  const t = (title + ' ' + cats.join(' ')).toLowerCase();
  if (t.match(/corte|apagón|fallo|avería|inciden|interrup|black.?out|outage/)) return 'outage';
  if (t.match(/precio|mercado|pool|omie|tarif|subastas?|mwh|eur|coste|factura/)) return 'market';
  if (t.match(/meteo|tormenta|viento|lluvia|temperatura|ola.*calor|aemet|temporal|nieve|sequ/)) return 'weather';
  if (t.match(/regulac|cnmc|boe|ley|decreto|normativa|miteco|ministerio|circular|directiva/)) return 'reg';
  if (t.match(/renovable|eólica|solar|fotovolt|hidro|nuclear|gas|ciclo|generac/)) return 'market';
  return 'reg';
}

// ─── News cache ────────────────────────────────────────────────
let newsCache = null;
let newsCacheTime = 0;
const NEWS_TTL = 10 * 60 * 1000; // 10 min

const FEEDS = [
  { url: 'https://www.elperiodicodelaenergia.com/feed/', src: 'El Periódico de la Energía' },
  { url: 'https://www.expansion.com/rss/empresas/energia.xml', src: 'Expansión Energía' },
  { url: 'https://elpais.com/tag/energia/rss', src: 'El País Energía' },
  { url: 'https://energia.gob.es/rss', src: 'MITECO' },
];

async function fetchNews() {
  if (newsCache && Date.now() - newsCacheTime < NEWS_TTL) return newsCache;

  const results = [];
  let id = 1;

  for (const feed of FEEDS) {
    try {
      const r = await fetch(feed.url, {
        headers: { 'User-Agent': 'EnergyEye/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) continue;
      const xml = await r.text();
      const items = parseRSS(xml);
      for (const item of items.slice(0, 8)) {
        const fullText = item.title + ' ' + item.desc;
        const loc = extractLocation(fullText);
        const cat = categorize(item.title, item.cats);
        const age = item.date ? timeAgo(new Date(item.date)) : 'reciente';
        results.push({
          id: id++,
          cat,
          age,
          src: feed.src,
          url: item.link,
          lat: loc.lat,
          lon: loc.lon,
          locName: loc.name,
          title: item.title,
          desc: item.desc,
          cats: item.cats,
        });
      }
    } catch(e) {
      console.warn(`[news] Feed failed: ${feed.url} — ${e.message}`);
    }
  }

  // Sort by most recent first (id = insertion order from date-sorted feeds)
  newsCache = results.slice(0, 24);
  newsCacheTime = Date.now();
  return newsCache;
}

function timeAgo(date) {
  if (isNaN(date)) return 'reciente';
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'hace un momento';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h/24)} días`;
}

// ─── /api/news ─────────────────────────────────────────────────
app.get('/api/news', async (req, res) => {
  try {
    const news = await fetchNews();
    res.json({ articles: news, cachedAt: new Date(newsCacheTime).toISOString() });
  } catch(e) {
    console.error('[/api/news]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/news/refresh', async (req, res) => {
  newsCacheTime = 0; // invalidate cache
  try {
    const news = await fetchNews();
    res.json({ articles: news, cachedAt: new Date(newsCacheTime).toISOString() });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── AI Chat — OpenAI GPT-4o ────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages, system } = req.body;
  console.log('[/api/chat] messages:', messages?.length, '| system len:', system?.length);
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 400,
        messages: [
          { role: 'system', content: system || 'You are an AI grid operations assistant.' },
          ...messages,
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });
    const data = await r.json();
    console.log('[/api/chat] OpenAI status:', r.status, data.error ? '| ERR: '+data.error.message : '| OK');
    if (data.error) return res.status(500).json({ error: data.error.message });
    res.json({ content: [{ type: 'text', text: data.choices?.[0]?.message?.content || '' }] });
  } catch (e) {
    console.error('[/api/chat] CATCH:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n⚡ Energy Eye → http://localhost:${PORT}`);
  console.log(`🤖 OpenAI: ${process.env.OPENAI_API_KEY ? '✅' : '❌ MISSING'}`);
  console.log(`📰 News feeds: ${FEEDS.length} sources configured\n`);
});
