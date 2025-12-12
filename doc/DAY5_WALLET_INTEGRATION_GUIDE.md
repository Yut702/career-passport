# Day 5: MetaMask 連携とブロックチェーン統合 - 詳細手順書

## 目次

1. [前提条件の確認](#1-前提条件の確認)
2. [MetaMask のセットアップ](#2-metamask-のセットアップ)
3. [Ethers.js のインストールとセットアップ](#3-ethersjs-のインストールとセットアップ)
4. [ウォレット接続機能の実装](#4-ウォレット接続機能の実装)
5. [ネットワーク設定の実装](#5-ネットワーク設定の実装)
6. [コントラクトインスタンスの作成](#6-コントラクトインスタンスの作成)
7. [トランザクション送信の基本実装](#7-トランザクション送信の基本実装)
8. [動作確認とテスト](#8-動作確認とテスト)

---

## 1. 前提条件の確認

### 1.1 必要な環境の確認

Day 5 を開始する前に、以下の環境が整っていることを確認します：

**コントラクト側**:

- ✅ Anvil が起動している
- ✅ コントラクトがデプロイされている
- ✅ `deployed.json` にコントラクトアドレスが記録されている
- ✅ `frontend/.env.local` が生成されている

**確認コマンド**:

```bash
# コントラクトがデプロイされているか確認
cd contracts
cat deployed.json | jq .

# フロントエンドの環境変数が設定されているか確認
cd ../frontend
cat .env.local
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

```env
VITE_NFT_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_STAMP_MANAGER_ADDRESS=0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
VITE_RPC_URL=http://localhost:8545
VITE_CHAIN_ID=31337
```

### 1.2 ABI ファイルの確認

フロントエンドに ABI ファイルが存在することを確認します：

```bash
cd frontend
ls -la src/abis/
```

**期待されるファイル**:

- `CareerPassportNFT.json`
- `StampManager.json`

### 1.3 Anvil の起動確認

Anvil が起動していることを確認します：

**方法 1: JSON-RPC リクエストで確認（推奨）**

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

`0x7a69` は 10 進数で `31337` です。これが返ってくれば、Anvil が正常に起動しています。

**方法 2: ポートが使用されているか確認**

```bash
# ポート 8545 が使用されているか確認
lsof -i :8545
# または
netstat -an | grep 8545
```

**方法 3: 簡単な HTTP リクエスト（参考）**

```bash
# 注意: この方法では "Connection header did not include 'upgrade'" というメッセージが表示されますが、
# これは正常です（Anvil は WebSocket 接続を期待しているため）
curl http://localhost:8545
```

**Anvil が起動していない場合**:

別のターミナルで Anvil を起動します：

```bash
cd contracts
anvil
```

**Anvil の出力例**:

```
Available Accounts
==================

(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
...

Listening on:      127.0.0.1:8545
```

---

## 2. MetaMask のセットアップ

### 2.1 MetaMask のインストール

MetaMask がインストールされていない場合は、ブラウザ拡張機能としてインストールします：

1. [MetaMask 公式サイト](https://metamask.io/) にアクセス
2. 「ダウンロード」をクリック
3. ブラウザ拡張機能をインストール
4. ウォレットを作成またはインポート

### 2.2 ローカルネットワークの追加

MetaMask にローカルネットワーク（Anvil）を追加します：

**手順**:

1. MetaMask を開く
2. ネットワーク選択ドロップダウンをクリック
3. 「ネットワークを追加」を選択
4. 「ネットワークを手動で追加」を選択
5. 以下の情報を入力：

   - **ネットワーク名**: `Anvil Local`
   - **新しい RPC URL**: `http://localhost:8545`
   - **チェーン ID**: `31337`
   - **通貨記号**: `ETH`
   - **ブロックエクスプローラーの URL**: （空白で OK）

6. 「保存」をクリック

### 2.3 テストアカウントのインポート（オプション）

Anvil のテストアカウントを MetaMask にインポートして、テスト ETH を使用できます：

**手順**:

1. Anvil を起動したターミナルで、プライベートキーを確認
2. MetaMask を開く
3. アカウントアイコンをクリック
4. 「アカウントのインポート」を選択
5. 「秘密鍵」を選択
6. Anvil のプライベートキーを貼り付け（例: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`）
7. 「インポート」をクリック

**注意**: テストアカウントのプライベートキーは**本番環境では絶対に使用しないでください**。

### 2.4 ネットワーク接続の確認

MetaMask で「Anvil Local」ネットワークに接続されていることを確認します：

- ネットワーク選択ドロップダウンに「Anvil Local」が表示される
- アカウントに ETH が表示される（Anvil のテストアカウントを使用している場合）

---

## 3. Ethers.js のインストールとセットアップ

### 3.1 Ethers.js のインストール

フロントエンドプロジェクトに Ethers.js をインストールします：

```bash
cd frontend
npm install ethers@^6.0.0
```

**確認**:

```bash
# package.json に ethers が追加されているか確認
cat package.json | grep ethers
```

### 3.2 Ethers.js のバージョン確認

```bash
npm list ethers
```

**期待される出力**:

```
ethers@6.x.x
```

**注意**: Ethers.js v6 を使用します。v5 とは API が異なるため、v6 を使用してください。

---

## 4. ウォレット接続機能の実装

### 4.1 ウォレット接続フックの作成

`frontend/src/hooks/useWallet.js` を作成します：

```javascript
import { useState, useEffect } from "react";
import { ethers } from "ethers";

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);

  // 既存の接続を確認
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      checkConnection();
    }
  }, []);

  const checkConnection = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();

        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0].address);
        setChainId(Number(network.chainId));
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setError("MetaMask がインストールされていません");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // MetaMask に接続をリクエスト
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setChainId(Number(network.chainId));
    } catch (error) {
      console.error("Error connecting wallet:", error);

      let errorMessage = "ウォレット接続に失敗しました";
      if (error.code === 4001) {
        errorMessage = "接続が拒否されました";
      } else if (error.code === -32002) {
        errorMessage = "既に接続リクエストが処理中です";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setError(null);
  };

  // ネットワーク変更の監視
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const handleChainChanged = (chainId) => {
        setChainId(Number(chainId));
        // ネットワークが変更されたら、接続を再確認
        checkConnection();
      };

      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          checkConnection();
        }
      };

      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }
  }, []);

  return {
    account,
    provider,
    signer,
    isConnecting,
    chainId,
    error,
    connectWallet,
    disconnectWallet,
    isConnected: !!account,
  };
}
```

### 4.2 WalletConnect コンポーネントの更新

既存の `WalletConnect.jsx` を更新して、新しいフックを使用します：

```javascript
import { useWallet } from "../hooks/useWallet";

