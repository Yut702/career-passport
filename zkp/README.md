# ZKP Circuits for Career Passport

このディレクトリには、circomとZKPlonKを使用したゼロ知識証明回路が含まれています。

## ディレクトリ構造

```
zkp/
├── circuits/          # circom回路ファイル
│   ├── age.circom    # 年齢証明回路
│   ├── toeic.circom  # TOEICスコア証明回路
│   └── composite.circom  # 複合証明回路
├── build/            # コンパイル結果（.wasm, .r1cs, .zkey, .vkey.json）
├── scripts/          # ビルドスクリプト
│   ├── compile.js    # 回路コンパイル
│   ├── setup.js      # 信頼設定（Trusted Setup）
│   └── test.js       # テストスクリプト
└── src/              # JavaScript実装
```

## セットアップ

### 1. 依存関係のインストール

```bash
cd zkp
npm install
```

### 2. 回路のコンパイル

```bash
npm run compile
```

これにより、`circuits/`内のすべての`.circom`ファイルがコンパイルされ、`build/`ディレクトリに`.wasm`と`.r1cs`ファイルが生成されます。

### 3. 信頼設定（Trusted Setup）

```bash
npm run setup
```

これにより、証明鍵（`.zkey`）と検証鍵（`.vkey.json`）が生成されます。

**注意**: このスクリプトは簡易版です。実際のプロダクション環境では、適切な信頼設定セレモニーを実施する必要があります。

### 4. すべてを一度にビルド

```bash
npm run build:all
```

## 回路の説明

### age.circom
生年月日から年齢を計算し、最小年齢条件を満たすことを証明します。

**入力**:
- 秘密入力: 生年月日（年、月、日）
- 公開入力: 現在日付（年、月、日）、最小年齢

**出力**:
- 計算された年齢
- 条件を満たしているかどうか（1 or 0）

### toeic.circom
TOEICスコアが最小スコア以上であることを証明します（実際のスコアは非開示）。

**入力**:
- 秘密入力: TOEICスコア
- 公開入力: 最小スコア

**出力**:
- 条件を満たしているかどうか（1 or 0）

### composite.circom
複数の条件を同時に証明します（年齢 + TOEICスコアなど）。

**入力**:
- 年齢関連の入力（age.circomと同じ）
- TOEIC関連の入力（toeic.circomと同じ）

**出力**:
- 各条件を満たしているかどうか
- すべての条件を満たしているかどうか

## 使用方法

フロントエンドから使用する場合は、`frontend/src/lib/zkp/`内のJavaScript実装を参照してください。

## 注意事項

1. **信頼設定**: 実際のプロダクション環境では、適切な信頼設定セレモニーを実施する必要があります。
2. **セキュリティ**: 秘密鍵や証明鍵は適切に管理してください。
3. **パフォーマンス**: ブラウザでの証明生成は時間がかかる可能性があります。

