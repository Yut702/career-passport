# Day 8: テストとアプリ完成度向上 - 詳細手順書

## 目次

1. [前提条件の確認](#1-前提条件の確認)
2. [テスト計画と実装](#2-テスト計画と実装)
3. [バグ修正と改善](#3-バグ修正と改善)
4. [完成度向上のための作業](#4-完成度向上のための作業)
5. [動作確認と検証](#5-動作確認と検証)
6. [トラブルシューティング](#6-トラブルシューティング)

---

## 1. 前提条件の確認

### 1.1 Day 7 の完了確認

Day 8 を開始する前に、Day 7 の作業が完了していることを確認します：

**確認項目**:

- ✅ バックエンド API 実装が完了している
- ✅ フロントエンドとバックエンドの統合が完了している
- ✅ DynamoDB Local が正常に動作している
- ✅ イベント応募、メッセージ、マッチング機能が実装されている

**確認コマンド**:

```bash
# バックエンドサーバーが起動しているか確認
cd backend
npm run dev

# フロントエンドが起動しているか確認
cd frontend
npm run dev

# DynamoDB Local が起動しているか確認
docker ps | grep dynamodb
```

### 1.2 環境の準備

**必要な環境**:

- Node.js 18 以上
- Docker Desktop（DynamoDB Local 用）
- MetaMask（ブラウザ拡張機能）
- Anvil（ローカルブロックチェーン）

**確認コマンド**:

```bash
node --version
docker --version
forge --version
```

---

## 2. テスト計画と実装

### 2.1 単体テスト

#### 2.1.1 フロントエンドコンポーネントのテスト

**テストフレームワークのセットアップ**:

```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
```

**テスト設定ファイルの作成**:

`frontend/vitest.config.js`:

```javascript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    globals: true,
  },
});
```

**テスト例: `frontend/src/pages/__tests__/StudentEventApply.test.jsx`**:

```javascript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import StudentEventApply from "../StudentEventApply";
import { eventAPI } from "../../lib/api";

vi.mock("../../lib/api");

describe("StudentEventApply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("応募フォームが表示される", () => {
    render(
      <BrowserRouter>
        <StudentEventApply />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText(/応募動機/i)).toBeInTheDocument();
  });

  it("応募が成功すると成功メッセージが表示される", async () => {
    eventAPI.apply.mockResolvedValue({
      ok: true,
      application: { applicationId: "test-id" },
    });

    render(
      <BrowserRouter>
        <StudentEventApply />
      </BrowserRouter>
    );

    // フォーム入力と送信のテスト
    // ...
  });
});
```

**実行コマンド**:

```bash
cd frontend
npm run test
```

#### 2.1.2 バックエンド API のテスト

**テストフレームワークのセットアップ**:

```bash
cd backend
npm install --save-dev jest supertest
```

**テスト設定ファイルの作成**:

`backend/jest.config.js`:

```javascript
export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/__tests__/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js"],
};
```

**テスト例: `backend/src/routes/__tests__/eventRoutes.test.js`**:

```javascript
import request from "supertest";
import express from "express";
import eventRoutes from "../eventRoutes.js";

const app = express();
app.use(express.json());
app.use("/api/events", eventRoutes);

describe("Event Routes", () => {
  it("POST /api/events/:eventId/apply - 応募を作成", async () => {
    const response = await request(app)
      .post("/api/events/event-123/apply")
      .send({
        walletAddress: "0x1111111111111111111111111111111111111111",
        applicationText: "応募動機です",
      });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.application).toHaveProperty("applicationId");
  });

  it("GET /api/events/applications - 応募一覧を取得", async () => {
    const response = await request(app).get(
      "/api/events/applications?walletAddress=0x1111111111111111111111111111111111111111"
    );

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(Array.isArray(response.body.applications)).toBe(true);
  });
});
```

**実行コマンド**:

```bash
cd backend
npm run test
```

#### 2.1.3 スマートコントラクトのテスト（既存テストの拡充）

**既存テストの確認**:

```bash
cd contracts
forge test
```

**テストの拡充例: `contracts/test/StampManager.t.sol`**:

```solidity
// 既存のテストに追加
function test_IssueMultipleStamps() public {
    // 複数のスタンプを発行するテスト
    stampManager.issueStamp(user1, "Stamp1", "Org1", "Category1");
    stampManager.issueStamp(user1, "Stamp2", "Org1", "Category2");
    stampManager.issueStamp(user1, "Stamp3", "Org1", "Category3");

    Stamp[] memory stamps = stampManager.getUserStamps(user1);
    assertEq(stamps.length, 3);
}

function test_CanMintNFT_AfterThreeStamps() public {
    // 3つのスタンプを発行
    stampManager.issueStamp(user1, "Stamp1", "Org1", "Category1");
    stampManager.issueStamp(user1, "Stamp2", "Org1", "Category2");
    stampManager.issueStamp(user1, "Stamp3", "Org1", "Category3");

    // NFT 発行可能か確認
    assertTrue(stampManager.canMintNFT(user1, "Org1"));
}
```

### 2.2 統合テスト

#### 2.2.1 フロントエンド ↔ バックエンドの連携テスト

**テストシナリオ**:

1. イベント応募の送信と確認
2. メッセージの送信と受信
3. マッチングの作成と取得

**テスト例: `frontend/src/__tests__/integration/eventApplication.test.js`**:

```javascript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eventAPI } from "../../lib/api";

describe("Event Application Integration", () => {
  const testWallet = "0x1111111111111111111111111111111111111111";
  const testEventId = "event-test-123";

  it("応募を作成して取得できる", async () => {
    // 応募を作成
    const createResponse = await eventAPI.apply(
      testEventId,
      testWallet,
      "テスト応募動機"
    );
    expect(createResponse.ok).toBe(true);

    // 応募一覧を取得
    const listResponse = await eventAPI.getMyApplications(testWallet);
    expect(listResponse.ok).toBe(true);
    expect(listResponse.applications.length).toBeGreaterThan(0);
  });
});
```

#### 2.2.2 フロントエンド ↔ ブロックチェーンの連携テスト

**テストシナリオ**:

1. ウォレット接続
2. スタンプ発行
3. NFT 取得

**テスト例: `frontend/src/__tests__/integration/blockchain.test.js`**:

```javascript
import { describe, it, expect } from "vitest";
import { ethers } from "ethers";
import { useContracts } from "../../hooks/useContracts";

describe("Blockchain Integration", () => {
  it("ウォレット接続が正常に動作する", async () => {
    // MetaMask のモックを使用
    // ...
  });

  it("スタンプ発行が正常に動作する", async () => {
    // スタンプ発行のテスト
    // ...
  });
});
```

#### 2.2.3 エンドツーエンド（E2E）テスト

**Playwright のセットアップ**:

```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

**E2E テスト例: `frontend/e2e/event-application.spec.js`**:

```javascript
import { test, expect } from "@playwright/test";

test("イベント応募のフロー", async ({ page }) => {
  // 1. ホームページにアクセス
  await page.goto("http://localhost:5173");

  // 2. ウォレット接続（モック）
  // ...

  // 3. イベント一覧ページに移動
  await page.click("text=イベント一覧");

  // 4. イベントを選択
  await page.click("text=応募する");

  // 5. 応募フォームに入力
  await page.fill('textarea[placeholder*="応募動機"]', "テスト応募動機");
  await page.click('button:has-text("応募する")');

  // 6. 成功メッセージが表示されることを確認
  await expect(page.locator("text=応募が完了しました")).toBeVisible();
});
```

**実行コマンド**:

```bash
cd frontend
npx playwright test
```

### 2.3 機能テスト

#### 2.3.1 イベント応募機能の動作確認

**チェックリスト**:

- [ ] イベント一覧が表示される
- [ ] イベント詳細が表示される
- [ ] 応募フォームが表示される
- [ ] 応募が正常に送信される
- [ ] 応募履歴が表示される
- [ ] 応募ステータスが更新される
- [ ] エラーハンドリングが適切に動作する

**手動テスト手順**:

1. フロントエンドを起動: `cd frontend && npm run dev`
2. バックエンドを起動: `cd backend && npm run dev`
3. ブラウザで `http://localhost:5173` を開く
4. MetaMask でウォレットを接続
5. イベント一覧ページに移動
6. イベントを選択して応募
7. 応募履歴を確認

#### 2.3.2 メッセージ機能の動作確認

**チェックリスト**:

- [ ] 会話一覧が表示される
- [ ] 新しい会話を開始できる
- [ ] メッセージを送信できる
- [ ] メッセージを受信できる
- [ ] 既読機能が動作する
- [ ] リアルタイム更新が動作する

**手動テスト手順**:

1. メッセージページに移動
2. 新しい会話を開始（企業アドレスを入力）
3. メッセージを送信
4. メッセージが表示されることを確認
5. 別のウォレットでメッセージを受信

#### 2.3.3 マッチング機能の動作確認

**チェックリスト**:

- [ ] マッチング一覧が表示される
- [ ] マッチングを作成できる
- [ ] マッチングステータスが更新される
- [ ] 学生と企業の両方でマッチングが表示される

#### 2.3.4 スタンプ発行・NFT 取得機能の動作確認

**チェックリスト**:

- [ ] スタンプ発行が正常に動作する
- [ ] スタンプ一覧が表示される
- [ ] NFT 交換条件が正しく判定される
- [ ] NFT 取得が正常に動作する
- [ ] NFT 一覧が表示される

---

## 3. バグ修正と改善

### 3.1 既知のバグの修正

#### 3.1.1 API 接続エラーの修正

**問題の特定**:

```bash
# ブラウザのコンソールでエラーを確認
# Network タブでリクエストを確認
```

**修正例: `frontend/src/lib/api.js`**:

```javascript
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // レスポンスが空の場合の処理
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || "Request failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // ネットワークエラーの詳細な処理
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("ネットワークエラー: サーバーに接続できません");
    }
    console.error("API request error:", error);
    throw error;
  }
}
```

#### 3.1.2 UI 表示の不具合修正

**問題の特定**:

- ローディング状態が適切に表示されない
- エラーメッセージが表示されない
- データが表示されない

**修正例: `frontend/src/pages/StudentEventApply.jsx`**:

```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [success, setSuccess] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setSuccess(false);

  try {
    await eventAPI.apply(eventId, account, applicationText);
    setSuccess(true);
    // フォームをリセット
    setApplicationText("");
    // 応募履歴を再取得
    await loadApplications();
  } catch (err) {
    setError(err.message || "応募に失敗しました");
  } finally {
    setLoading(false);
  }
};

// エラーと成功メッセージの表示
{
  error && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      {error}
    </div>
  );
}
{
  success && (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
      応募が完了しました
    </div>
  );
}
```

#### 3.1.3 データ同期の問題修正

**問題の特定**:

- ローカルストレージとブロックチェーンのデータが不一致
- DynamoDB とブロックチェーンのデータが不一致

**修正例: `frontend/src/hooks/useSync.js`**:

```javascript
export function useSync() {
  const syncData = async () => {
    try {
      // ブロックチェーンからデータを取得
      const blockchainData = await fetchFromBlockchain();

      // ローカルストレージからデータを取得
      const localData = getFromLocalStorage();

      // データを比較して同期
      if (JSON.stringify(blockchainData) !== JSON.stringify(localData)) {
        // ブロックチェーンのデータを優先
        saveToLocalStorage(blockchainData);
      }
    } catch (error) {
      console.error("Sync error:", error);
    }
  };

  // 定期的に同期
  useEffect(() => {
    const interval = setInterval(syncData, 30000); // 30秒ごと
    return () => clearInterval(interval);
  }, []);

  return { syncData };
}
```

#### 3.1.4 エラーハンドリングの改善

**統一的なエラーハンドリングの実装**:

`frontend/src/lib/errorHandler.js`:

```javascript
export class AppError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export function handleError(error) {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  // ネットワークエラー
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return {
      message: "ネットワークエラーが発生しました",
      code: "NETWORK_ERROR",
    };
  }

  // その他のエラー
  return {
    message: error.message || "予期しないエラーが発生しました",
    code: "UNKNOWN_ERROR",
  };
}
```

### 3.2 パフォーマンス改善

#### 3.2.1 ページ読み込み速度の最適化

**コード分割の実装**:

`frontend/src/router.jsx`:

```javascript
import { lazy, Suspense } from "react";

const StudentEventApply = lazy(() => import("./pages/StudentEventApply"));
const StudentMessages = lazy(() => import("./pages/StudentMessages"));

// 使用例
<Route
  path="/student/events/:id/apply"
  element={
    <Suspense fallback={<Loading />}>
      <StudentLayout>
        <StudentEventApply />
      </StudentLayout>
    </Suspense>
  }
/>;
```

**画像の最適化**:

- WebP 形式の使用
- 遅延読み込みの実装

#### 3.2.2 API レスポンス時間の改善

**キャッシュの実装**:

`frontend/src/lib/api.js`:

```javascript
const cache = new Map();

async function request(endpoint, options = {}, useCache = false) {
  const cacheKey = `${endpoint}_${JSON.stringify(options)}`;

  if (useCache && cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const data = await fetch(url, config).then((res) => res.json());

  if (useCache) {
    cache.set(cacheKey, data);
    // 5分後にキャッシュを削除
    setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
  }

  return data;
}
```

#### 3.2.3 ブロックチェーン読み込みの最適化

**バッチ読み込みの実装**:

`frontend/src/hooks/useContracts.js`:

```javascript
export function useContracts() {
  const loadStampsBatch = async (addresses) => {
    // 複数のアドレスのスタンプを一度に取得
    const promises = addresses.map((addr) => stampManager.getUserStamps(addr));
    return Promise.all(promises);
  };

  return { loadStampsBatch };
}
```

### 3.3 ユーザー体験の改善

#### 3.3.1 ローディング状態の表示改善

**スケルトンローディングの実装**:

`frontend/src/components/Skeleton.jsx`:

```javascript
export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}
```

#### 3.3.2 エラーメッセージの明確化

**ユーザーフレンドリーなエラーメッセージ**:

`frontend/src/lib/messages.js`:

```javascript
export const ERROR_MESSAGES = {
  NETWORK_ERROR:
    "ネットワークエラーが発生しました。インターネット接続を確認してください。",
  WALLET_NOT_CONNECTED:
    "ウォレットが接続されていません。MetaMask でウォレットを接続してください。",
  TRANSACTION_FAILED:
    "トランザクションが失敗しました。もう一度お試しください。",
  API_ERROR:
    "サーバーエラーが発生しました。しばらくしてから再度お試しください。",
};
```

#### 3.3.3 操作フローの最適化

**確認ダイアログの追加**:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!confirm("応募しますか？")) {
    return;
  }

  // 応募処理
};
```

#### 3.3.4 レスポンシブデザインの改善

**Tailwind CSS のレスポンシブクラスの使用**:

```javascript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* コンテンツ */}
</div>
```

### 3.4 コード品質の向上

#### 3.4.1 コードレビューとリファクタリング

**チェックリスト**:

- [ ] 重複コードの削除
- [ ] 関数の分割（単一責任の原則）
- [ ] 変数名の明確化
- [ ] コメントの追加

#### 3.4.2 エラーハンドリングの統一

**統一的なエラーハンドリングパターンの適用**:

```javascript
try {
  // 処理
} catch (error) {
  const handledError = handleError(error);
  console.error(handledError);
  // ユーザーに表示
}
```

#### 3.4.3 ログ出力の改善

**構造化ログの実装**:

`backend/src/utils/logger.js`:

```javascript
export const logger = {
  info: (message, data = {}) => {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        timestamp: new Date().toISOString(),
        ...data,
      })
    );
  },
  error: (message, error = {}) => {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
      })
    );
  },
};
```

#### 3.4.4 ドキュメントの整備

**JSDoc コメントの追加**:

```javascript
/**
 * イベントに応募する
 *
 * @param {string} eventId - イベントID
 * @param {string} walletAddress - ウォレットアドレス
 * @param {string} applicationText - 応募動機
 * @returns {Promise<Object>} 応募情報
 * @throws {Error} 応募に失敗した場合
 */
