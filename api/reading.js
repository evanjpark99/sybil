import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Auth: verify Clerk session token ──────────────────────────────────────
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await clerk.verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid session' });
  }

  // ── Validate env ──────────────────────────────────────────────────────────
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const { prompt, system, maxTokens = 12000, stream = false } = req.body ?? {};
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  // ── Call Anthropic ────────────────────────────────────────────────────────
  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      stream,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text().catch(() => '');
    return res.status(anthropicRes.status).json({ error: errText.slice(0, 300) });
  }

  // ── Stream response ───────────────────────────────────────────────────────
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    const reader = anthropicRes.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
    } finally {
      res.end();
    }
    return;
  }

  // ── Non-stream response ───────────────────────────────────────────────────
  const data = await anthropicRes.json();
  return res.status(200).json({ text: data.content?.[0]?.text ?? '' });
}
