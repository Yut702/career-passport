import express from 'express';
import {
  getNFTsByUser,
  createNFT,
  getNFT,
} from '../lib/dynamo-stamps.js';

const router = express.Router();

// ユーザーのNFT一覧取得
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const nfts = await getNFTsByUser(userId);
    res.json({ nfts });
  } catch (err) {
    console.error('Error getting NFTs:', err);
    res.status(500).json({ error: 'NFTの取得に失敗しました' });
  }
});

// NFT詳細取得
router.get('/:nftId', async (req, res) => {
  try {
    const { nftId } = req.params;
    const nft = await getNFT(nftId);
    
    if (!nft) {
      return res.status(404).json({ error: 'NFTが見つかりませんでした' });
    }
    
    res.json({ nft });
  } catch (err) {
    console.error('Error getting NFT:', err);
    res.status(500).json({ error: 'NFTの取得に失敗しました' });
  }
});

// NFT作成
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      tokenId,
      name,
      description,
      rarity,
      organizations,
      stampIds,
      contractAddress,
      transactionHash,
      metadataURI,
    } = req.body;

    if (!userId || !name || !rarity) {
      return res.status(400).json({ error: '必須項目が不足しています' });
    }

    const nft = await createNFT({
      userId,
      tokenId,
      name,
      description,
      rarity,
      organizations: organizations || [],
      stampIds: stampIds || [],
      contractAddress,
      transactionHash,
      metadataURI,
    });

    res.status(201).json({ nft });
  } catch (err) {
    console.error('Error creating NFT:', err);
    res.status(500).json({ error: 'NFTの作成に失敗しました' });
  }
});

export default router;

