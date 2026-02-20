const { fetchAllNews } = require('./_lib');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const articles = await fetchAllNews();
    res.json({ articles, cachedAt: new Date().toISOString() });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
