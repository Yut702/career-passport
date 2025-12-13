# VC（Verifiable Credential）フォーマットガイド

## 現在の状況

現在のVCファイルは**簡易形式**を使用しており、W3C Verifiable Credentials標準規格に完全に準拠していません。

## W3C標準規格との違い

### 簡易形式（現在の形式）

```json
{
  "id": "vc_student_1_mynumber",
  "type": "myNumber",
  "issuer": "デジタル庁",
  "issuedAt": "2024-01-10T00:00:00.000Z",
  "attributes": {
    "name": "山田 太郎",
    "dateOfBirth": "2000-05-15"
  },
  "verified": true,
  "description": "マイナンバーカードVC（サンプル）"
}
```

### W3C標準形式

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.w3.org/2018/credentials/examples/v1"
  ],
  "type": ["VerifiableCredential", "MyNumberCredential"],
  "id": "vc_student_1_mynumber",
  "issuer": {
    "id": "https://www.digital.go.jp",
    "name": "デジタル庁"
  },
  "issuanceDate": "2024-01-10T00:00:00.000Z",
  "credentialSubject": {
    "id": "did:example:student1",
    "name": "山田 太郎",
    "dateOfBirth": "2000-05-15"
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2024-01-10T00:00:00.000Z",
    "verificationMethod": "https://example.com/keys/1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z..."
  }
}
```

## 主な違い

| 項目 | 簡易形式 | W3C標準形式 |
|------|---------|------------|
| コンテキスト | なし | `@context`（必須） |
| タイプ | 文字列 | 配列（`["VerifiableCredential", "具体的なタイプ"]`） |
| 発行者 | 文字列 | オブジェクト（`{id, name}`） |
| 発行日 | `issuedAt` | `issuanceDate` |
| データ | `attributes` | `credentialSubject` |
| 証明 | なし | `proof`（推奨） |

## 変換ユーティリティ

`frontend/src/lib/vc/converter.js`に変換ユーティリティを用意しました：

- `convertToW3CFormat()`: 簡易形式 → W3C標準形式
- `convertFromW3CFormat()`: W3C標準形式 → 簡易形式
- `isW3CFormat()`: W3C標準形式かどうかをチェック
- `normalizeVC()`: VCを標準化

## 移行方法

### オプション1: 簡易形式のまま使用（現在の実装）

- メリット: シンプルで理解しやすい
- デメリット: 標準規格に準拠していない

### オプション2: W3C標準形式に移行

1. 既存のVCファイルをW3C標準形式に変換
2. `converter.js`を使用して読み込み時に簡易形式に変換（後方互換性）
3. または、アプリケーション全体でW3C標準形式を使用

## 推奨事項

開発段階では簡易形式を使用し、将来的にW3C標準形式に移行することを推奨します。

W3C標準形式のサンプルファイル：
- `student-1-mynumber-w3c.json`
- `student-1-toeic-w3c.json`
- `student-1-degree-w3c.json`

