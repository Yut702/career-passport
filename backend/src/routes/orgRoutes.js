import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getUserByEmail, putUser, getEventsByOrgEmail, getStampsByOrgEmail } from '../lib/dynamo.js';

const router = express.Router();
const TABLE = process.env.DYNAMODB_TABLE_USERS || 'CareerPassportUsers';
const TABLE_EVENTS = process.env.DYNAMODB_TABLE_EVENTS || 'CareerPassportEvents';
const TABLE_STAMPS = process.env.DYNAMODB_TABLE_STAMPS || 'CareerPassportStamps';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// POST /api/org/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, name required' });
    }

    const existing = await getUserByEmail(TABLE, email);
    if (existing) {
      return res.status(409).json({ error: 'user already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = { 
      email, 
      passwordHash, 
      name, 
      role: 'org', 
      createdAt: new Date().toISOString() 
    };
    await putUser(TABLE, user);
    res.status(201).json({ ok: true, user: { email: user.email, name: user.name } });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// POST /api/org/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const user = await getUserByEmail(TABLE, email);
    if (!user) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash || '');
    if (!match) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const token = jwt.sign(
      { sub: user.email, role: user.role || 'org' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, user: { email: user.email, name: user.name } });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'no token' });
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

// GET /api/org/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const email = req.user && req.user.sub;
    if (!email) {
      return res.status(400).json({ error: 'invalid token payload' });
    }
    
    const user = await getUserByEmail(TABLE, email);
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }
    
    res.json({ email: user.email, name: user.name, role: user.role });
  } catch (err) {
    console.error('me error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

/**
 * GET /api/org/dashboard
 * ログイン中の組織のダッシュボード情報を返す
 * 
 * 動作確認用 curl コマンド:
 * 1. まずログインしてトークンを取得:
 *    TOKEN=$(curl -s -X POST http://localhost:3000/api/org/login \
 *      -H "Content-Type: application/json" \
 *      -d '{"email":"org@example.com","password":"password123"}' | jq -r '.token')
 * 
 * 2. ダッシュボード API を呼び出し:
 *    curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/org/dashboard | jq
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const orgEmail = req.user && req.user.sub;
    if (!orgEmail) {
      return res.status(400).json({ error: 'invalid token payload' });
    }

    // 組織のイベント一覧を取得
    const events = await getEventsByOrgEmail(TABLE_EVENTS, orgEmail);

    // 組織のスタンプ一覧を取得
    const stamps = await getStampsByOrgEmail(TABLE_STAMPS, orgEmail);

    // 集計: ユニーク参加者数
    const participantSet = new Set();
    stamps.forEach(stamp => {
      if (stamp.studentEmail) {
        participantSet.add(stamp.studentEmail);
      }
    });

    // イベントごとの集計
    const eventDetails = events.map(event => {
      const eventStamps = stamps.filter(s => s.eventId === event.eventId);
      const eventParticipants = new Set(eventStamps.map(s => s.studentEmail).filter(Boolean));
      return {
        eventId: event.eventId,
        title: event.title || 'Untitled Event',
        participantCount: eventParticipants.size,
        stampCount: eventStamps.length,
        satisfactionScore: event.satisfactionScore ?? null
      };
    });

    // ダッシュボードレスポンス
    const dashboard = {
      orgId: orgEmail,
      summary: {
        totalStamps: stamps.length,
        totalParticipants: participantSet.size,
        totalNfts: 0 // NFT連携は未実装のため 0
      },
      events: eventDetails
    };

    res.json(dashboard);
  } catch (err) {
    console.error('dashboard error', err);
    res.status(500).json({ error: 'internal error' });
  }
});

export default router;