export default function WalletConnect() {
  const { account, isConnecting, error, connectWallet, disconnectWallet } =
    useWallet();

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (account) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">{formatAddress(account)}</span>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <button
          onClick={disconnectWallet}
          className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          切断
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isConnecting ? "接続中..." : "ウォレット接続"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

### 4.3 hooks ディレクトリの作成

`hooks` ディレクトリが存在しない場合は作成します：

```bash
cd frontend/src
mkdir -p hooks
```

---

## 5. ネットワーク設定の実装

### 5.1 ネットワーク設定の確認と追加

MetaMask に正しいネットワークが設定されているか確認し、必要に応じて自動的に追加する機能を実装します。

`frontend/src/lib/network.js` を作成します：

```javascript
import { ethers } from "ethers";

const ANVIL_NETWORK = {
  chainId: "0x7A69", // 31337 in hex
  chainName: "Anvil Local",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["http://localhost:8545"],
  blockExplorerUrls: [],
};

export async function switchToAnvilNetwork() {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask がインストールされていません");
  }

  try {
    // 現在のネットワークを取得
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const currentChainId = Number(network.chainId);

    // 既に正しいネットワークに接続されている場合
    if (currentChainId === 31337) {
      return;
    }

    // ネットワークを切り替えまたは追加
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ANVIL_NETWORK.chainId }],
      });
    } catch (switchError) {
      // ネットワークが存在しない場合は追加
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [ANVIL_NETWORK],
        });
      } else {
        throw switchError;
      }
    }
  } catch (error) {
    console.error("Error switching network:", error);
    throw error;
  }
}

export function getExpectedChainId() {
  return import.meta.env.VITE_CHAIN_ID || "31337";
}

export function isCorrectNetwork(chainId) {
  return Number(chainId) === Number(getExpectedChainId());
}
```

### 5.2 ネットワークチェック機能の追加

`useWallet` フックにネットワークチェック機能を追加します：

```javascript
// useWallet.js に追加
import { switchToAnvilNetwork, isCorrectNetwork } from "../lib/network";

// useWallet フック内に追加
const checkAndSwitchNetwork = async () => {
  if (!isCorrectNetwork(chainId)) {
    try {
      await switchToAnvilNetwork();
      // ネットワーク切り替え後、接続を再確認
      await checkConnection();
    } catch (error) {
      setError("ネットワークの切り替えに失敗しました: " + error.message);
    }
  }
};

// connectWallet 関数内で、接続後にネットワークチェックを実行
const connectWallet = async () => {
  // ... 既存のコード ...

  // 接続後にネットワークをチェック
  if (!isCorrectNetwork(Number(network.chainId))) {
    await switchToAnvilNetwork();
    // ネットワーク切り替え後、再度接続を確認
    await checkConnection();
  }
};
```

---

## 6. コントラクトインスタンスの作成

### 6.1 コントラクトフックの作成

コントラクトインスタンスを作成し、管理するフックを作成します。

`frontend/src/hooks/useContracts.js` を作成します：

```javascript
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "./useWallet";
import CareerPassportNFTABI from "../abis/CareerPassportNFT.json";
import StampManagerABI from "../abis/StampManager.json";

export function useContracts() {
  const { provider, signer, isConnected } = useWallet();
  const [nftContract, setNftContract] = useState(null);
  const [stampManagerContract, setStampManagerContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected && signer) {
      loadContracts();
    } else {
      setNftContract(null);
      setStampManagerContract(null);
    }
  }, [isConnected, signer]);

  const loadContracts = async () => {
    if (!signer) return;

    setIsLoading(true);
    try {
      const nftAddress = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
      const stampManagerAddress = import.meta.env.VITE_STAMP_MANAGER_ADDRESS;

      if (!nftAddress || !stampManagerAddress) {
        throw new Error("コントラクトアドレスが設定されていません");
      }

      // コントラクトインスタンスを作成
      const nft = new ethers.Contract(nftAddress, CareerPassportNFTABI, signer);

      const stampManager = new ethers.Contract(
        stampManagerAddress,
        StampManagerABI,
        signer
      );

      setNftContract(nft);
      setStampManagerContract(stampManager);
    } catch (error) {
      console.error("Error loading contracts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    nftContract,
    stampManagerContract,
    isLoading,
    isReady: !!nftContract && !!stampManagerContract,
  };
}
```

### 6.2 コントラクトアドレスの確認

環境変数が正しく設定されているか確認します：

```bash
cd frontend
cat .env.local
```

**期待される内容**:

```env
VITE_NFT_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_STAMP_MANAGER_ADDRESS=0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
VITE_RPC_URL=http://localhost:8545
VITE_CHAIN_ID=31337
```

**注意**: 環境変数が設定されていない場合は、Day 4 の手順に従って `generate-env.sh` を実行してください。

---

## 7. トランザクション送信の基本実装

### 7.1 スタンプ発行機能の実装

スタンプ発行機能を実装します。企業向けページ（`OrgStampIssuance.jsx`）を更新します：

```javascript
import { useState } from "react";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";

export default function OrgStampIssuance() {
  const { stampManagerContract, isReady } = useContracts();
  const { account, isConnected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    userAddress: "",
    stampName: "",
    organization: "",
    category: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isConnected) {
      setError("ウォレットが接続されていません");
      return;
    }

    if (!isReady || !stampManagerContract) {
      setError("コントラクトが読み込まれていません");
      return;
    }

    setIsLoading(true);

    try {
      // トランザクションを送信
      const tx = await stampManagerContract.issueStamp(
        formData.userAddress,
        formData.stampName,
        formData.organization,
        formData.category
      );

      // トランザクションの確認を待つ
      await tx.wait();

      setSuccess(true);
      setFormData({
        userAddress: "",
        stampName: "",
        organization: "",
        category: "",
      });
    } catch (error) {
      console.error("Error issuing stamp:", error);

      let errorMessage = "スタンプ発行に失敗しました";
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6">
        <p className="text-red-600">ウォレットを接続してください</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">スタンプ発行</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            ユーザーアドレス
          </label>
          <input
            type="text"
            value={formData.userAddress}
            onChange={(e) =>
              setFormData({ ...formData, userAddress: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-md"
            placeholder="0x..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">スタンプ名</label>
          <input
            type="text"
            value={formData.stampName}
            onChange={(e) =>
              setFormData({ ...formData, stampName: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">組織名</label>
          <input
            type="text"
            value={formData.organization}
            onChange={(e) =>
              setFormData({ ...formData, organization: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">カテゴリ</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-md"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
        )}

        {success && (
          <div className="p-3 bg-green-100 text-green-700 rounded-md">
            スタンプが正常に発行されました！
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !isReady}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "処理中..." : "スタンプを発行"}
        </button>
      </form>
    </div>
  );
}
```

### 7.2 NFT 発行機能の実装

NFT 発行機能を実装します。ユーザー向けページ（`MyPage.jsx` など）に追加します：

```javascript
import { useState, useEffect } from "react";
import { useContracts } from "../hooks/useContracts";
import { useWallet } from "../hooks/useWallet";

export default function MyPage() {
  const { nftContract, stampManagerContract, isReady } = useContracts();
  const { account, isConnected } = useWallet();
  const [stamps, setStamps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [canMint, setCanMint] = useState(false);
  const [minting, setMinting] = useState(false);

  useEffect(() => {
    if (isConnected && isReady && account) {
      loadStamps();
      checkCanMint();
    }
  }, [isConnected, isReady, account]);

  const loadStamps = async () => {
    if (!stampManagerContract || !account) return;

    try {
      const userStamps = await stampManagerContract.getUserStamps(account);
      setStamps(userStamps);
    } catch (error) {
      console.error("Error loading stamps:", error);
    }
  };

  const checkCanMint = async () => {
    if (!stampManagerContract || !account) return;

    try {
      // 例: 東京大学から3つ以上のスタンプがあるか確認
      const canMintNft = await stampManagerContract.canMintNft(
        account,
        "東京大学"
      );
      setCanMint(canMintNft);
    } catch (error) {
      console.error("Error checking can mint:", error);
    }
  };

  const handleMintNFT = async () => {
    if (!nftContract || !account) return;

    setMinting(true);
    setError(null);

    try {
      // NFT を発行
      const tx = await nftContract.mint(
        account,
        "https://example.com/metadata.json",
        "優秀な成績証明書",
        "Rare",
        ["東京大学"]
      );

      await tx.wait();

      alert("NFT が正常に発行されました！");
      // スタンプ情報を再読み込み
      await loadStamps();
    } catch (error) {
      console.error("Error minting NFT:", error);

      let errorMessage = "NFT 発行に失敗しました";
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setMinting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6">
        <p className="text-red-600">ウォレットを接続してください</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">マイページ</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">スタンプコレクション</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stamps.map((stamp, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <h3 className="font-semibold">{stamp.name}</h3>
              <p className="text-sm text-gray-600">{stamp.organization}</p>
              <p className="text-sm text-gray-500">{stamp.category}</p>
            </div>
          ))}
        </div>
      </div>

      {canMint && (
        <div className="mb-6 p-4 bg-green-100 rounded-lg">
          <p className="mb-2">NFT 証明書を発行できます！</p>
          <button
            onClick={handleMintNFT}
            disabled={minting || !isReady}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {minting ? "発行中..." : "NFT を発行"}
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}
    </div>
  );
}
```

### 7.3 トランザクション状態の管理

トランザクションの状態（送信済み、確認待ち、完了など）を管理するユーティリティを作成します：

`frontend/src/lib/transactions.js` を作成します：

```javascript
export const TRANSACTION_STATUS = {
  IDLE: "idle",
  PENDING: "pending",
  CONFIRMING: "confirming",
  SUCCESS: "success",
  ERROR: "error",
};

export async function waitForTransaction(provider, txHash) {
  try {
    const receipt = await provider.waitForTransaction(txHash);
    return {
      success: receipt.status === 1,
      receipt,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}

export function formatTransactionError(error) {
  if (error.reason) {
    return error.reason;
  }

  if (error.message) {
    // よくあるエラーメッセージを日本語に変換
    if (error.message.includes("user rejected")) {
      return "トランザクションが拒否されました";
    }
    if (error.message.includes("insufficient funds")) {
      return "ガス代が不足しています";
    }
    if (error.message.includes("nonce")) {
      return "トランザクションの順序が正しくありません";
    }
    return error.message;
  }

  return "不明なエラーが発生しました";
}
```

---

## 8. 動作確認とテスト

### 8.1 ウォレット接続の確認

1. フロントエンドを起動：

   ```bash
   cd frontend
   npm run dev
   ```

2. ブラウザで `http://localhost:5173` を開く
3. 「ウォレット接続」ボタンをクリック
4. MetaMask の接続確認ダイアログが表示されることを確認
5. 接続後、ウォレットアドレスが表示されることを確認

### 8.2 ネットワーク切り替えの確認

1. MetaMask で別のネットワーク（例: Ethereum Mainnet）に切り替える
2. アプリケーションでネットワークが自動的に「Anvil Local」に切り替わることを確認
3. または、ネットワーク切り替えのプロンプトが表示されることを確認

### 8.3 スタンプ発行のテスト

1. 企業向けページ（`/org/stamp-issuance`）にアクセス
2. フォームに以下を入力：
   - ユーザーアドレス: MetaMask の接続済みアカウントのアドレス（または別のテストアカウント）
   - スタンプ名: `優秀な成績`
   - 組織名: `東京大学`
   - カテゴリ: `学業`
3. 「スタンプを発行」ボタンをクリック
4. MetaMask でトランザクションを承認
5. トランザクションが完了するまで待つ
6. 成功メッセージが表示されることを確認

### 8.4 NFT 発行のテスト

1. ユーザー向けページ（`/student/mypage`）にアクセス
2. スタンプが 3 つ以上あることを確認（スタンプ発行テストで発行したスタンプ）
3. 「NFT を発行」ボタンが表示されることを確認
4. 「NFT を発行」ボタンをクリック
5. MetaMask でトランザクションを承認
6. トランザクションが完了するまで待つ
7. 成功メッセージが表示されることを確認

### 8.5 エラーハンドリングの確認

1. **ウォレット未接続時のエラー**:

   - ウォレットを切断
   - スタンプ発行ページにアクセス
   - エラーメッセージが表示されることを確認

2. **ネットワークエラー**:

   - MetaMask で別のネットワークに切り替える
   - ネットワーク切り替えのプロンプトが表示されることを確認

3. **トランザクション拒否**:
   - スタンプ発行を試みる
   - MetaMask でトランザクションを拒否
   - 適切なエラーメッセージが表示されることを確認

### 8.6 コントラクト呼び出しの確認

ブラウザの開発者ツール（F12）でコンソールを開き、エラーが表示されないことを確認します。

**確認ポイント**:

- ✅ ウォレット接続が正常に動作する
- ✅ ネットワーク切り替えが正常に動作する
- ✅ スタンプ発行が正常に動作する
- ✅ NFT 発行が正常に動作する
- ✅ エラーハンドリングが適切に動作する
- ✅ トランザクションの状態が適切に表示される

---

## 9. まとめ

Day 5 では、以下の作業を完了しました：

1. ✅ MetaMask のセットアップ
2. ✅ Ethers.js のインストールとセットアップ
3. ✅ ウォレット接続機能の実装
4. ✅ ネットワーク設定の実装
5. ✅ コントラクトインスタンスの作成
6. ✅ トランザクション送信の基本実装
7. ✅ 動作確認とテスト

**成果物**:

- ✅ `useWallet` フック（ウォレット接続管理）
- ✅ `useContracts` フック（コントラクトインスタンス管理）
- ✅ ネットワーク設定ユーティリティ
- ✅ スタンプ発行機能（ブロックチェーン連携）
- ✅ NFT 発行機能（ブロックチェーン連携）
- ✅ エラーハンドリング機能

次の Day 6 では、UI とブロックチェーンの統合を完成させ、すべての機能をブロックチェーン経由で動作させます。

---

## 10. トラブルシューティング

### 10.1 MetaMask が接続できない

**問題**: 「MetaMask がインストールされていません」というエラーが表示される

**解決策**:

1. MetaMask がインストールされているか確認
2. ブラウザを再起動
3. MetaMask 拡張機能が有効になっているか確認

### 10.2 ネットワークが切り替わらない

**問題**: ネットワークの自動切り替えが動作しない

**解決策**:

1. MetaMask で手動で「Anvil Local」ネットワークに切り替える
2. `network.js` の `ANVIL_NETWORK` 設定を確認
3. Chain ID が正しいか確認（31337）

### 10.3 コントラクトが読み込まれない

**問題**: 「コントラクトが読み込まれていません」というエラーが表示される

**解決策**:

1. 環境変数が正しく設定されているか確認：

   ```bash
   cd frontend
   cat .env.local
   ```

2. ABI ファイルが存在するか確認：

   ```bash
   ls -la src/abis/
   ```

3. コントラクトアドレスが正しいか確認：

   ```bash
   cd ../contracts
   cat deployed.json | jq .
   ```

### 10.4 トランザクションが失敗する

**問題**: トランザクションが失敗する

**解決策**:

1. **権限エラー**: コントラクトの所有者か確認

   - `StampManager` と `CareerPassportNFT` は `onlyOwner` 修飾子があるため、所有者のみ実行可能
   - Anvil の最初のアカウント（`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`）が所有者

2. **ガス不足**: Anvil では通常問題ないが、確認
3. **ネットワークエラー**: Anvil が起動しているか確認
4. **エラーメッセージの確認**: ブラウザのコンソールでエラーメッセージを確認

### 10.5 Ethers.js のバージョンエラー

**問題**: `ethers.BrowserProvider is not a function` などのエラーが発生する

**解決策**:

1. Ethers.js v6 がインストールされているか確認：

   ```bash
   npm list ethers
   ```

2. v5 がインストールされている場合は、v6 にアップグレード：

   ```bash
   npm uninstall ethers
   npm install ethers@^6.0.0
   ```

### 10.6 環境変数が読み込まれない

**問題**: `import.meta.env.VITE_*` が `undefined` になる

**解決策**:

1. 環境変数ファイルが正しい場所にあるか確認：

   ```bash
   ls -la frontend/.env.local
   ```

2. 環境変数名が `VITE_` で始まっているか確認
3. フロントエンドを再起動：

   ```bash
   # 開発サーバーを停止（Ctrl+C）
   npm run dev
   ```

---

## 11. 参考リンク

- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [MetaMask Documentation](https://docs.metamask.io/)
- [EIP-1193: Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193)
- [Foundry Book - Cast](https://book.getfoundry.sh/reference/cast/)
