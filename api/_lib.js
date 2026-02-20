// Shared RSS parser, location dict, categoriser — used by news.js + chat.js

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
    const cats  = [];
    const catRx = /<category[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/category>/gi;
    let cm;
    while ((cm = catRx.exec(block)) !== null) cats.push(cm[1].trim());
    if (title) items.push({ title, desc: desc.replace(/<[^>]+>/g,'').slice(0,300), link, date, cats });
  }
  return items;
}

const LOCATIONS = {
  'galicia':{lat:42.75,lon:-8.0,reg:'Galicia'},'asturias':{lat:43.36,lon:-5.85,reg:'Asturias'},
  'cantabria':{lat:43.18,lon:-3.98,reg:'Cantabria'},'euskadi':{lat:43.0,lon:-2.5,reg:'País Vasco'},
  'país vasco':{lat:43.0,lon:-2.5,reg:'País Vasco'},'navarra':{lat:42.7,lon:-1.65,reg:'Navarra'},
  'la rioja':{lat:42.28,lon:-2.37,reg:'La Rioja'},'aragón':{lat:41.6,lon:-0.9,reg:'Aragón'},
  'cataluña':{lat:41.8,lon:1.5,reg:'Cataluña'},'catalonia':{lat:41.8,lon:1.5,reg:'Cataluña'},
  'baleares':{lat:39.5,lon:2.9,reg:'Baleares'},'comunidad valenciana':{lat:39.4,lon:-0.38,reg:'Valencia'},
  'valencia':{lat:39.47,lon:-0.38,reg:'Valencia'},'murcia':{lat:37.98,lon:-1.12,reg:'Murcia'},
  'andalucía':{lat:37.5,lon:-4.5,reg:'Andalucía'},'andalucia':{lat:37.5,lon:-4.5,reg:'Andalucía'},
  'extremadura':{lat:39.0,lon:-6.15,reg:'Extremadura'},'castilla-la mancha':{lat:39.5,lon:-2.5,reg:'Castilla-La Mancha'},
  'castilla y león':{lat:41.6,lon:-4.0,reg:'Castilla y León'},'castilla la mancha':{lat:39.5,lon:-2.5,reg:'Castilla-La Mancha'},
  'madrid':{lat:40.42,lon:-3.7,reg:'Madrid'},'canarias':{lat:28.3,lon:-15.5,reg:'Canarias'},
  'bilbao':{lat:43.26,lon:-2.93,reg:'País Vasco'},'zaragoza':{lat:41.65,lon:-0.88,reg:'Aragón'},
  'barcelona':{lat:41.38,lon:2.17,reg:'Cataluña'},'sevilla':{lat:37.39,lon:-5.98,reg:'Andalucía'},
  'seville':{lat:37.39,lon:-5.98,reg:'Andalucía'},'málaga':{lat:36.72,lon:-4.42,reg:'Andalucía'},
  'córdoba':{lat:37.89,lon:-4.78,reg:'Andalucía'},'granada':{lat:37.18,lon:-3.6,reg:'Andalucía'},
  'almería':{lat:36.84,lon:-2.47,reg:'Andalucía'},'huelva':{lat:37.26,lon:-6.94,reg:'Andalucía'},
  'cádiz':{lat:36.53,lon:-6.3,reg:'Andalucía'},'badajoz':{lat:38.88,lon:-6.97,reg:'Extremadura'},
  'a coruña':{lat:43.37,lon:-8.4,reg:'Galicia'},'vigo':{lat:42.23,lon:-8.72,reg:'Galicia'},
  'oviedo':{lat:43.36,lon:-5.85,reg:'Asturias'},'santander':{lat:43.46,lon:-3.81,reg:'Cantabria'},
  'san sebastián':{lat:43.32,lon:-1.98,reg:'País Vasco'},'vitoria':{lat:42.85,lon:-2.68,reg:'País Vasco'},
  'pamplona':{lat:42.82,lon:-1.65,reg:'Navarra'},'valladolid':{lat:41.65,lon:-4.73,reg:'Castilla y León'},
  'burgos':{lat:42.34,lon:-3.7,reg:'Castilla y León'},'salamanca':{lat:40.96,lon:-5.66,reg:'Castilla y León'},
  'toledo':{lat:39.86,lon:-4.02,reg:'Castilla-La Mancha'},'alicante':{lat:38.35,lon:-0.48,reg:'Valencia'},
  'palma':{lat:39.57,lon:2.65,reg:'Baleares'},
  'escombreras':{lat:37.56,lon:-0.96,reg:'Murcia'},'garoña':{lat:42.78,lon:-3.18,reg:'Castilla y León'},
  'almaraz':{lat:39.81,lon:-5.7,reg:'Extremadura'},'cofrentes':{lat:39.25,lon:-1.07,reg:'Valencia'},
  'ascó':{lat:41.2,lon:0.57,reg:'Cataluña'},'vandellós':{lat:40.93,lon:0.87,reg:'Cataluña'},
  'trillo':{lat:40.69,lon:-2.58,reg:'Castilla-La Mancha'},
  'europa':{lat:48.5,lon:2.3,reg:'Europa',global:true},'europe':{lat:48.5,lon:2.3,reg:'Europe',global:true},
  'france':{lat:46.5,lon:2.3,reg:'France',global:true},'francia':{lat:46.5,lon:2.3,reg:'Francia',global:true},
  'portugal':{lat:39.5,lon:-8.0,reg:'Portugal',global:true},'germany':{lat:51.2,lon:10.4,reg:'Germany',global:true},
  'uk':{lat:52.4,lon:-1.9,reg:'United Kingdom',global:true},'united kingdom':{lat:52.4,lon:-1.9,reg:'United Kingdom',global:true},
  'italy':{lat:42.5,lon:12.5,reg:'Italy',global:true},'italia':{lat:42.5,lon:12.5,reg:'Italy',global:true},
  'china':{lat:35.0,lon:105.0,reg:'China',global:true},'india':{lat:22.0,lon:79.0,reg:'India',global:true},
  'usa':{lat:39.0,lon:-98.0,reg:'USA',global:true},'united states':{lat:39.0,lon:-98.0,reg:'USA',global:true},
  'australia':{lat:-25.0,lon:133.0,reg:'Australia',global:true},'brazil':{lat:-15.0,lon:-52.0,reg:'Brazil',global:true},
  'brasil':{lat:-15.0,lon:-52.0,reg:'Brazil',global:true},'africa':{lat:1.0,lon:20.0,reg:'Africa',global:true},
  'middle east':{lat:26.0,lon:50.0,reg:'Middle East',global:true},'saudi':{lat:24.0,lon:45.0,reg:'Saudi Arabia',global:true},
  'russia':{lat:60.0,lon:60.0,reg:'Russia',global:true},'rusia':{lat:60.0,lon:60.0,reg:'Russia',global:true},
  'ukraine':{lat:49.0,lon:32.0,reg:'Ukraine',global:true},'ucrania':{lat:49.0,lon:32.0,reg:'Ukraine',global:true},
  'japan':{lat:37.0,lon:138.0,reg:'Japan',global:true},'japón':{lat:37.0,lon:138.0,reg:'Japan',global:true},
  'north sea':{lat:56.0,lon:3.0,reg:'North Sea',global:true},
  'españa':{lat:40.4,lon:-3.7,reg:'España'},'spain':{lat:40.4,lon:-3.7,reg:'España'},
};

