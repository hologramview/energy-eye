require('dotenv').config();
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-store'),
}));

// ─── AI Chat — OpenAI GPT-4o ──────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages, system } = req.body;
  console.log('[/api/chat] messages count:', messages?.length, '| system length:', system?.length);
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
    });
    const data = await r.json();
    console.log('[/api/chat] OpenAI status:', r.status, data.error ? '| ERROR: '+data.error.message : '| OK');
    if (data.error) return res.status(500).json({ error: data.error.message });
    res.json({ content: [{ type: 'text', text: data.choices?.[0]?.message?.content || '' }] });
  } catch (e) {
    console.error('[/api/chat] CATCH:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n⚡ Energy Eye running at http://localhost:${PORT}`);
  console.log(`🤖 OpenAI key: ${process.env.OPENAI_API_KEY ? '✅ loaded' : '❌ NOT FOUND'}\n`);
});
