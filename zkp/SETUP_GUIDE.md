# ZKP 機能セットアップガイド

このガイドでは、ZKP 機能を動作させるための手順を説明します。

## 前提条件

- Node.js 18 以上がインストールされていること
- npm がインストールされていること

## セットアップ手順

### 1. ZKP 回路の依存関係をインストール

```bash
cd zkp
npm install
```

### 2. 回路をコンパイル

```bash
npm run compile
```

これにより、以下の回路がコンパイルされます：

- `age.circom` - 年齢証明回路
- `toeic.circom` - TOEIC 証明回路
- `degree.circom` - 学位証明回路

コンパイル結果は `zkp/build/` ディレクトリに生成されます：

- `*.wasm` - WebAssembly ファイル
- `*.r1cs` - R1CS ファイル（制約システム）

### 3. 信頼設定（Trusted Setup）を実行

```bash
npm run setup
```

これにより、以下のファイルが生成されます：

- `*.zkey` - 証明鍵（Proving Key）
- `*.vkey.json` - 検証鍵（Verification Key）

**注意**: このスクリプトは開発用の簡易版です。実際のプロダクション環境では、適切な信頼設定セレモニーを実施する必要があります。

### 4. ビルド結果をフロントエンドに配置

フロントエンドから ZKP ファイルにアクセスできるように、ビルド結果を `frontend/public/zkp/build/` にコピーします：

```bash
# プロジェクトルートから実行
mkdir -p frontend/public/zkp/build
cp zkp/build/*.wasm frontend/public/zkp/build/
cp zkp/build/*.zkey frontend/public/zkp/build/
cp zkp/build/*.vkey.json frontend/public/zkp/build/
```

または、シンボリックリンクを作成：

```bash
# macOS/Linuxの場合
ln -s ../../../zkp/build frontend/public/zkp/build
```

### 5. フロントエンドの依存関係をインストール

```bash
cd frontend
npm install
```

`snarkjs`が`package.json`に含まれていることを確認してください。

### 6. 開発サーバーを起動

```bash
cd frontend
npm run dev
```

## 一括セットアップスクリプト

以下のコマンドで一括セットアップできます：

```bash
# プロジェクトルートから実行
cd zkp && npm install && npm run build:all && cd ..
mkdir -p frontend/public/zkp/build
cp zkp/build/*.wasm frontend/public/zkp/build/ 2>/dev/null || true
cp zkp/build/*.zkey frontend/public/zkp/build/ 2>/dev/null || true
cp zkp/build/*.vkey.json frontend/public/zkp/build/ 2>/dev/null || true
cd frontend && npm install
```

## 動作確認

1. フロントエンドを起動: `cd frontend && npm run dev`
2. ブラウザで `http://localhost:5173` にアクセス
3. 学生としてログイン
4. 「VC 管理とゼロ知識証明」ページに移動
5. VC 管理タブで、マイナンバー VC、TOEIC VC、学位 VC を追加
6. ゼロ知識証明タブで：
   - VC を選択
   - 条件を設定（最小年齢、最小 TOEIC スコア、最小 GPA）
   - 開示オプションを選択
   - 「ゼロ知識証明を生成」をクリック

## トラブルシューティング

### エラー: "Failed to fetch wasm file"

- `frontend/public/zkp/build/` に `.wasm` ファイルが存在するか確認
- ブラウザの開発者ツールの Network タブで、ファイルが正しく読み込まれているか確認

### エラー: "Failed to generate proof"

- 回路が正しくコンパイルされているか確認（`zkp/build/` にファイルが存在するか）
- ブラウザのコンソールでエラーメッセージを確認
- `snarkjs`が正しくインストールされているか確認

### 証明生成に時間がかかる

- ブラウザでの証明生成は数秒から数十秒かかる場合があります
- これは正常な動作です

## ファイル構造

セットアップ完了後のファイル構造：

```
career-passport/
├── zkp/
│   ├── build/
│   │   ├── age.wasm
│   │   ├── age.zkey
│   │   ├── age.vkey.json
│   │   ├── toeic.wasm
│   │   ├── toeic.zkey
│   │   ├── toeic.vkey.json
│   │   ├── degree.wasm
│   │   ├── degree.zkey
│   │   └── degree.vkey.json
│   └── ...
└── frontend/
    ├── public/
    │   └── zkp/
    │       └── build/  (zkp/build/へのシンボリックリンクまたはコピー)
    └── ...
```

## 注意事項

1. **信頼設定**: 実際のプロダクション環境では、適切な信頼設定セレモニーを実施する必要があります
2. **セキュリティ**: `.zkey`ファイルは秘密鍵を含むため、適切に管理してください
3. **パフォーマンス**: ブラウザでの証明生成は時間がかかる可能性があります
4. **ファイルサイズ**: `.wasm`と`.zkey`ファイルは大きいため、初回読み込みに時間がかかる場合があります
