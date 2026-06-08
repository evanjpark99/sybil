import { verifyToken, createClerkClient } from '@clerk/backend';

const READING_LIMIT = 5;

async function getClerkUser(userId) {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  return clerk.users.getUser(userId);
}

async function incrementReadingCount(userId, currentCount) {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  await clerk.users.updateUserMetadata(userId, {
    privateMetadata: { readingCount: currentCount + 1 },
  });
}

async function authenticate(req, res) {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    return payload.sub; // userId
  } catch (e) {
    res.status(401).json({ error: 'Invalid session' });
    return null;
  }
}

export default async function handler(req, res) {
  // ── GET: return current reading count for this user ───────────────────────
  if (req.method === 'GET') {
    const userId = await authenticate(req, res);
    if (!userId) return;
    try {
      const user = await getClerkUser(userId);
      const used = user.privateMetadata?.readingCount ?? 0;
      return res.status(200).json({ used, remaining: READING_LIMIT - used, limit: READING_LIMIT });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch reading count' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const userId = await authenticate(req, res);
  if (!userId) return;

  // ── Reading limit check ───────────────────────────────────────────────────
  let used;
  try {
    const user = await getClerkUser(userId);
    used = user.privateMetadata?.readingCount ?? 0;
  } catch (e) {
    return res.status(500).json({ error: 'Failed to verify reading limit' });
  }

  if (used >= READING_LIMIT) {
    return res.status(402).json({
      error: 'reading_limit_reached',
      message: 'All five readings have been used.',
      used,
      remaining: 0,
      limit: READING_LIMIT,
    });
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

  // ── Anthropic accepted — increment count now ──────────────────────────────
  try {
    await incrementReadingCount(userId, used);
  } catch (e) {
    // Non-fatal: generation continues even if count update fails
    console.error('Failed to increment reading count:', e);
  }

  const remaining = READING_LIMIT - (used + 1);
  res.setHeader('X-Readings-Remaining', String(remaining));

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
  return res.status(200).json({ text: data.content?.[0]?.text ?? '', remaining });
}
