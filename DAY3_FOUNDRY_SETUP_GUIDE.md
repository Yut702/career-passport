# Day 3: Foundry セットアップとコントラクト確認 - 詳細手順書

## 目次

1. [Foundry のインストール確認](#1-foundry-のインストール確認)
2. [contracts/ ディレクトリの確認](#2-contracts-ディレクトリの確認)
3. [既存コントラクトの確認](#3-既存コントラクトの確認)
   - [CareerPassportNFT.sol](#careerpassportnftsol)
   - [StampManager.sol](#stampmanagersol)
4. [コントラクトのコンパイル](#4-コントラクトのコンパイル)
5. [ローカルネットワーク（Anvil）の起動](#5-ローカルネットワークanvilの起動)
6. [コントラクトのデプロイスクリプト確認](#6-コントラクトのデプロイスクリプト確認)
   - [DeployNFT.s.sol](#deploynftsol)
   - [DeployStamp.s.sol](#deploystampsol)

---

## 1. Foundry のインストール確認

### 1.1 インストール確認手順

ターミナルで以下のコマンドを実行して、Foundry がインストールされているか確認します：

```bash
# Forge のバージョン確認
forge --version

# Anvil のバージョン確認
anvil --version

# Cast のバージョン確認
cast --version
```

### 1.2 Foundry がインストールされていない場合

以下のコマンドで Foundry をインストールします：

```bash
# Foundry のインストールスクリプトをダウンロードして実行
curl -L https://foundry.paradigm.xyz | bash

# foundryup を実行（初回のみ）
foundryup
```

インストール後、ターミナルを再起動するか、以下のコマンドでパスを更新します：

```bash
source ~/.bashrc  # または source ~/.zshrc
```

### 1.3 確認結果

正常にインストールされている場合、以下のような出力が表示されます：

```
forge 0.2.0 (xxxxx xxxxxx xxxxxx)
anvil 0.2.0 (xxxxx xxxxxx xxxxxx)
cast 0.2.0 (xxxxx xxxxxx xxxxxx)
```

---

## 2. contracts/ ディレクトリの確認

### 2.1 ディレクトリ構造の確認

プロジェクトルートから `contracts/` ディレクトリに移動し、構造を確認します：

```bash
cd contracts
ls -la
```

### 2.2 期待されるディレクトリ構造

```
contracts/
├── foundry.toml          # Foundry の設定ファイル
├── README.md            # Foundry の使用方法
├── lib/                 # 外部ライブラリ
│   ├── forge-std/       # Foundry 標準ライブラリ
│   └── openzeppelin-contracts/  # OpenZeppelin Contracts
├── src/                 # ソースコード（コントラクト）
│   ├── CareerPassportNFT.sol
│   └── StampManager.sol
├── script/              # デプロイスクリプト
│   ├── DeployNFT.s.sol
│   └── DeployStamp.s.sol
└── test/                # テストファイル
    └── Counter.t.sol
```

### 2.3 foundry.toml の確認

`foundry.toml` は Foundry の設定ファイルです。現在の設定を確認します：

```bash
cat foundry.toml
```

**設定内容の説明**：

- `src = "src"`: ソースコードのディレクトリを指定
- `out = "out"`: コンパイル後の出力ディレクトリを指定
- `libs = ["lib"]`: 外部ライブラリのディレクトリを指定

### 2.4 依存関係の確認

OpenZeppelin などの外部ライブラリがインストールされているか確認します：

```bash
# lib ディレクトリの内容を確認
ls -la lib/
```

OpenZeppelin がインストールされていない場合は、以下のコマンドでインストールします：

```bash
forge install OpenZeppelin/openzeppelin-contracts
```

**注意**: `forge install` コマンドは `lib/` ディレクトリ直下に `openzeppelin-contracts/` フォルダを作成します。これは正しい配置です。`foundry.toml` の `libs = ["lib"]` 設定により、`lib/` 直下のすべてのライブラリが自動的に認識されます。

---

## 3. 既存コントラクトの確認

### CareerPassportNFT.sol

キャリアパスポート NFT を管理するコントラクト。ERC721 標準に準拠し、譲渡不可の NFT として実装。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CareerPassportNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;                    // トークンIDカウンター
    mapping(uint256 => string) private _tokenURIs;     // メタデータURI
    mapping(uint256 => string) private _tokenNames;     // トークン名
    mapping(uint256 => string) private _tokenRarities;  // レアリティ
    mapping(uint256 => string[]) private _tokenOrganizations; // 関連組織

    constructor() ERC721("CareerPassportNFT", "CPNFT") Ownable(msg.sender) {}

    // NFT発行（所有者のみ）
    function mint(
        address to,
        string memory tokenURI,
        string memory name,
        string memory rarity,
        string[] memory organizations
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = tokenURI;
        _tokenNames[tokenId] = name;
        _tokenRarities[tokenId] = rarity;
        _tokenOrganizations[tokenId] = organizations;
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function getTokenName(uint256 tokenId) public view returns (string memory) {
        return _tokenNames[tokenId];
    }

    function getTokenRarity(uint256 tokenId) public view returns (string memory) {
        return _tokenRarities[tokenId];
    }

    function getTokenOrganizations(uint256 tokenId) public view returns (string[] memory) {
        return _tokenOrganizations[tokenId];
    }

    // 譲渡を禁止（キャリア証明書は譲渡不可）
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        require(to == ownerOf(tokenId) || to == address(0), "Transfer not allowed");
        return super._update(to, tokenId, auth);
    }

    function getTotalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
}
```

**主な機能**:

- `mint()`: NFT 発行（所有者のみ実行可能）
- `tokenURI()`: メタデータ URI 取得
- `getTokenName()`: トークン名取得
- `getTokenRarity()`: レアリティ取得
- `getTokenOrganizations()`: 関連組織取得
- `_update()`: 譲渡を制限（所有者への返却とバーンのみ許可）

---

### StampManager.sol

スタンプ（キャリアの実績証明）を管理するコントラクト。ユーザーごとにスタンプを発行し、NFT 発行の条件を判定。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct Stamp {
    uint256 id;           // スタンプID（タイムスタンプ）
    string name;          // スタンプ名
    string organization;  // 発行組織
    string category;      // カテゴリ
    uint256 issuedAt;     // 発行日時
}

contract StampManager {
    mapping(address => Stamp[]) private userStamps;  // ユーザーごとのスタンプリスト
    mapping(address => mapping(string => uint256)) private organizationStampCount;  // 組織別スタンプ数
    mapping(address => mapping(string => uint256)) private categoryStampCount;      // カテゴリ別スタンプ数
    address public owner;

    event StampIssued(address indexed user, string name, string organization, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // スタンプ発行（所有者のみ）
    function issueStamp(
        address user,
        string memory name,
        string memory organization,
        string memory category
    ) public onlyOwner {
        Stamp memory newStamp = Stamp({
            id: block.timestamp,
            name: name,
            organization: organization,
            category: category,
            issuedAt: block.timestamp
        });
        userStamps[user].push(newStamp);
        organizationStampCount[user][organization]++;
        categoryStampCount[user][category]++;
        emit StampIssued(user, name, organization, block.timestamp);
    }

    function getUserStamps(address user) public view returns (Stamp[] memory) {
        return userStamps[user];
    }

    function getOrganizationStampCount(address user, string memory org) public view returns (uint256) {
        return organizationStampCount[user][org];
    }

    function getCategoryStampCount(address user, string memory category) public view returns (uint256) {
        return categoryStampCount[user][category];
    }

    // 同一組織から3つ以上のスタンプがあればNFT発行可能
    function canMintNft(address user, string memory organization) public view returns (bool) {
        return organizationStampCount[user][organization] >= 3;
    }

    function getUserStampCount(address user) public view returns (uint256) {
        return userStamps[user].length;
    }
}
```

**主な機能**:

- `issueStamp()`: スタンプ発行（所有者のみ実行可能）
- `getUserStamps()`: ユーザーの全スタンプ取得
- `getOrganizationStampCount()`: 組織別スタンプ数取得
- `getCategoryStampCount()`: カテゴリ別スタンプ数取得
- `canMintNft()`: NFT 発行条件判定（同一組織から 3 つ以上）

---

## 4. コントラクトのコンパイル

### 4.1 コンパイルの実行

`contracts/` ディレクトリで以下のコマンドを実行します：

```bash
cd contracts
forge build
```

### 4.2 コンパイル結果の確認

コンパイルが成功すると、以下のような出力が表示されます：

```
[⠆] Compiling...
[⠆] Compiling 8 files with 0.8.20
[⠆] Solc 0.8.20 finished in 2.34s
Compiler run successful!
```

### 4.3 コンパイル後のファイル構造

コンパイル後、`out/` ディレクトリが作成され、以下のような構造になります：

```
out/
├── CareerPassportNFT.sol/
│   ├── CareerPassportNFT.json  # ABI とバイトコード
│   └── ...
├── StampManager.sol/
│   ├── StampManager.json
│   └── ...
└── ...
```

### 4.4 ABI の確認

ABI（Application Binary Interface）は、コントラクトと外部アプリケーション間のインターフェースです。以下のコマンドで確認できます：

```bash
# CareerPassportNFT の ABI を確認
cat out/CareerPassportNFT.sol/CareerPassportNFT.json | jq .abi

# StampManager の ABI を確認
cat out/StampManager.sol/StampManager.json | jq .abi
```

### 4.5 コンパイルエラーの対処

コンパイルエラーが発生した場合：

1. **依存関係の確認**: OpenZeppelin が正しくインストールされているか確認

   ```bash
   forge install OpenZeppelin/openzeppelin-contracts
   ```

2. **Solidity バージョンの確認**: `pragma` ディレクティブが正しいか確認

3. **インポートパスの確認**: `foundry.toml` の設定を確認

---

## 5. ローカルネットワーク（Anvil）の起動

### 5.1 Anvil の起動

新しいターミナルウィンドウを開き、以下のコマンドを実行します：

```bash
anvil
```

### 5.2 Anvil の出力内容

Anvil を起動すると、以下のような情報が表示されます：

```
Available Accounts
==================

(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
(2) 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
...

Private Keys
==================

(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
...

Wallet
==================
Mnemonic:          test test test test test test test test test test test junk
Base Chain ID:     31337
Listening on:      127.0.0.1:8545
```

### 5.3 重要な情報

- **アカウント**: 10 個のテストアカウントが自動的に作成され、それぞれ 10,000 ETH が付与されます
- **RPC URL**: `http://127.0.0.1:8545` または `http://localhost:8545`
- **チェーン ID**: `31337`
- **プライベートキー**: 各アカウントのプライベートキーが表示されます（テスト用）

### 5.4 Anvil のオプション

Anvil は様々なオプションで起動できます：

```bash
# 特定のポートで起動
anvil --port 8546

# 特定のブロックタイムで起動（デフォルトは 0 秒）
anvil --block-time 2

# 特定のチェーン ID で起動
anvil --chain-id 1337

# ヘルプを表示
anvil --help
```

### 5.5 Anvil の停止

Anvil を停止するには、`Ctrl + C` を押します。

---

## 6. コントラクトのデプロイスクリプト確認

### DeployNFT.s.sol

`CareerPassportNFT` コントラクトをデプロイするスクリプト。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {CareerPassportNFT} from "../src/CareerPassportNFT.sol";

contract DeployNFT is Script {
    function run() external returns (CareerPassportNFT) {
        vm.startBroadcast();  // トランザクション送信開始
        CareerPassportNFT nft = new CareerPassportNFT();
        vm.stopBroadcast();   // トランザクション送信終了
        return nft;
    }
}
```

**説明**:

- `Script` を継承してデプロイスクリプトを作成
- `run()` がエントリーポイント
- `vm.startBroadcast()` / `vm.stopBroadcast()` でトランザクション送信を制御

---

### DeployStamp.s.sol

`StampManager` コントラクトをデプロイするスクリプト。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {StampManager} from "../src/StampManager.sol";

contract DeployStamp is Script {
    function run() external returns (StampManager) {
        vm.startBroadcast();  // トランザクション送信開始
        StampManager stampManager = new StampManager();
        vm.stopBroadcast();   // トランザクション送信終了
        return stampManager;
    }
}
```

**説明**:

- `Script` を継承してデプロイスクリプトを作成
- `run()` がエントリーポイント
- `vm.startBroadcast()` / `vm.stopBroadcast()` でトランザクション送信を制御

---

## 7. デプロイスクリプトの実行（参考）

### 7.1 デプロイの準備

Anvil が起動していることを確認します。別のターミナルで以下のコマンドを実行します：

```bash
cd contracts
```

### 7.2 CareerPassportNFT のデプロイ

```bash
forge script script/DeployNFT.s.sol:DeployNFT --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**コマンドの説明**：

- `forge script`: スクリプトを実行するコマンド
- `script/DeployNFT.s.sol:DeployNFT`: スクリプトファイルとコントラクト名
- `--rpc-url http://localhost:8545`: Anvil の RPC URL
- `--broadcast`: 実際にトランザクションを送信する（省略するとシミュレーションのみ）
- `--private-key`: デプロイに使用するアカウントのプライベートキー（Anvil の最初のアカウント）

### 7.3 StampManager のデプロイ

```bash
forge script script/DeployStamp.s.sol:DeployStamp --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 7.4 デプロイ結果の確認

デプロイが成功すると、コントラクトアドレスが表示されます：

```
== Return ==
0: address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

このアドレスをメモしておきます。フロントエンドやバックエンドで使用します。

---

## 8. まとめ

Day 3 では、以下の作業を完了しました：

1. ✅ Foundry のインストール確認
2. ✅ `contracts/` ディレクトリの確認
3. ✅ 既存コントラクトの確認
   - ✅ `CareerPassportNFT.sol` の詳細な解説
   - ✅ `StampManager.sol` の詳細な解説
4. ✅ コントラクトのコンパイル
5. ✅ ローカルネットワーク（Anvil）の起動方法の確認
6. ✅ コントラクトのデプロイスクリプト確認
   - ✅ `DeployNFT.s.sol` の詳細な解説
   - ✅ `DeployStamp.s.sol` の詳細な解説

次の Day 4 では、コントラクトのテストとデプロイを実際に行います。

---

## 9. トラブルシューティング

### 9.1 コンパイルエラー

**問題**: `forge build` でエラーが発生する

**解決策**:

1. OpenZeppelin がインストールされているか確認
   ```bash
   forge install OpenZeppelin/openzeppelin-contracts
   ```
2. Solidity バージョンが正しいか確認
3. `foundry.toml` の設定を確認

### 9.2 Anvil が起動しない

**問題**: `anvil` コマンドが見つからない

**解決策**:

1. Foundry が正しくインストールされているか確認
   ```bash
   foundryup
   ```
2. パスが正しく設定されているか確認
   ```bash
   echo $PATH
   ```

### 9.3 デプロイが失敗する

**問題**: `forge script` でデプロイが失敗する

**解決策**:

1. Anvil が起動しているか確認
2. RPC URL が正しいか確認
3. プライベートキーが正しいか確認
4. ガス代が十分にあるか確認（Anvil では通常問題なし）

---

## 10. 参考リンク

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [ERC721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [Solidity Documentation](https://docs.soliditylang.org/)
