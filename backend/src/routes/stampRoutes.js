import express from 'express';
import {
  getStampsByUser,
  createStamp,
  getStampsByOrganization,
} from '../lib/dynamo-stamps.js';

const router = express.Router();

// ユーザーのスタンプ一覧取得
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stamps = await getStampsByUser(userId);
    res.json({ stamps });
  } catch (err) {
    console.error('Error getting stamps:', err);
    res.status(500).json({ error: 'スタンプの取得に失敗しました' });
  }
});

// 企業のスタンプ一覧取得
router.get('/organization/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const stamps = await getStampsByOrganization(organizationId);
    res.json({ stamps });
  } catch (err) {
    console.error('Error getting stamps:', err);
    res.status(500).json({ error: 'スタンプの取得に失敗しました' });
  }
});

// スタンプ発行
router.post('/', async (req, res) => {
  try {
    const { userId, organizationId, name, organization, category } = req.body;

    if (!userId || !organizationId || !name || !organization) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    const stamp = await createStamp({
      userId,
      organizationId,
      name,
      organization,
      category: category || 'other',
    });

    res.status(201).json({ stamp });
  } catch (err) {
    console.error('Error creating stamp:', err);
    res.status(500).json({ error: 'スタンプの発行に失敗しました' });
  }
});

export default router;

