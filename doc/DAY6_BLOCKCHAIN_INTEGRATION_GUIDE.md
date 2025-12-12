# Day 6: UI とブロックチェーンの統合 - 詳細手順書

## 目次

1. [前提条件の確認](#1-前提条件の確認)
2. [残りのページのブロックチェーン連携](#2-残りのページのブロックチェーン連携)
3. [ローカルストレージとブロックチェーンの同期](#3-ローカルストレージとブロックチェーンの同期)
4. [エラーハンドリングの強化](#4-エラーハンドリングの強化)
5. [ローディング状態の表示改善](#5-ローディング状態の表示改善)
6. [トランザクション状態の可視化](#6-トランザクション状態の可視化)
7. [動作確認とテスト](#7-動作確認とテスト)
8. [トラブルシューティング](#8-トラブルシューティング)

---

## 1. 前提条件の確認

### 1.1 Day 5 の完了確認

Day 6 を開始する前に、Day 5 の作業が完了していることを確認します：

**確認項目**:

- ✅ `useWallet` フックが実装されている
- ✅ `useContracts` フックが実装されている
- ✅ スタンプ発行機能がブロックチェーン連携済み（`OrgStampIssuance.jsx`）
- ✅ NFT 発行機能がブロックチェーン連携済み（`MyPage.jsx`）
- ✅ ネットワーク設定が実装されている（`network.js`）
- ✅ トランザクション状態管理が実装されている（`transactions.js`）

**確認コマンド**:

```bash
# フロントエンドのディレクトリ構造を確認
cd frontend/src
ls -la hooks/
ls -la lib/
```

**期待されるファイル**:

- `hooks/useWallet.js`
- `hooks/useContracts.js`
- `lib/network.js`
- `lib/transactions.js`

### 1.2 コントラクトのデプロイ確認

コントラクトがデプロイされていることを確認します：

```bash
cd contracts
cat deployed.json | jq .
```

**期待される出力**:

```json
{
  "31337": {
    "CareerPassportNFT": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "StampManager": "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0"
  }
}
```

### 1.3 Anvil の起動確認

Anvil が起動していることを確認します：

```bash
# Chain ID を取得して確認
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

**期待される出力**:

```json
{ "jsonrpc": "2.0", "id": 1, "result": "0x7a69" }
```

---

## 2. 残りのページのブロックチェーン連携

### 2.1 NFT 一覧ページのブロックチェーン連携

`MyNFTs.jsx` を更新して、ブロックチェーンから NFT を読み込むようにします。

**ファイル**: `frontend/src/pages/MyNFTs.jsx`

```javascript
import { useEffect, useState } from "react";
import NFTCard from "../components/NFTCard";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";
import { storage } from "../lib/storage";

export default function MyNFTs() {
  const { nftContract, isReady } = useContracts();
  const { account, isConnected } = useWallet();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isConnected && isReady && account) {
      loadNFTs();
    } else if (!isConnected) {
      // ウォレット未接続時はローカルストレージから読み込む（フォールバック）
      loadNFTsFromStorage();
    }
  }, [isConnected, isReady, account, nftContract]);

  /**
   * ブロックチェーンから NFT を読み込む
   */
  const loadNFTs = async () => {
    if (!nftContract || !account) return;

    setLoading(true);
    setError(null);

    try {
      // 総供給量を取得
      const totalSupply = await nftContract.totalSupply();
      const totalSupplyNumber = Number(totalSupply);

      // ユーザーが所有する NFT のトークン ID を取得
      const userNFTs = [];
      for (let i = 0; i < totalSupplyNumber; i++) {
        try {
          const owner = await nftContract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            // NFT の詳細情報を取得
            const tokenURI = await nftContract.tokenURI(i);
            const tokenName = await nftContract.tokenName(i);
            const rarity = await nftContract.tokenRarity(i);
            const organizations = await nftContract.tokenOrganizations(i);

            userNFTs.push({
              id: `nft_${i}`,
              tokenId: i,
              name: tokenName,
              description: "",
              rarity: rarity,
              organizations: organizations,
              contractAddress: nftContract.target,
              metadataURI: tokenURI,
              mintedAt: new Date().toISOString().split("T")[0],
            });
          }
        } catch (err) {
          // トークンが存在しない場合はスキップ
          console.warn(`Token ${i} does not exist:`, err);
        }
      }

      setNfts(userNFTs);

      // ローカルストレージに保存（キャッシュ）
      if (userNFTs.length > 0) {
        storage.saveNFTs(userNFTs);
      }
    } catch (err) {
      console.error("Error loading NFTs:", err);
      setError("NFTの読み込みに失敗しました");
      // エラー時はローカルストレージから読み込む（フォールバック）
      loadNFTsFromStorage();
    } finally {
      setLoading(false);
    }
  };

  /**
   * ローカルストレージから NFT を読み込む（フォールバック）
   */
  const loadNFTsFromStorage = () => {
    try {
      const nftsData = storage.getNFTs();
      setNfts(nftsData || []);
    } catch (err) {
      console.error("Error loading NFTs from storage:", err);
      setError("NFTの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error && nfts.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800 font-semibold mb-2">エラー</div>
        <div className="text-red-600">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-3xl">🏆</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">所有 NFT 証明書</h1>
          <p className="text-gray-600 mt-1">あなたが取得した証明書一覧</p>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-800 text-sm">
            ⚠️ {error}（ローカルストレージのデータを表示しています）
          </div>
        </div>
      )}

      {nfts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-100">
          <div className="text-8xl mb-6">📭</div>
          <p className="text-gray-700 text-xl font-semibold mb-2">
            まだ NFT 証明書を取得していません
          </p>
          <p className="text-gray-500 text-base">
            スタンプを 3 つ集めて NFT 証明書を取得しましょう！
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2.2 ユーザーダッシュボードのブロックチェーン連携

`Home.jsx` を更新して、ブロックチェーンからスタンプと NFT を読み込むようにします。

**ファイル**: `frontend/src/pages/Home.jsx`

```javascript
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import StampCard from "../components/StampCard";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";
import { storage } from "../lib/storage";

export default function Home() {
  const { nftContract, stampManagerContract, isReady } = useContracts();
  const { account, isConnected } = useWallet();
  const [user, setUser] = useState(null);
  const [stamps, setStamps] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [organizationStats, setOrganizationStats] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && isReady && account) {
      loadData();
    } else if (!isConnected) {
      // ウォレット未接続時はローカルストレージから読み込む（フォールバック）
      loadDataFromStorage();
    }
  }, [isConnected, isReady, account, nftContract, stampManagerContract]);

  /**
   * ブロックチェーンからデータを読み込む
   */
  const loadData = async () => {
    if (!stampManagerContract || !nftContract || !account) return;

    setLoading(true);
    setError(null);

    try {
      // ユーザー情報（ローカルストレージから）
      const userData = storage.getUser();
      setUser(userData);

      // ブロックチェーンからスタンプを読み込む
      const userStamps = await stampManagerContract.getUserStamps(account);
      const formattedStamps = userStamps.map((stamp, index) => ({
        id: `stamp_${index}`,
        name: stamp.name,
        organization: stamp.organization,
        category: stamp.category,
        issuedAt: new Date(Number(stamp.issuedAt) * 1000)
          .toISOString()
          .split("T")[0],
      }));
      setStamps(formattedStamps);

      // ローカルストレージに保存（キャッシュ）
      if (formattedStamps.length > 0) {
        storage.saveStamps(formattedStamps);
      }

      // ブロックチェーンから NFT を読み込む
      const totalSupply = await nftContract.totalSupply();
      const totalSupplyNumber = Number(totalSupply);
      const userNFTs = [];

      for (let i = 0; i < totalSupplyNumber; i++) {
        try {
          const owner = await nftContract.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) {
            const tokenName = await nftContract.tokenName(i);
            const rarity = await nftContract.tokenRarity(i);
            const organizations = await nftContract.tokenOrganizations(i);

            userNFTs.push({
              id: `nft_${i}`,
              tokenId: i,
              name: tokenName,
              rarity: rarity,
              organizations: organizations,
            });
          }
        } catch (err) {
          console.warn(`Token ${i} does not exist:`, err);
        }
      }

      setNfts(userNFTs);

      // ローカルストレージに保存（キャッシュ）
      if (userNFTs.length > 0) {
        storage.saveNFTs(userNFTs);
      }

      // 企業別のスタンプ数を集計
      const stats = {};
      formattedStamps.forEach((stamp) => {
        if (!stats[stamp.organization]) {
          stats[stamp.organization] = 0;
        }
        stats[stamp.organization]++;
      });
      setOrganizationStats(stats);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("データの読み込みに失敗しました");
      // エラー時はローカルストレージから読み込む（フォールバック）
      loadDataFromStorage();
    } finally {
      setLoading(false);
    }
  };

  /**
   * ローカルストレージからデータを読み込む（フォールバック）
   */
  const loadDataFromStorage = () => {
    try {
      storage.initMockData();
      const userData = storage.getUser();
      const stampsData = storage.getStamps();
      const nftsData = storage.getNFTs();

      setUser(userData);
      setStamps(stampsData || []);
      setNfts(nftsData || []);

      // 企業別のスタンプ数を集計
      const stats = {};
      if (stampsData && stampsData.length > 0) {
        stampsData.forEach((stamp) => {
          if (!stats[stamp.organization]) {
            stats[stamp.organization] = 0;
          }
          stats[stamp.organization]++;
        });
      }
      setOrganizationStats(stats);
    } catch (err) {
      console.error("Error loading data from storage:", err);
      setError("データの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 次の目標を計算（3つ未満の企業）
  const getNextGoal = () => {
    for (const [org, count] of Object.entries(organizationStats)) {
      if (count < 3) {
        return { organization: org, current: count, needed: 3 - count };
      }
    }
    return null;
  };

  const nextGoal = getNextGoal();
  const recentStamps = stamps.slice(-3).reverse();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error && stamps.length === 0 && nfts.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800 font-semibold mb-2">エラー</div>
        <div className="text-red-600">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white overflow-hidden">
        {/* 装飾的な背景 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">
            {user?.name || account
              ? `${account.slice(0, 6)}...${account.slice(-4)}`
              : "ゲスト"}
            さん、こんにちは！
          </h1>
          <p className="text-blue-100 mb-6">あなたのキャリアパスポート</p>
          {error && (
            <div className="mb-4 bg-yellow-500/20 backdrop-blur-sm rounded-lg p-3 border border-yellow-300/30">
              <div className="text-yellow-100 text-sm">
                ⚠️ {error}（ローカルストレージのデータを表示しています）
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-white/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎫</span>
                </div>
                <div>
                  <div className="text-sm text-blue-100">現在のスタンプ数</div>
                  <div className="text-4xl font-bold">{stamps.length} 枚</div>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-white/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <div className="text-sm text-blue-100">NFT 証明書</div>
                  <div className="text-4xl font-bold">{nfts.length} 枚</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 次の目標 */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">🎯</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">次の目標</h2>
        </div>
        {nextGoal ? (
          <div className="space-y-4">
            <p className="text-gray-700 text-lg">
              <span className="font-bold text-gray-900">
                {nextGoal.organization}
              </span>
              認定 NFT まで
              <span className="font-bold text-blue-600 ml-2">
                あと {nextGoal.needed} スタンプ！
              </span>
            </p>
            <ProgressBar
              current={nextGoal.current}
              total={3}
              label={`${nextGoal.organization} スタンプ`}
            />
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-lg">すべての目標を達成しました！🎉</p>
            <p className="text-sm mt-2">
              新しいスタンプを集めて、さらに成長しましょう。
            </p>
          </div>
        )}
      </div>

      {/* 最近のスタンプ */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-xl">🎫</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">最近のスタンプ</h2>
        </div>
        {recentStamps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentStamps.map((stamp) => (
              <StampCard key={stamp.id} stamp={stamp} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">まだスタンプがありません</p>
            <p className="text-sm">
              企業のイベントに参加してスタンプを集めましょう！
            </p>
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/student/mypage"
          className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
        >
          <span className="flex items-center justify-center space-x-2">
            <span>マイページを見る</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </Link>
        <Link
          to="/student/nfts"
          className="group bg-white border-2 border-gray-300 text-gray-700 text-center py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-lg hover:border-blue-400 transform hover:-translate-y-1 transition-all duration-300"
        >
          <span className="flex items-center justify-center space-x-2">
            <span>NFT証明書を見る</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}
```

### 2.3 企業ダッシュボードのブロックチェーン連携

`OrgDashboard.jsx` を更新して、ブロックチェーンから統計情報を読み込むようにします。

**ファイル**: `frontend/src/pages/OrgDashboard.jsx`

```javascript
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";
import { storage } from "../lib/storage";

export default function OrgDashboard() {
  const { nftContract, stampManagerContract, isReady } = useContracts();
  const { account, isConnected } = useWallet();
  const [stats, setStats] = useState({
    totalStamps: 0,
    totalUsers: 0,
    totalNFTs: 0,
  });
  const [recentStamps, setRecentStamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isConnected && isReady && account) {
      loadData();
    } else if (!isConnected) {
      // ウォレット未接続時はローカルストレージから読み込む（フォールバック）
      loadDataFromStorage();
    }
  }, [isConnected, isReady, account, nftContract, stampManagerContract]);

  /**
   * ブロックチェーンからデータを読み込む
   */
  const loadData = async () => {
    if (!stampManagerContract || !nftContract) return;

    setLoading(true);
    setError(null);

    try {
      // 注意: 現在のコントラクト実装では、全ユーザーのスタンプを取得する機能がないため、
      // ここでは簡易的な実装を行います。
      // 実際の実装では、イベントログを解析するか、別のコントラクト関数を追加する必要があります。

      // NFT の総供給量を取得
      const totalSupply = await nftContract.totalSupply();
      const totalNFTs = Number(totalSupply);

      // 統計情報を設定（簡易版）
      // 実際の実装では、コントラクトに全スタンプ数や全ユーザー数を取得する関数を追加する必要があります
      setStats({
        totalStamps: 0, // コントラクトから取得できないため、0 に設定
        totalUsers: 0, // コントラクトから取得できないため、0 に設定
        totalNFTs: totalNFTs,
      });

      // 最近の発行（ローカルストレージから読み込む）
      const stamps = storage.getStamps();
      setRecentStamps(stamps.slice(-5).reverse() || []);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("データの読み込みに失敗しました");
      // エラー時はローカルストレージから読み込む（フォールバック）
      loadDataFromStorage();
    } finally {
      setLoading(false);
    }
  };

  /**
   * ローカルストレージからデータを読み込む（フォールバック）
   */
  const loadDataFromStorage = () => {
    try {
      storage.initMockData();
      const stamps = storage.getStamps();
      const nfts = storage.getNFTs();

      // 統計を計算
      const uniqueUsers = new Set(stamps.map((s) => s.id));
      setStats({
        totalStamps: stamps.length || 0,
        totalUsers: uniqueUsers.size || 0,
        totalNFTs: nfts.length || 0,
      });

      // 最近の発行（簡易版）
      setRecentStamps(stamps.slice(-5).reverse() || []);
    } catch (err) {
      console.error("Error loading dashboard from storage:", err);
      setError("データの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error && stats.totalStamps === 0 && stats.totalNFTs === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800 font-semibold mb-2">エラー</div>
        <div className="text-red-600">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            企業管理画面
          </h1>
          <p className="text-gray-600">スタンプ発行と統計管理</p>
        </div>
        <Link
          to="/org/stamp-issuance"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
        >
          🎫 スタンプを発行
        </Link>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-800 text-sm">
            ⚠️ {error}（ローカルストレージのデータを表示しています）
          </div>
        </div>
      )}

      {/* ダッシュボード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🎫</span>
            </div>
          </div>
          <div className="text-sm text-blue-100 mb-2">発行済みスタンプ</div>
          <div className="text-4xl font-bold">{stats.totalStamps} 枚</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl">👥</span>
            </div>
          </div>
          <div className="text-sm text-green-100 mb-2">参加者数</div>
          <div className="text-4xl font-bold">{stats.totalUsers} 人</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🏆</span>
            </div>
          </div>
          <div className="text-sm text-purple-100 mb-2">NFT 発行数</div>
          <div className="text-4xl font-bold">{stats.totalNFTs} 枚</div>
        </div>
      </div>

      {/* 最近の発行 */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">最近の発行</h2>
        </div>
        <div className="space-y-3">
          {recentStamps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg">
                まだスタンプを発行していません
              </p>
            </div>
          ) : (
            recentStamps.map((stamp) => (
              <div
                key={stamp.id}
                className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎫</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{stamp.name}</div>
                    <div className="text-sm text-gray-600">
                      {stamp.organization}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  {new Date(stamp.issuedAt).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

### 2.4 NFT 詳細ページのブロックチェーン連携

`NFTDetail.jsx` を更新して、ブロックチェーンから NFT の詳細情報を読み込むようにします。

**ファイル**: `frontend/src/pages/NFTDetail.jsx`

```javascript
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";
import { storage } from "../lib/storage";

export default function NFTDetail() {
  const { id } = useParams();
  const { nftContract, isReady } = useContracts();
  const { account, isConnected } = useWallet();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isConnected && isReady && account && id) {
      loadNFT();
    } else if (!isConnected && id) {
      // ウォレット未接続時はローカルストレージから読み込む（フォールバック）
      loadNFTFromStorage();
    }
  }, [isConnected, isReady, account, id, nftContract]);

  /**
   * ブロックチェーンから NFT の詳細情報を読み込む
   */
  const loadNFT = async () => {
    if (!nftContract || !id) return;

    setLoading(true);
    setError(null);

    try {
      // トークン ID を取得（URL パラメータから）
      const tokenId = parseInt(id.replace("nft_", ""));

      // NFT の詳細情報を取得
      const tokenURI = await nftContract.tokenURI(tokenId);
      const tokenName = await nftContract.tokenName(tokenId);
      const rarity = await nftContract.tokenRarity(tokenId);
      const organizations = await nftContract.tokenOrganizations(tokenId);
      const owner = await nftContract.ownerOf(tokenId);

      const nftData = {
        id: `nft_${tokenId}`,
        tokenId: tokenId,
        name: tokenName,
        description: "",
        rarity: rarity,
        organizations: organizations,
        contractAddress: nftContract.target,
        metadataURI: tokenURI,
        owner: owner,
      };

      setNft(nftData);

      // ローカルストレージに保存（キャッシュ）
      const nfts = storage.getNFTs();
      const existingIndex = nfts.findIndex((n) => n.id === nftData.id);
      if (existingIndex >= 0) {
        nfts[existingIndex] = nftData;
      } else {
        nfts.push(nftData);
      }
      storage.saveNFTs(nfts);
    } catch (err) {
      console.error("Error loading NFT:", err);
      setError("NFTの読み込みに失敗しました");
      // エラー時はローカルストレージから読み込む（フォールバック）
      loadNFTFromStorage();
    } finally {
      setLoading(false);
    }
  };

  /**
   * ローカルストレージから NFT を読み込む（フォールバック）
   */
  const loadNFTFromStorage = () => {
    try {
      const nfts = storage.getNFTs();
      const nftData = nfts.find((n) => n.id === id);
      if (nftData) {
        setNft(nftData);
      } else {
        setError("NFTが見つかりません");
      }
    } catch (err) {
      console.error("Error loading NFT from storage:", err);
      setError("NFTの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error && !nft) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800 font-semibold mb-2">エラー</div>
        <div className="text-red-600">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="text-gray-800 font-semibold mb-2">
          NFT が見つかりません
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">{nft.name}</h1>

        {error && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-yellow-800 text-sm">
              ⚠️ {error}（ローカルストレージのデータを表示しています）
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-8 text-center">
              <div className="text-8xl mb-4">🏆</div>
              <div className="text-white text-xl font-bold">{nft.name}</div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                レアリティ
              </h2>
              <div className="text-2xl font-bold text-gray-900">
                {nft.rarity}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                関連組織
              </h2>
              <div className="flex flex-wrap gap-2">
                {nft.organizations && nft.organizations.length > 0 ? (
                  nft.organizations.map((org, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {org}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">なし</span>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                トークン ID
              </h2>
              <div className="text-gray-900 font-mono">{nft.tokenId}</div>
            </div>

            {nft.contractAddress && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  コントラクトアドレス
                </h2>
                <div className="text-gray-900 font-mono text-sm break-all">
                  {nft.contractAddress}
                </div>
              </div>
            )}

            {nft.owner && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  所有者
                </h2>
                <div className="text-gray-900 font-mono text-sm break-all">
                  {nft.owner}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. ローカルストレージとブロックチェーンの同期

### 3.1 同期ユーティリティの作成

ブロックチェーンとローカルストレージを同期するユーティリティを作成します。

**ファイル**: `frontend/src/lib/sync.js`

```javascript
import { storage } from "./storage";

/**
 * ブロックチェーンとローカルストレージの同期ユーティリティ
 */
export const sync = {
  /**
   * スタンプを同期する
   * ブロックチェーンから取得したスタンプをローカルストレージに保存します。
   *
   * @param {Array} blockchainStamps - ブロックチェーンから取得したスタンプ配列
   * @returns {Array} 同期後のスタンプ配列
   */
  syncStamps: (blockchainStamps) => {
    try {
      // ブロックチェーンのスタンプをローカルストレージに保存
      if (blockchainStamps && blockchainStamps.length > 0) {
        storage.saveStamps(blockchainStamps);
        return blockchainStamps;
      }
      return [];
    } catch (err) {
      console.error("Error syncing stamps:", err);
      throw new Error("スタンプの同期に失敗しました");
    }
  },

  /**
   * NFT を同期する
   * ブロックチェーンから取得した NFT をローカルストレージに保存します。
   *
   * @param {Array} blockchainNFTs - ブロックチェーンから取得した NFT 配列
   * @returns {Array} 同期後の NFT 配列
   */
  syncNFTs: (blockchainNFTs) => {
    try {
      // ブロックチェーンの NFT をローカルストレージに保存
      if (blockchainNFTs && blockchainNFTs.length > 0) {
        storage.saveNFTs(blockchainNFTs);
        return blockchainNFTs;
      }
      return [];
    } catch (err) {
      console.error("Error syncing NFTs:", err);
      throw new Error("NFTの同期に失敗しました");
    }
  },

  /**
   * スタンプの差分を検出する
   * ブロックチェーンのスタンプとローカルストレージのスタンプを比較し、
   * 差分を返します。
   *
   * @param {Array} blockchainStamps - ブロックチェーンから取得したスタンプ配列
   * @param {Array} localStamps - ローカルストレージから取得したスタンプ配列
   * @returns {Object} 差分情報 { added: [], removed: [], updated: [] }
   */
  detectStampDiff: (blockchainStamps, localStamps) => {
    const added = [];
    const removed = [];
    const updated = [];

    // ブロックチェーンのスタンプを ID でマップ
    const blockchainMap = new Map();
    blockchainStamps.forEach((stamp) => {
      blockchainMap.set(stamp.id, stamp);
    });

    // ローカルストレージのスタンプを ID でマップ
    const localMap = new Map();
    localStamps.forEach((stamp) => {
      localMap.set(stamp.id, stamp);
    });

    // 追加されたスタンプを検出
    blockchainMap.forEach((stamp, id) => {
      if (!localMap.has(id)) {
        added.push(stamp);
      } else {
        // 更新されたスタンプを検出（簡易版：常に更新とみなす）
        updated.push(stamp);
      }
    });

    // 削除されたスタンプを検出（ブロックチェーンでは削除できないため、通常は空）
    localMap.forEach((stamp, id) => {
      if (!blockchainMap.has(id)) {
        removed.push(stamp);
      }
    });

    return { added, removed, updated };
  },

  /**
   * NFT の差分を検出する
   * ブロックチェーンの NFT とローカルストレージの NFT を比較し、
   * 差分を返します。
   *
   * @param {Array} blockchainNFTs - ブロックチェーンから取得した NFT 配列
   * @param {Array} localNFTs - ローカルストレージから取得した NFT 配列
   * @returns {Object} 差分情報 { added: [], removed: [], updated: [] }
   */
  detectNFTDiff: (blockchainNFTs, localNFTs) => {
    const added = [];
    const removed = [];
    const updated = [];

    // ブロックチェーンの NFT を ID でマップ
    const blockchainMap = new Map();
    blockchainNFTs.forEach((nft) => {
      blockchainMap.set(nft.id, nft);
    });

    // ローカルストレージの NFT を ID でマップ
    const localMap = new Map();
    localNFTs.forEach((nft) => {
      localMap.set(nft.id, nft);
    });

    // 追加された NFT を検出
    blockchainMap.forEach((nft, id) => {
      if (!localMap.has(id)) {
        added.push(nft);
      } else {
        // 更新された NFT を検出（簡易版：常に更新とみなす）
        updated.push(nft);
      }
    });

    // 削除された NFT を検出（ブロックチェーンでは削除できないため、通常は空）
    localMap.forEach((nft, id) => {
      if (!blockchainMap.has(id)) {
        removed.push(nft);
      }
    });

    return { added, removed, updated };
  },
};
```

### 3.2 同期フックの作成

同期機能を使用するカスタムフックを作成します。

**ファイル**: `frontend/src/hooks/useSync.js`

```javascript
import { useState, useCallback } from "react";
import { sync } from "../lib/sync";

/**
 * ブロックチェーンとローカルストレージの同期を管理するカスタムフック
 */
export function useSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  /**
   * スタンプを同期する
   */
  const syncStamps = useCallback(async (blockchainStamps) => {
    setSyncing(true);
    setSyncError(null);

    try {
      const syncedStamps = sync.syncStamps(blockchainStamps);
      return syncedStamps;
    } catch (error) {
      console.error("Error syncing stamps:", error);
      setSyncError(error.message);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, []);

  /**
   * NFT を同期する
   */
  const syncNFTs = useCallback(async (blockchainNFTs) => {
    setSyncing(true);
    setSyncError(null);

    try {
      const syncedNFTs = sync.syncNFTs(blockchainNFTs);
      return syncedNFTs;
    } catch (error) {
      console.error("Error syncing NFTs:", error);
      setSyncError(error.message);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, []);

  return {
    syncing,
    syncError,
    syncStamps,
    syncNFTs,
  };
}
```

---

## 4. エラーハンドリングの強化

### 4.1 エラーハンドリングユーティリティの拡張

`transactions.js` を拡張して、より詳細なエラーハンドリングを追加します。

**ファイル**: `frontend/src/lib/transactions.js`（既存ファイルに追加）

```javascript
// ... 既存のコード ...

/**
 * エラーメッセージを日本語に変換する
 *
 * @param {Error} error - エラーオブジェクト
 * @returns {string} 日本語のエラーメッセージ
 */
export function formatError(error) {
  if (!error) {
    return "不明なエラーが発生しました";
  }

  // エラーの理由がある場合
  if (error.reason) {
    return formatErrorReason(error.reason);
  }

  // エラーメッセージがある場合
  if (error.message) {
    return formatErrorMessage(error.message);
  }

  // エラーコードがある場合
  if (error.code) {
    return formatErrorCode(error.code);
  }

  return "不明なエラーが発生しました";
}

/**
 * エラーの理由を日本語に変換する
 */
function formatErrorReason(reason) {
  const reasonMap = {
    "user rejected": "トランザクションが拒否されました",
    "insufficient funds": "ガス代が不足しています",
    "nonce too low": "トランザクションの順序が正しくありません",
    "execution reverted": "トランザクションの実行が失敗しました",
  };

  for (const [key, value] of Object.entries(reasonMap)) {
    if (reason.toLowerCase().includes(key)) {
      return value;
    }
  }

  return reason;
}

/**
 * エラーメッセージを日本語に変換する
 */
function formatErrorMessage(message) {
  const messageMap = {
    "user rejected": "トランザクションが拒否されました",
    "insufficient funds": "ガス代が不足しています",
    nonce: "トランザクションの順序が正しくありません",
    network: "ネットワークエラーが発生しました",
    contract: "コントラクトエラーが発生しました",
  };

  const lowerMessage = message.toLowerCase();
  for (const [key, value] of Object.entries(messageMap)) {
    if (lowerMessage.includes(key)) {
      return value;
    }
  }

  return message;
}

/**
 * エラーコードを日本語に変換する
 */
function formatErrorCode(code) {
  const codeMap = {
    4001: "トランザクションが拒否されました",
    4100: "承認されていないアカウントです",
    4200: "サポートされていないメソッドです",
    4900: "接続されていないウォレットです",
    4901: "チェーンが接続されていません",
    "-32603": "内部エラーが発生しました",
    "-32602": "無効なパラメータです",
    "-32601": "メソッドが見つかりません",
    "-32600": "無効なリクエストです",
  };

  return codeMap[code] || `エラーコード: ${code}`;
}
```

---

## 5. ローディング状態の表示改善

### 5.1 ローディングコンポーネントの作成

統一されたローディングコンポーネントを作成します。

**ファイル**: `frontend/src/components/Loading.jsx`

```javascript
export default function Loading({ message = "読み込み中..." }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <div className="text-gray-600">{message}</div>
    </div>
  );
}
```

### 5.2 スケルトンローディングの追加

スケルトンローディングコンポーネントを作成します。

**ファイル**: `frontend/src/components/Skeleton.jsx`

```javascript
export default function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
```

---

## 6. トランザクション状態の可視化

### 6.1 トランザクション状態コンポーネントの作成

トランザクションの状態を表示するコンポーネントを作成します。

**ファイル**: `frontend/src/components/TransactionStatus.jsx`

```javascript
import { TRANSACTION_STATUS } from "../lib/transactions";

export default function TransactionStatus({ status, txHash, message }) {
  if (status === TRANSACTION_STATUS.IDLE) {
    return null;
  }

  const statusConfig = {
    [TRANSACTION_STATUS.PENDING]: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: "⏳",
      message: "トランザクションを送信しています...",
    },
    [TRANSACTION_STATUS.CONFIRMING]: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "⏳",
      message: "トランザクションの確認を待っています...",
    },
    [TRANSACTION_STATUS.SUCCESS]: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: "✅",
      message: message || "トランザクションが完了しました！",
    },
    [TRANSACTION_STATUS.ERROR]: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "❌",
      message: message || "トランザクションが失敗しました",
    },
  };

  const config = statusConfig[status] || statusConfig[TRANSACTION_STATUS.ERROR];

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4 mb-4`}>
      <div className="flex items-center space-x-2">
        <span className="text-xl">{config.icon}</span>
        <div className="flex-1">
          <div className={`${config.text} font-semibold`}>{config.message}</div>
          {txHash && (
            <div className="text-xs text-gray-600 mt-1 font-mono break-all">
              TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 7. 動作確認とテスト

### 7.1 NFT 一覧の確認

1. フロントエンドを起動：

   ```bash
   cd frontend
   npm run dev
   ```

2. ブラウザで `http://localhost:5173` を開く
3. ウォレットを接続
4. `/student/nfts` にアクセス
5. ブロックチェーンから NFT が読み込まれることを確認
6. ローカルストレージに保存されることを確認（開発者ツールで確認）

### 7.2 ダッシュボードの確認

1. `/student` にアクセス
2. スタンプ数と NFT 数がブロックチェーンから読み込まれることを確認
3. 統計情報が正しく表示されることを確認

### 7.3 同期機能の確認

1. スタンプを発行
2. ダッシュボードを再読み込み
3. 新しいスタンプが表示されることを確認
4. ローカルストレージに保存されていることを確認

### 7.4 エラーハンドリングの確認

1. ウォレットを切断
2. 各ページにアクセス
3. フォールバック（ローカルストレージ）が動作することを確認
4. エラーメッセージが適切に表示されることを確認

---

## 8. トラブルシューティング

### 8.1 NFT が読み込まれない

**問題**: NFT 一覧が空のまま表示される

**解決策**:

1. コントラクトが正しくデプロイされているか確認
2. ウォレットが接続されているか確認
3. ネットワークが正しいか確認（Anvil Local）
4. ブラウザのコンソールでエラーを確認

### 8.2 同期が動作しない

**問題**: ブロックチェーンのデータがローカルストレージに保存されない

**解決策**:

1. `sync.js` が正しく実装されているか確認
2. ローカルストレージの容量を確認
3. ブラウザの開発者ツールでエラーを確認

### 8.3 パフォーマンスの問題

**問題**: データの読み込みが遅い

**解決策**:

1. キャッシュ（ローカルストレージ）を活用
2. 必要に応じてページネーションを実装
3. 読み込み中の状態を適切に表示

---

## 9. まとめ

Day 6 では、以下の作業を完了しました：

1. ✅ 残りのページのブロックチェーン連携

   - NFT 一覧ページ（`MyNFTs.jsx`）
   - ユーザーダッシュボード（`Home.jsx`）
   - 企業ダッシュボード（`OrgDashboard.jsx`）
   - NFT 詳細ページ（`NFTDetail.jsx`）

2. ✅ ローカルストレージとブロックチェーンの同期

   - 同期ユーティリティの作成（`sync.js`）
   - 同期フックの作成（`useSync.js`）
   - 差分検出機能の実装

3. ✅ エラーハンドリングの強化

   - エラーメッセージの日本語化
   - フォールバック機能の実装

4. ✅ ローディング状態の表示改善

   - ローディングコンポーネントの作成
   - スケルトンローディングの追加

5. ✅ トランザクション状態の可視化
   - トランザクション状態コンポーネントの作成

**成果物**:

- ✅ すべての主要ページがブロックチェーン連携済み
- ✅ ローカルストレージとブロックチェーンの同期機能
- ✅ エラーハンドリングとフォールバック機能
- ✅ ローディング状態の改善
- ✅ トランザクション状態の可視化

次の Day 7 では、バックエンド API 実装を実施します。

---

## 10. 参考リンク

- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [React Hooks Documentation](https://react.dev/reference/react)
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