function extractLocation(text, feedGlobal) {
  const lower = text.toLowerCase();
  const keys = Object.keys(LOCATIONS).sort((a,b) => b.length - a.length);
  for (const k of keys) {
    if (lower.includes(k)) {
      const loc = LOCATIONS[k];
      return { lat:loc.lat, lon:loc.lon, name:loc.reg||k, isGlobal:!!(loc.global||feedGlobal) };
    }
  }
  if (feedGlobal) return { lat:30.0, lon:0.0, name:'Global', isGlobal:true };
  return { lat:40.4, lon:-3.7, name:'España', isGlobal:false };
}

function categorize(title, cats) {
  const t = (title+' '+cats.join(' ')).toLowerCase();
  if (t.match(/corte|apagón|fallo|avería|inciden|interrup|black.?out|outage/)) return 'outage';
  if (t.match(/precio|mercado|pool|omie|tarif|subastas?|mwh|eur|coste|factura/)) return 'market';
  if (t.match(/meteo|tormenta|viento|lluvia|temperatura|ola.*calor|aemet|temporal|nieve|sequ/)) return 'weather';
  if (t.match(/regulac|cnmc|boe|ley|decreto|normativa|miteco|ministerio|circular|directiva/)) return 'reg';
  if (t.match(/renovable|eólica|solar|fotovolt|hidro|nuclear|gas|ciclo|generac/)) return 'market';
  return 'reg';
}

function timeAgo(date) {
  if (isNaN(date)) return 'recent';
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff/60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

const FEEDS = [
  { url:'https://www.elperiodicodelaenergia.com/feed/',        src:'El Periódico de la Energía', global:false },
  { url:'https://www.expansion.com/rss/empresas/energia.xml', src:'Expansión Energía',          global:false },
  { url:'https://elpais.com/tag/energia/rss',                 src:'El País Energía',            global:false },
  { url:'https://energia.gob.es/rss',                        src:'MITECO',                     global:false },
  { url:'https://www.renewableenergyworld.com/feed/',         src:'Renewable Energy World',     global:true  },
  { url:'https://feeds.feedburner.com/ieaenergy',            src:'IEA',                        global:true  },
  { url:'https://www.energy-monitor.com/feed/',              src:'Energy Monitor',             global:true  },
];

async function fetchAllNews() {
  const results = [];
  let id = 1;
  for (const feed of FEEDS) {
    try {
      const r = await fetch(feed.url, {
        headers:{'User-Agent':'EnergyEye/1.0'},
        signal: AbortSignal.timeout(7000),
      });
      if (!r.ok) continue;
      const xml = await r.text();
      const items = parseRSS(xml);
      for (const item of items.slice(0,7)) {
        const fullText = item.title+' '+item.desc;
        const loc = extractLocation(fullText, feed.global);
        const cat = categorize(item.title, item.cats);
        const age = item.date ? timeAgo(new Date(item.date)) : 'recent';
        results.push({ id:id++, cat, age, src:feed.src, url:item.link,
          lat:loc.lat, lon:loc.lon, locName:loc.name, isGlobal:loc.isGlobal,
          title:item.title, desc:item.desc, cats:item.cats });
      }
    } catch(e) { /* feed failed, skip */ }
  }
  return results.slice(0, 24);
}

module.exports = { fetchAllNews };