export async function apply(eventId, walletAddress, applicationText) {
  // 実装
}
```

---

## 4. 完成度向上のための作業

### 4.1 エラーハンドリングの強化

#### 4.1.1 ネットワークエラーの適切な処理

**リトライ機能の実装**:

`frontend/src/lib/api.js`:

```javascript
async function requestWithRetry(endpoint, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request(endpoint, options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

#### 4.1.2 トランザクション失敗時の処理

**トランザクション状態の詳細な管理**:

`frontend/src/lib/transactions.js`:

```javascript
export const transactionStates = {
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
  REJECTED: "rejected",
};

export function handleTransactionError(error) {
  if (error.code === 4001) {
    return "トランザクションが拒否されました";
  }
  if (error.code === -32603) {
    return "トランザクションが失敗しました";
  }
  return "予期しないエラーが発生しました";
}
```

#### 4.1.3 バックエンドエラーの適切な表示

**エラーレスポンスの統一**:

`backend/src/routes/eventRoutes.js`:

```javascript
router.post("/:eventId/apply", async (req, res) => {
  try {
    // 処理
  } catch (error) {
    console.error("Event application error:", error);
    res.status(500).json({
      ok: false,
      error: "応募処理中にエラーが発生しました",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
```

### 4.2 データ整合性の確保

#### 4.2.1 ローカルストレージとブロックチェーンの同期確認

**同期チェック機能の実装**:

`frontend/src/lib/sync.js`:

```javascript
export async function verifySync() {
  const blockchainData = await fetchFromBlockchain();
  const localData = getFromLocalStorage();

  const differences = findDifferences(blockchainData, localData);

  if (differences.length > 0) {
    console.warn("データの不整合を検出:", differences);
    // ブロックチェーンのデータを優先
    return syncToBlockchain(blockchainData);
  }

  return true;
}
```

#### 4.2.2 DynamoDB とブロックチェーンの整合性確認

**整合性チェック機能の実装**:

`backend/src/lib/consistency.js`:

```javascript
export async function checkConsistency(walletAddress) {
  // DynamoDB からデータを取得
  const dynamoData = await getFromDynamoDB(walletAddress);

  // ブロックチェーンからデータを取得
  const blockchainData = await getFromBlockchain(walletAddress);

  // 整合性をチェック
  return {
    isConsistent: compareData(dynamoData, blockchainData),
    differences: findDifferences(dynamoData, blockchainData),
  };
}
```

#### 4.2.3 データの不整合を防ぐバリデーション

**入力値のバリデーション**:

`frontend/src/lib/validation.js`:

```javascript
export function validateWalletAddress(address) {
  if (!address) {
    throw new Error("ウォレットアドレスが入力されていません");
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("無効なウォレットアドレスです");
  }
  return true;
}

export function validateApplicationText(text) {
  if (!text || text.trim().length === 0) {
    throw new Error("応募動機を入力してください");
  }
  if (text.length > 1000) {
    throw new Error("応募動機は1000文字以内で入力してください");
  }
  return true;
}
```

### 4.3 セキュリティの強化

#### 4.3.1 入力値のバリデーション

**サーバーサイドバリデーション**:

`backend/src/routes/eventRoutes.js`:

```javascript
router.post("/:eventId/apply", async (req, res) => {
  const { walletAddress, applicationText } = req.body;

  // バリデーション
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return res
      .status(400)
      .json({ ok: false, error: "無効なウォレットアドレスです" });
  }

  if (!applicationText || applicationText.trim().length === 0) {
    return res
      .status(400)
      .json({ ok: false, error: "応募動機を入力してください" });
  }

  if (applicationText.length > 1000) {
    return res
      .status(400)
      .json({ ok: false, error: "応募動機は1000文字以内で入力してください" });
  }

  // 処理
});
```

#### 4.3.2 XSS 対策

**React の自動エスケープを活用**:

```javascript
// 危険: innerHTML の使用を避ける
// <div dangerouslySetInnerHTML={{ __html: userInput }} />

// 安全: React の自動エスケープを使用
<div>{userInput}</div>
```

#### 4.3.3 不正なリクエストの防止

**レート制限の実装**:

`backend/src/middleware/rateLimit.js`:

```javascript
const rateLimitMap = new Map();

export function rateLimit(maxRequests = 10, windowMs = 60000) {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = rateLimitMap.get(key);

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    if (record.count >= maxRequests) {
      return res
        .status(429)
        .json({ ok: false, error: "リクエストが多すぎます" });
    }

    record.count++;
    next();
  };
}
```

### 4.4 ドキュメントの整備

#### 4.4.1 API 仕様書の作成

**API 仕様書のテンプレート**:

`backend/API_SPEC.md`:

````markdown
# API 仕様書

## イベント応募 API

### POST /api/events/:eventId/apply

イベントに応募します。

**リクエスト**:

- `walletAddress` (string, required): ウォレットアドレス
- `applicationText` (string, required): 応募動機

**レスポンス**:

```json
{
  "ok": true,
  "application": {
    "applicationId": "uuid",
    "eventId": "event-123",
    "walletAddress": "0x...",
    "applicationText": "応募動機",
    "appliedAt": "2025-12-11T...",
    "status": "pending"
  }
}
```
````

**エラー**:

- 400: バリデーションエラー
- 500: サーバーエラー

````

#### 4.4.2 トラブルシューティングガイドの拡充

**よくある問題と解決方法**:

`TROUBLESHOOTING.md`:

```markdown
# トラブルシューティングガイド

## よくある問題

### 1. ウォレットが接続できない

**原因**: MetaMask がインストールされていない、またはネットワーク設定が間違っている

**解決方法**:
1. MetaMask がインストールされているか確認
2. ローカルネットワーク（Anvil）が追加されているか確認
3. Chain ID が 31337 であることを確認

### 2. API に接続できない

**原因**: バックエンドサーバーが起動していない

**解決方法**:
1. `cd backend && npm run dev` でサーバーを起動
2. `http://localhost:3000` にアクセスできるか確認
````

#### 4.4.3 開発者向けドキュメントの整備

**開発ガイドの作成**:

`DEVELOPMENT.md`:

````markdown
# 開発ガイド

## 開発環境のセットアップ

1. リポジトリをクローン
2. 依存関係をインストール
3. 環境変数を設定
4. サービスを起動

## コーディング規約

- ESLint のルールに従う
- Prettier でフォーマット
- コミットメッセージは明確に

## テストの実行

```bash
# フロントエンド
cd frontend && npm run test

# バックエンド
cd backend && npm run test

# コントラクト
cd contracts && forge test
```
````

````

---

## 5. 動作確認と検証

### 5.1 全体動作確認チェックリスト

**機能別チェックリスト**:

- [ ] ウォレット接続が正常に動作する
- [ ] スタンプ発行が正常に動作する
- [ ] NFT 取得が正常に動作する
- [ ] イベント応募が正常に動作する
- [ ] メッセージ送受信が正常に動作する
- [ ] マッチング機能が正常に動作する
- [ ] エラーハンドリングが適切に動作する
- [ ] ローディング状態が適切に表示される

### 5.2 パフォーマンステスト

**パフォーマンス指標**:

- ページ読み込み時間: 3秒以内
- API レスポンス時間: 500ms 以内
- ブロックチェーン読み込み時間: 2秒以内

**測定方法**:

```javascript
// パフォーマンス測定
const startTime = performance.now();
await loadData();
const endTime = performance.now();
console.log(`Load time: ${endTime - startTime}ms`);
````

### 5.3 セキュリティテスト

**セキュリティチェックリスト**:

- [ ] 入力値のバリデーションが実装されている
- [ ] XSS 対策が実装されている
- [ ] レート制限が実装されている
- [ ] エラーメッセージに機密情報が含まれていない

---

## 6. トラブルシューティング

### 6.1 テストが実行できない

**問題**: テストフレームワークがインストールされていない

**解決方法**:

```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### 6.2 統合テストが失敗する

**問題**: バックエンドサーバーが起動していない

**解決方法**:

```bash
# バックエンドサーバーを起動
cd backend
npm run dev

# 別のターミナルでテストを実行
cd frontend
npm run test
```

### 6.3 E2E テストが失敗する

**問題**: ブラウザドライバーがインストールされていない

**解決方法**:

```bash
npx playwright install
```

### 6.4 パフォーマンスが悪い

**問題**: キャッシュが実装されていない、または最適化が不十分

**解決方法**:

1. コード分割を実装
2. 画像の最適化
3. API レスポンスのキャッシュ

---

## まとめ

Day 8 では、以下の作業を実施します：

1. **テストの実装**: 単体テスト、統合テスト、E2E テスト
2. **バグ修正**: 既知のバグの修正と改善
3. **パフォーマンス改善**: 読み込み速度とレスポンス時間の最適化
4. **UX 改善**: ローディング状態、エラーメッセージ、操作フローの改善
5. **コード品質向上**: リファクタリング、エラーハンドリングの統一
6. **完成度向上**: エラーハンドリング強化、データ整合性確保、セキュリティ強化、ドキュメント整備

これらの作業により、アプリケーションの完成度を大幅に向上させることができます。

---

**最終更新**: 2025 年 12 月 11 日（Day 8 完了）
