# Day 4: コントラクトのテストとデプロイ - 詳細手順書

## 目次

1. [コントラクトのユニットテスト作成](#1-コントラクトのユニットテスト作成)
2. [テストの実行と確認](#2-テストの実行と確認)
3. [ローカルネットワークへのデプロイ](#3-ローカルネットワークへのデプロイ)
4. [デプロイされたコントラクトアドレスの記録](#4-デプロイされたコントラクトアドレスの記録)
5. [コントラクト ABI の取得と保存](#5-コントラクト-abi-の取得と保存)
6. [基本的な機能テスト（スタンプ発行、NFT 発行など）](#6-基本的な機能テストスタンプ発行nft-発行など)

---

## 1. コントラクトのユニットテスト作成

### 1.1 テストファイルの作成

Foundry では、`test/`ディレクトリに`*.t.sol`という拡張子のファイルを作成します。

```bash
cd contracts
mkdir -p test
```

### 1.2 CareerPassportNFT のテスト作成

`test/CareerPassportNFT.t.sol`を作成します：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CareerPassportNFT} from "../src/CareerPassportNFT.sol";

contract CareerPassportNFTTest is Test {
    CareerPassportNFT public nft;
    address public owner;
    address public user;

    function setUp() public {
        owner = address(this);
        user = address(0x1);
        nft = new CareerPassportNFT();
    }

    function test_Mint() public {
        string memory uri = "https://example.com/metadata.json";
        string memory name = "優秀な成績証明書";
        string memory rarity = "Rare";
        string[] memory organizations = new string[](1);
        organizations[0] = "東京大学";

        uint256 tokenId = nft.mint(user, uri, name, rarity, organizations);

        assertEq(nft.ownerOf(tokenId), user);
        assertEq(nft.tokenURI(tokenId), uri);
        assertEq(nft.getTokenName(tokenId), name);
        assertEq(nft.getTokenRarity(tokenId), rarity);
        assertEq(nft.getTokenOrganizations(tokenId)[0], organizations[0]);
    }

    function test_TransferNotAllowed() public {
        string memory uri = "https://example.com/metadata.json";
        string memory name = "テストNFT";
        string memory rarity = "Common";
        string[] memory organizations = new string[](0);

        uint256 tokenId = nft.mint(user, uri, name, rarity, organizations);

        // 譲渡を試みる（失敗するはず）
        vm.prank(user);
        vm.expectRevert("Transfer not allowed");
        nft.transferFrom(user, address(0x2), tokenId);
    }

    function test_GetTotalSupply() public {
        assertEq(nft.getTotalSupply(), 0);

        string memory uri = "https://example.com/metadata.json";
        string memory name = "テストNFT";
        string memory rarity = "Common";
        string[] memory organizations = new string[](0);

        nft.mint(user, uri, name, rarity, organizations);
        assertEq(nft.getTotalSupply(), 1);

        nft.mint(user, uri, name, rarity, organizations);
        assertEq(nft.getTotalSupply(), 2);
    }
}
```

### 1.3 StampManager のテスト作成

`test/StampManager.t.sol`を作成します：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {StampManager} from "../src/StampManager.sol";

contract StampManagerTest is Test {
    StampManager public stampManager;
    address public owner;
    address public user;

    function setUp() public {
        owner = address(this);
        user = address(0x1);
        stampManager = new StampManager();
    }

    function test_IssueStamp() public {
        string memory name = "優秀な成績";
        string memory organization = "東京大学";
        string memory category = "学業";

        stampManager.issueStamp(user, name, organization, category);

        StampManager.Stamp[] memory stamps = stampManager.getUserStamps(user);
        assertEq(stamps.length, 1);
        assertEq(stamps[0].name, name);
        assertEq(stamps[0].organization, organization);
        assertEq(stamps[0].category, category);
    }

    function test_GetOrganizationStampCount() public {
        string memory organization = "東京大学";
        string memory category = "学業";

        assertEq(stampManager.getOrganizationStampCount(user, organization), 0);

        stampManager.issueStamp(user, "スタンプ1", organization, category);
        assertEq(stampManager.getOrganizationStampCount(user, organization), 1);

        stampManager.issueStamp(user, "スタンプ2", organization, category);
        assertEq(stampManager.getOrganizationStampCount(user, organization), 2);
    }

    function test_CanMintNft() public {
        string memory organization = "東京大学";
        string memory category = "学業";

        // 2つまではNFT発行不可
        stampManager.issueStamp(user, "スタンプ1", organization, category);
        stampManager.issueStamp(user, "スタンプ2", organization, category);
        assertFalse(stampManager.canMintNft(user, organization));

        // 3つ目でNFT発行可能
        stampManager.issueStamp(user, "スタンプ3", organization, category);
        assertTrue(stampManager.canMintNft(user, organization));
    }

    function test_OnlyOwnerCanIssueStamp() public {
        string memory name = "テストスタンプ";
        string memory organization = "テスト組織";
        string memory category = "テストカテゴリ";

        // 所有者以外は発行できない
        vm.prank(address(0x999));
        vm.expectRevert("Not owner");
        stampManager.issueStamp(user, name, organization, category);
    }
}
```

---

## 2. テストの実行と確認

### 2.1 すべてのテストを実行

```bash
cd contracts
forge test
```

### 2.2 特定のテストファイルを実行

```bash
# CareerPassportNFT のテストのみ実行
forge test --match-path test/CareerPassportNFT.t.sol

# StampManager のテストのみ実行
forge test --match-path test/StampManager.t.sol
```

### 2.3 詳細な出力でテストを実行

```bash
# より詳細な出力（ガス使用量など）
forge test -vvv

# 非常に詳細な出力（デバッグ用）
forge test -vvvv
```

### 2.4 テスト結果の確認

テストが成功すると、以下のような出力が表示されます：

```
[⠆] Compiling...
[⠆] Compiling 2 files with 0.8.20
[⠆] Solc 0.8.20 finished in 1.23s
Compiler run successful!

Running 6 tests for test/CareerPassportNFT.t.sol:CareerPassportNFTTest
[PASS] test_Mint() (gas: 123456)
[PASS] test_TransferNotAllowed() (gas: 234567)
[PASS] test_GetTotalSupply() (gas: 345678)

Running 4 tests for test/StampManager.t.sol:StampManagerTest
[PASS] test_IssueStamp() (gas: 456789)
[PASS] test_GetOrganizationStampCount() (gas: 567890)
[PASS] test_CanMintNft() (gas: 678901)
[PASS] test_OnlyOwnerCanIssueStamp() (gas: 789012)

Test result: ok. 7 passed; 0 failed; finished in 1.23s
```

---

## 3. ローカルネットワークへのデプロイ

### 3.1 Anvil の起動

新しいターミナルウィンドウで Anvil を起動します：

```bash
cd contracts
anvil
```

Anvil が起動すると、以下のような情報が表示されます：

```
Available Accounts
==================

(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
...

Private Keys
==================

(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...

Wallet
==================
Mnemonic:          test test test test test test test test test test test junk
Base Chain ID:     31337
Listening on:      127.0.0.1:8545
```

### 3.2 すべてのコントラクトを一度にデプロイ（推奨）

デプロイスクリプトを使用して、すべてのコントラクトを一度にデプロイし、アドレスを自動的に記録します：

```bash
cd contracts
bash scripts/deploy-all.sh
```

このスクリプトは以下を実行します：

1. `CareerPassportNFT`をデプロイ
2. `StampManager`をデプロイ
3. デプロイ済みアドレスを`deployed.json`に自動保存

### 3.3 個別にデプロイする方法

個別にデプロイしたい場合は、以下のコマンドを実行します：

**CareerPassportNFT のデプロイ**:

```bash
cd contracts
forge script script/DeployNFT.s.sol:DeployNFT \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**StampManager のデプロイ**:

```bash
forge script script/DeployStamp.s.sol:DeployStamp \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

デプロイ後、`bash scripts/save-deployed-addresses.sh`を実行してアドレスを記録します。

### 3.4 デプロイ結果の確認

デプロイが成功すると、以下のような出力が表示されます：

```
== Return ==
0: contract CareerPassportNFT 0x5FbDB2315678afecb367f032d93F642f64180aa3

✅  [Success] Hash: 0x...
Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

---

## 4. デプロイされたコントラクトアドレスの記録

### 4.1 自動的にアドレスを記録する方法（推奨）

デプロイが成功したら、自動的にコントラクトアドレスを記録するスクリプトを使用します：

```bash
cd contracts
bash scripts/save-deployed-addresses.sh
```

このスクリプトは、`broadcast/`ディレクトリからデプロイ済みのコントラクトアドレスを自動的に取得し、`deployed.json`ファイルに保存します。

**スクリプトの動作**:

- `broadcast/DeployNFT.s.sol/31337/run-latest.json`から`CareerPassportNFT`のアドレスを取得
- `broadcast/DeployStamp.s.sol/31337/run-latest.json`から`StampManager`のアドレスを取得
- `deployed.json`ファイルに保存（存在しない場合は作成）

**出力例**:

```json
{
  "31337": {
    "CareerPassportNFT": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "StampManager": "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0"
  }
}
```

### 4.2 手動でアドレスを記録する方法

スクリプトが使用できない場合や、手動で記録したい場合は、以下のように`deployed.json`ファイルを作成します：

```bash
cd contracts
cat > deployed.json << EOF
{
  "31337": {
    "CareerPassportNFT": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "StampManager": "0x..."
  }
}
EOF
```

**注意**: デプロイ時に表示された実際のコントラクトアドレスに置き換えてください。

### 4.2 環境変数ファイルの作成

フロントエンドで使用するために、`.env.local`ファイルを自動生成します：

```bash
cd contracts
bash scripts/generate-env.sh
```

このスクリプトは、`deployed.json`からアドレスを読み取り、`frontend/.env.local`ファイルを自動生成します。

**生成されるファイル内容**:

```env
# コントラクトアドレス（Chain ID: 31337）
VITE_NFT_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_STAMP_MANAGER_ADDRESS=0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
VITE_RPC_URL=http://localhost:8545
VITE_CHAIN_ID=31337
```

**手動で作成する場合**:

`deployed.json`が存在しない場合や、手動で作成したい場合は、以下のコマンドを実行します：

```bash
cd ../frontend
cat > .env.local << EOF
VITE_NFT_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_STAMP_MANAGER_ADDRESS=0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0
VITE_RPC_URL=http://localhost:8545
VITE_CHAIN_ID=31337
EOF
```

**注意**: デプロイ時に取得した実際のコントラクトアドレスに置き換えてください。

---

## 5. コントラクト ABI の取得と保存

### 5.1 ABI の取得

```bash
cd contracts

# CareerPassportNFT の ABI を取得
cat out/CareerPassportNFT.sol/CareerPassportNFT.json | jq .abi > ../frontend/src/abis/CareerPassportNFT.json

# StampManager の ABI を取得
cat out/StampManager.sol/StampManager.json | jq .abi > ../frontend/src/abis/StampManager.json
```

### 5.2 ABI ディレクトリの作成

```bash
cd ../frontend
mkdir -p src/abis
```

### 5.3 ABI ファイルの確認

```bash
# CareerPassportNFT の ABI を確認
cat src/abis/CareerPassportNFT.json | jq .

# StampManager の ABI を確認
cat src/abis/StampManager.json | jq .
```

---

## 6. 基本的な機能テスト（スタンプ発行、NFT 発行など）

### 6.1 Cast を使用したコントラクトとの対話

Cast は Foundry に含まれるコマンドラインツールで、コントラクトと直接対話できます。

### 6.2 スタンプ発行のテスト

```bash
cd contracts

# 重要: まず変数を設定してください！
# StampManager のアドレスを設定（deployed.jsonから取得するか、デプロイ時に取得したアドレスを使用）
STAMP_MANAGER=$(jq -r '.["31337"].StampManager' deployed.json)
# または手動で設定: STAMP_MANAGER=0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0

# 変数が正しく設定されているか確認
echo "STAMP_MANAGER=$STAMP_MANAGER"

# スタンプを発行
# 構文: cast send [TO] [SIG] [ARGS]... [OPTIONS]
# 重要: [TO]は最初の引数（コントラクトアドレス）、[SIG]は2番目の引数（関数シグネチャ）
cast send "$STAMP_MANAGER" \
  "issueStamp(address,string,string,string)" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  "優秀な成績" \
  "東京大学" \
  "学業" \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# スタンプ数を確認
# 構文: cast call [TO] [SIG] [ARGS]... [OPTIONS]
cast call "$STAMP_MANAGER" \
  "getOrganizationStampCount(address,string)" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  "東京大学" \
  --rpc-url http://localhost:8545

# NFT発行可能か確認
cast call "$STAMP_MANAGER" \
  "canMintNft(address,string)" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  "東京大学" \
  --rpc-url http://localhost:8545
```

**コマンドの構文解説**:

- `cast send [TO] [SIG] [ARGS]... [OPTIONS]`: トランザクションを送信

  - `[TO]`: コントラクトアドレス（**最初の引数**、必須）
  - `[SIG]`: 関数シグネチャ（**2 番目の引数**、必須）
  - `[ARGS]...`: 関数の引数（3 番目以降、関数のパラメータに応じて）
  - `[OPTIONS]`: オプション
    - `--rpc-url`: RPC URL（必須）
    - `--private-key`: 送信者のプライベートキー（必須）

- `cast call [TO] [SIG] [ARGS]... [OPTIONS]`: ビュー関数を呼び出し（ガス不要）
  - 同じ構文だが、トランザクションを送信せずに結果を取得
  - `--private-key`は不要（読み取り専用のため）

**よくあるエラーと対処法**:

- `error: invalid value '' for '[TO]': invalid string length`

  - **原因**: 変数が設定されていない（`$NFT_CONTRACT`や`$STAMP_MANAGER`が空）
  - **解決策**: コマンドを実行する前に、必ず変数を設定してください
    ```bash
    # 変数を設定
    NFT_CONTRACT=$(jq -r '.["31337"].CareerPassportNFT' deployed.json)
    # 確認
    echo "NFT_CONTRACT=$NFT_CONTRACT"
    ```

- `error: invalid value '...' for '[TO]': odd number of digits`
  - **原因**: 引数の順序が間違っている（関数シグネチャが`[TO]`の位置に来ている）
  - **解決策**: コントラクトアドレスを最初の引数に、関数シグネチャを 2 番目の引数に配置する
  - **正しい例**: `cast send 0x... "functionName(...)" arg1 arg2 ...`
  - **間違い例**: `cast send "functionName(...)" 0x... arg1 arg2 ...`

### 6.3 NFT 発行のテスト

```bash
cd contracts

# 重要: まず変数を設定してください！
# CareerPassportNFT のアドレスを設定（deployed.jsonから取得するか、デプロイ時に取得したアドレスを使用）
NFT_CONTRACT=$(jq -r '.["31337"].CareerPassportNFT' deployed.json)
# または手動で設定: NFT_CONTRACT=0x5FbDB2315678afecb367f032d93F642f64180aa3

# 変数が正しく設定されているか確認
echo "NFT_CONTRACT=$NFT_CONTRACT"

# NFT を発行
# 構文: cast send [TO] [SIG] [ARGS]... [OPTIONS]
# 重要: [TO]は最初の引数（コントラクトアドレス）、[SIG]は2番目の引数（関数シグネチャ）
cast send "$NFT_CONTRACT" \
  "mint(address,string,string,string,string[])" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  "https://example.com/metadata.json" \
  "優秀な成績証明書" \
  "Rare" \
  '["東京大学"]' \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# 重要: mintが成功したか確認するため、総供給量を確認
# 総供給量が0より大きければ、トークンが発行されている
echo "=== 総供給量を確認 ==="
TOTAL_SUPPLY=$(cast call "$NFT_CONTRACT" \
  "getTotalSupply()" \
  --rpc-url http://localhost:8545)

echo "Total Supply: $TOTAL_SUPPLY"

# 総供給量が0の場合はエラー
if [ "$TOTAL_SUPPLY" = "0" ]; then
  echo "エラー: NFTがまだ発行されていません。mintが成功したか確認してください。"
  exit 1
fi

# 発行されたトークンIDを計算（総供給量 - 1）
# 最初のmintではトークンID 0が発行される
TOKEN_ID=$((TOTAL_SUPPLY - 1))
echo "使用するトークンID: $TOKEN_ID"

# NFT の情報を確認
# 構文: cast call [TO] [SIG] [ARGS]... [OPTIONS]
# 注意: 存在しないトークンIDを指定すると ERC721NonexistentToken エラーが発生します
echo "=== NFT情報を取得 ==="
cast call "$NFT_CONTRACT" \
  "tokenURI(uint256)" \
  "$TOKEN_ID" \
  --rpc-url http://localhost:8545

cast call "$NFT_CONTRACT" \
  "getTokenName(uint256)" \
  "$TOKEN_ID" \
  --rpc-url http://localhost:8545
```

**重要な注意事項**:

1. **引数の順序**: `cast send`の正しい順序は以下の通りです：

   - 1 番目: コントラクトアドレス（`[TO]`）
   - 2 番目: 関数シグネチャ（`[SIG]`）
   - 3 番目以降: 関数の引数（`[ARGS]...`）
   - オプション: `--rpc-url`, `--private-key`など

2. **文字列配列の渡し方**: 文字列配列を渡す場合は、シングルクォートで囲み、JSON 配列形式で指定します：

   - 正しい: `'["東京大学"]'`
   - 正しい（複数要素）: `'["東京大学","早稲田大学"]'`
   - 間違い: `["東京大学"]`（クォートなし）
   - 間違い: `"[\"東京大学\"]"`（ダブルクォート内のエスケープ）

3. **変数の使用**: コントラクトアドレスを変数に設定する場合は、`$NFT_CONTRACT`ではなく`"$NFT_CONTRACT"`のように引用符で囲むことを推奨します（スペースが含まれる場合に備えて）。

4. **トークン ID の確認**: mint した後にトークン情報を取得する場合は、必ず`getTotalSupply()`で総供給量を確認してから、有効なトークン ID（0 から`getTotalSupply() - 1`の範囲）を使用してください。存在しないトークン ID を指定すると`ERC721NonexistentToken`エラーが発生します。

   - **エラー例**: `ERC721NonexistentToken(0)` - トークン ID 0 がまだ mint されていない
   - **解決策**: mint が成功したことを確認し、`getTotalSupply()`で有効なトークン ID の範囲を確認する

### 6.4 テストスクリプトの作成

より簡単にテストするために、`scripts/test-deployment.sh`を作成します：

```bash
#!/bin/bash

# コントラクトアドレス（deployed.jsonから自動取得）
cd "$(dirname "$0")/.."
STAMP_MANAGER=$(jq -r '.["31337"].StampManager' deployed.json)
NFT_CONTRACT=$(jq -r '.["31337"].CareerPassportNFT' deployed.json)
USER_ADDRESS="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
RPC_URL="http://localhost:8545"

echo "=== スタンプ発行テスト ==="
cast send "$STAMP_MANAGER" \
  "issueStamp(address,string,string,string)" \
  "$USER_ADDRESS" \
  "優秀な成績" \
  "東京大学" \
  "学業" \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY"

echo "=== スタンプ数確認 ==="
cast call "$STAMP_MANAGER" \
  "getOrganizationStampCount(address,string)" \
  "$USER_ADDRESS" \
  "東京大学" \
  --rpc-url "$RPC_URL"

echo "=== NFT発行テスト ==="
# mintトランザクションを実行し、エラーをチェック
if ! cast send "$NFT_CONTRACT" \
  "mint(address,string,string,string,string[])" \
  "$USER_ADDRESS" \
  "https://example.com/metadata.json" \
  "優秀な成績証明書" \
  "Rare" \
  '["東京大学"]' \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" 2>&1; then
  echo "エラー: mintが失敗しました。以下を確認してください："
  echo "1. コントラクトの所有者か確認: cast call \"$NFT_CONTRACT\" \"owner()\" --rpc-url \"$RPC_URL\""
  echo "2. プライベートキーが正しいか確認"
  echo "3. Anvilが起動しているか確認: curl http://localhost:8545"
  exit 1
fi

# mintが成功したことを確認するため、少し待つ（Anvilでは通常不要だが、念のため）
sleep 1

echo "=== 総供給量確認 ==="
TOTAL_SUPPLY=$(cast call "$NFT_CONTRACT" \
  "getTotalSupply()" \
  --rpc-url "$RPC_URL")

echo "Total Supply: $TOTAL_SUPPLY"

# 総供給量が0の場合はエラー
if [ "$TOTAL_SUPPLY" = "0" ] || [ -z "$TOTAL_SUPPLY" ]; then
  echo "エラー: NFTがまだ発行されていません。mintが成功したか確認してください。"
  echo "デバッグ手順:"
  echo "1. mintトランザクションが成功したか確認"
  echo "2. コントラクトアドレスが正しいか確認: echo \"$NFT_CONTRACT\""
  echo "3. コントラクトの所有者を確認: cast call \"$NFT_CONTRACT\" \"owner()\" --rpc-url \"$RPC_URL\""
  echo "4. 実行しているアドレスを確認: cast wallet address --private-key \"$PRIVATE_KEY\""
  exit 1
fi

# 発行されたトークンIDを計算（総供給量 - 1）
# 最初のmintではトークンID 0が発行される（総供給量が1の場合）
TOKEN_ID=$((TOTAL_SUPPLY - 1))
echo "使用するトークンID: $TOKEN_ID"

# トークンIDが有効か確認（0以上、総供給量未満）
if [ "$TOKEN_ID" -lt 0 ] || [ "$TOKEN_ID" -ge "$TOTAL_SUPPLY" ]; then
  echo "エラー: 無効なトークンID: $TOKEN_ID (総供給量: $TOTAL_SUPPLY)"
  exit 1
fi

echo "=== NFT情報確認 ==="
# トークン情報を取得（エラーハンドリング付き）
if ! cast call "$NFT_CONTRACT" \
  "tokenURI(uint256)" \
  "$TOKEN_ID" \
  --rpc-url "$RPC_URL" 2>&1; then
  echo "エラー: tokenURIの取得に失敗しました。トークンID $TOKEN_ID が存在しない可能性があります。"
  exit 1
fi

if ! cast call "$NFT_CONTRACT" \
  "getTokenName(uint256)" \
  "$TOKEN_ID" \
  --rpc-url "$RPC_URL" 2>&1; then
  echo "エラー: getTokenNameの取得に失敗しました。トークンID $TOKEN_ID が存在しない可能性があります。"
  exit 1
fi
```

実行権限を付与して実行：

```bash
chmod +x scripts/test-deployment.sh
./scripts/test-deployment.sh
```

---

## 7. まとめ

Day 4 では、以下の作業を完了しました：

1. ✅ コントラクトのユニットテスト作成
2. ✅ テストの実行と確認
3. ✅ ローカルネットワークへのデプロイ
4. ✅ デプロイされたコントラクトアドレスの記録
5. ✅ コントラクト ABI の取得と保存
6. ✅ 基本的な機能テスト（スタンプ発行、NFT 発行など）
7. ✅ ルールベースシステムの実装（複数企業対応、レアリティ管理）

**成果物**:

- ✅ 動作するユニットテスト
- ✅ ローカルネットワークでのデプロイ済みコントラクト
- ✅ コントラクト ABI ファイル
- ✅ デプロイ済みコントラクトアドレスの記録
- ✅ ルールベースシステム（柔軟な NFT 発行ルール）

次の Day 5 では、フロントエンドとブロックチェーンを接続します。

---

## 7.1 スマートコントラクトの機能詳細

### StampManager（スタンプ管理コントラクト）

#### 基本機能

**スタンプ発行・管理**:

- ✅ ユーザーへのスタンプ発行（所有者のみ実行可能）
- ✅ スタンプ情報の保存（ID、名前、組織、カテゴリ、発行日時）
- ✅ ユーザーごとのスタンプリスト取得
- ✅ ユーザーのスタンプ総数取得

**集計機能**:

- ✅ 組織別スタンプ数の取得
- ✅ カテゴリ別スタンプ数の取得
- ✅ 複数ユーザーの独立管理

**NFT 発行条件判定（基本）**:

- ✅ 同一組織から 3 スタンプ以上で NFT 発行可能か判定
- ✅ 組織ごとの独立判定（異なる組織のスタンプは合算しない）

#### ルールベースシステム（新機能）

**ルール管理**:

- ✅ カスタム NFT 発行ルールの追加
  - レアリティ名を指定（例: "Rare", "Epic", "Legendary"）
  - 必要な企業数を指定
  - 企業あたりのスタンプ数を指定
- ✅ ルールの有効/無効切り替え
- ✅ ルール情報の取得

**条件チェック**:

- ✅ ユーザーが特定のルールを満たしているかチェック
- ✅ ユーザーが満たせる全ルール ID の取得
- ✅ 全ルール ID の取得

**使用例**:

- ルール ID 1（デフォルト）: 1 企業から 3 スタンプ = Common NFT
- ルール ID 2: 2 企業から各 3 スタンプ = Rare NFT
- ルール ID 3: 3 企業から各 3 スタンプ = Epic NFT
- ルール ID 4: 5 企業から各 3 スタンプ = Legendary NFT

### CareerPassportNFT（NFT 証明書コントラクト）

#### NFT 発行

- ✅ NFT 証明書の発行（所有者のみ実行可能）
- ✅ メタデータの設定（URI、名前、レアリティ、関連組織）
- ✅ トークン ID の自動採番（0 から順番）

#### NFT 情報取得

- ✅ トークン URI の取得
- ✅ トークン名の取得
- ✅ レアリティの取得
- ✅ 関連組織リストの取得
- ✅ 総供給量の取得

#### セキュリティ機能

- ✅ 譲渡禁止（キャリア証明書は譲渡不可）
- ✅ 所有者への返却のみ許可
- ✅ バーン（削除）機能

#### ERC721 標準準拠

- ✅ ERC721 標準インターフェース実装
- ✅ `ownerOf()`、`balanceOf()`などの標準関数
- ✅ メタデータ拡張対応

---

## 7.2 制限事項

### 機能的な制限

**スタンプ管理**:

- ❌ スタンプの削除・変更機能（現状は追加のみ）
- ❌ スタンプの有効期限機能
- ❌ スタンプの譲渡機能
- ❌ バッチ処理機能（複数スタンプ一括発行など）

**ルール管理**:

- ❌ ルールの削除機能（無効化のみ可能）
- ❌ カテゴリベースのルール（組織ベースのみ対応）
- ❌ 時間制限付きルール（期間限定 NFT など）
- ❌ 条件の複雑な組み合わせ（AND/OR 条件など）

**NFT 管理**:

- ❌ NFT のアップグレード機能
- ❌ NFT の分割・統合機能
- ❌ 自動 NFT 発行（手動 mint のみ）
- ❌ NFT の有効期限機能

### 技術的な制限

**デプロイ環境**:

- ❌ メインネットへのデプロイ（ローカルネットワークのみ）
- ❌ テストネットへのデプロイ（未実装）
- ❌ マルチチェーン対応（単一チェーン対応のみ）

**パフォーマンス**:

- ❌ ガス最適化（現状は動作確認優先）
- ❌ 大量データの効率的な処理
- ❌ イベントログの最適化

**セキュリティ**:

- ❌ アップグレード可能なコントラクト（現状は固定）
- ❌ マルチシグ対応
- ❌ タイムロック機能

### 運用上の制限

**アクセス制御**:

- ❌ 分散化されたスタンプ発行（現状は所有者のみ）
- ❌ ロールベースアクセス制御（RBAC）
- ❌ 複数所有者の管理

**統合**:

- ❌ フロントエンドとの自動連携（Day 5-6 で実装予定）
- ❌ バックエンド API との連携（未実装）
- ❌ 外部オラクルとの連携

### 将来の拡張予定

**Phase 1（Day 5-6）**:

- ⏳ フロントエンドとの連携
- ⏳ ウォレット連携
- ⏳ トランザクション送信機能

**Phase 2（Day 7）**:

- 📋 ガス最適化
- 📋 バッチ処理機能
- 📋 イベントログの改善

**Phase 3（将来）**:

- 📋 カテゴリベースのルール
- 📋 時間制限付きルール
- 📋 アップグレード可能なコントラクト
- 📋 マルチチェーン対応

---

## 8. トラブルシューティング

### 8.1 テストが失敗する

**問題**: `forge test` でテストが失敗する

**解決策**:

1. コンパイルエラーがないか確認

   ```bash
   forge build
   ```

2. テストファイルの構文を確認

3. アサーションの期待値を確認

### 8.2 デプロイが失敗する

**問題**: `forge script` でデプロイが失敗する

**解決策**:

1. Anvil が起動しているか確認
2. RPC URL が正しいか確認
3. プライベートキーが正しいか確認
4. ガス代が十分にあるか確認（Anvil では通常問題なし）

### 8.3 Cast コマンドが動作しない

**問題**: `cast send` や `cast call` がエラーになる

**解決策**:

1. **引数の順序を確認**

   - 正しい順序: `cast send [TO] [SIG] [ARGS]...`
   - `[TO]`（コントラクトアドレス）が最初の引数であることを確認
   - `[SIG]`（関数シグネチャ）が 2 番目の引数であることを確認

2. **エラーメッセージの確認**

   - `error: invalid value '...' for '[TO]': odd number of digits`
     - 引数の順序が間違っている可能性が高い
     - コントラクトアドレスと関数シグネチャの位置を確認

3. **コントラクトアドレスが正しいか確認**

   - `deployed.json`から正しいアドレスを取得しているか確認
   - 変数を使用する場合は、引用符で囲む: `"$NFT_CONTRACT"`

4. **関数シグネチャが正しいか確認**

   - 関数名とパラメータの型が正確に一致しているか確認
   - 例: `"mint(address,string,string,string,string[])"`

5. **パラメータの型が正しいか確認**

   - 文字列配列は`'["要素1","要素2"]'`の形式で指定
   - アドレスは`0x`で始まる 16 進数形式

6. **RPC URL が正しいか確認**
   - Anvil が起動しているか確認: `curl http://localhost:8545`
   - RPC URL が正しく設定されているか確認

### 8.4 ERC721NonexistentToken エラー

**問題**: `ERC721NonexistentToken(0)` などのエラーが発生する

**エラーメッセージ例**:

```
Error: Failed to estimate gas: server returned an error response: error code 3: execution reverted: custom error 0x7e273289: , data: "0x7e2732890000000000000000000000000000000000000000000000000000000000000000": ERC721NonexistentToken(0)
```

**エラーの意味**:

- **エラーコード**: `0x7e273289` = `ERC721NonexistentToken`のカスタムエラーシグネチャ
- **データ**: `0x7e2732890000000000000000000000000000000000000000000000000000000000000000`
  - 最初の 4 バイト（`0x7e273289`）: エラーシグネチャ
  - 残りの 32 バイト: トークン ID（0）をパディングしたもの

**原因**:

- 存在しないトークン ID に対してコントラクト関数（`tokenURI`、`getTokenName`、`ownerOf`など）を呼び出している
- NFT がまだ mint されていない状態でトークン情報を取得しようとしている
- トークン ID 0 をデフォルト値として使用しているが、実際には mint されていない
- mint トランザクションが失敗しているが、スクリプトがエラーを無視して次のステップに進んでいる

**よくある発生シナリオ**:

1. **mint が失敗している**

   - mint トランザクションが失敗している（権限エラー、ガス不足など）
   - しかし、スクリプトはエラーを無視して次のステップ（トークン情報取得）に進んでいる
   - トークン ID 0 が存在しない状態で`tokenURI(0)`や`getTokenName(0)`を呼び出している

2. **mint が成功する前にトークン情報を取得しようとしている**

   - mint トランザクションが送信されたが、まだブロックに含まれていない
   - トランザクションが確認される前に、トークン情報を取得しようとしている

3. **古いスクリプトを使用している**
   - 修正前のスクリプトを使用している
   - トークン ID 0 を直接指定している
   - `getTotalSupply()`で確認していない

**解決策**:

1. **mint が成功したか確認**

   ```bash
   # 総供給量を確認
   cast call "$NFT_CONTRACT" "getTotalSupply()" --rpc-url http://localhost:8545
   ```

   - 総供給量が 0 の場合は、まだ NFT が mint されていません
   - mint が成功しているか確認してください

2. **有効なトークン ID を使用**

   ```bash
   # 総供給量を取得
   TOTAL_SUPPLY=$(cast call "$NFT_CONTRACT" "getTotalSupply()" --rpc-url http://localhost:8545)

   # 有効なトークンIDの範囲: 0 から (TOTAL_SUPPLY - 1)
   # 最新のトークンID = TOTAL_SUPPLY - 1
   TOKEN_ID=$((TOTAL_SUPPLY - 1))

   # トークン情報を取得
   cast call "$NFT_CONTRACT" "tokenURI(uint256)" "$TOKEN_ID" --rpc-url http://localhost:8545
   ```

3. **mint の順序を確認**

   - 必ず mint を実行してから、トークン情報を取得してください
   - mint が成功したことを確認してから、次のステップに進んでください

4. **エラーハンドリングを追加**

   ```bash
   # mintを実行し、エラーをキャッチ
   if ! cast send "$NFT_CONTRACT" \
     "mint(address,string,string,string,string[])" \
     "$USER_ADDRESS" \
     "https://example.com/metadata.json" \
     "優秀な成績証明書" \
     "Rare" \
     '["東京大学"]' \
     --rpc-url "$RPC_URL" \
     --private-key "$PRIVATE_KEY"; then
     echo "エラー: mintが失敗しました"
     exit 1
   fi
   ```

5. **デバッグ手順**

   ```bash
   # 1. Anvilが起動しているか確認
   curl http://localhost:8545

   # 2. コントラクトアドレスが正しいか確認
   cat deployed.json | jq .

   # 3. コントラクトの所有者を確認
   cast call "$NFT_CONTRACT" "owner()" --rpc-url http://localhost:8545

   # 4. mintを実行しているアドレスが所有者か確認
   cast wallet address --private-key "$PRIVATE_KEY"

   # 5. 総供給量を確認
   cast call "$NFT_CONTRACT" "getTotalSupply()" --rpc-url http://localhost:8545
   ```

**フロントエンドでの対応**:

- フロントエンドでコントラクトを呼び出す場合は、`getTotalSupply()`で有効なトークン ID の範囲を確認してから使用してください
- 存在しないトークン ID に対しては、適切なエラーメッセージを表示してください

---

## 9. 参考リンク

- [Foundry Book - Testing](https://book.getfoundry.sh/forge/tests)
- [Foundry Book - Scripts](https://book.getfoundry.sh/tutorials/solidity-scripting)
- [Cast Documentation](https://book.getfoundry.sh/reference/cast/)
