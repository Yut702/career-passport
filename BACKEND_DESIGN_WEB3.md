# Backend Web3設計書（Miyamoto-branch）

## 概要

Web3プライバシー設計に基づく、ウォレット認証とメタデータ管理の統合バックエンド設計。

---

## 1. データベース設計（DynamoDB）

### 1.1 Users テーブル

**目的**: ウォレットアドレスとユーザータイプの管理

```
テーブル名: NonFungibleCareerUsers
PK: walletAddress (String)

フィールド:
- walletAddress (PK): "0x..." | 必須
- userType (String): "student" | "organization" | 必須
- organizationName (String): 組織名 | org用
- organizationAddress (String): 組織のウォレット（複数管理用）
- createdAt (String): ISO8601形式
- updatedAt (String): ISO8601形式
- metadata (Map): 拡張用フィールド

インデックス: なし（walletAddressで十分）
```

### 1.2 Stamps テーブル

**目的**: ブロックチェーン側のスタンプIDとDB側の連携

```
テーブル名: NonFungibleCareerStamps
PK: stampId (String)

フィールド:
- stampId (PK): BC上のスタンプID
- userWalletAddress (String): ユーザーのウォレット | GSI
- organizationAddress (String): 企業のウォレット | GSI
- category (String): カテゴリ
- metadataUri (String): DB参照ポイント（stamps_metadataへのリンク）
- timestamp (Number): BC側のtimestamp
- createdAt (String): DB作成日時

GSI:
- UserWalletIndex: userWalletAddress
- OrganizationIndex: organizationAddress
```

### 1.3 StampsMetadata テーブル

**目的**: スタンプの詳細情報（画像・説明）管理

```
テーブル名: NonFungibleCareerStampsMetadata
PK: stampId (String)

フィールド:
- stampId (PK): スタンプID（FK → Stamps.stampId）
- imageUrl (String): 画像URL（CloudFront/S3）
- description (String): 説明テキスト
- certificateCategory (String): 証明書カテゴリ
- issuerName (String): 発行元名
- issuedDate (String): 発行日
- updatedAt (String): 更新日時
```

### 1.4 NFTs テーブル

**目的**: ブロックチェーン側のNFTとDB側の連携

```
テーブル名: NonFungibleCareerNFTs
PK: tokenId (Number)

フィールド:
- tokenId (PK): BC上のNFT ID
- ownerWalletAddress (String): オーナーのウォレット | GSI
- organizationAddress (String): 発行元企業 | GSI
- contractAddress (String): NFTコントラクトアドレス
- metadataUri (String): DB参照ポイント（nfts_metadataへのリンク）
- acquiredAt (Number): BC側のtimestamp
- transactionHash (String): Mint時のtxハッシュ
- createdAt (String): DB作成日時

GSI:
- OwnerIndex: ownerWalletAddress
- OrganizationIndex: organizationAddress
```

### 1.5 NFTsMetadata テーブル

**目的**: NFTの詳細メタデータ管理

```
テーブル名: NonFungibleCareerNFTsMetadata
PK: tokenId (Number)

フィールド:
- tokenId (PK): NFT ID（FK → NFTs.tokenId）
- imageUrl (String): NFT画像URL
- displayName (String): 表示名
- description (String): 説明
- certificateCategory (String): 証明書カテゴリ（基本NFT、起業NFT等）
- rarity (String): レアリティ（Common, Rare, Epic, Legendary）
- organizationsList (List): 関連企業リスト
- stampIds (List): 組み合わせたスタンプID
- updatedAt (String): 更新日時
```

### 1.6 Events テーブル

**目的**: セミナー・イベント実績管理

```
テーブル名: NonFungibleCareerEvents
PK: eventId (String)

フィールド:
- eventId (PK): イベントID
- organizationAddress (String): 開催企業 | GSI
- eventName (String): イベント名
- eventDescription (String): イベント説明
- eventDate (String): 開催日（ISO8601）
- location (String): 開催場所
- imageUrl (String): イベント画像
- maxParticipants (Number): 最大参加者数
- currentParticipants (Number): 現在の参加者数
- status (String): "planning" | "ongoing" | "completed"
- nftReward (String): このイベントで獲得できるNFT
- createdAt (String): 作成日時
- updatedAt (String): 更新日時

GSI:
- OrganizationIndex: organizationAddress
- StatusIndex: status
```

### 1.7 EventParticipants テーブル

**目的**: イベント参加者管理（個人情報非保存）

```
テーブル名: NonFungibleCareerEventParticipants
PK: eventId + participantAddress (複合キー)

フィールド:
- eventId (PK-1): イベントID
- participantWalletAddress (PK-2): 参加者のウォレット
- joinDate (String): 参加日時
- status (String): "registered" | "attended" | "completed"
- stampAwarded (Boolean): スタンプが付与されたか
```

### 1.8 Messages テーブル

**目的**: ユーザー間のメッセージ管理（VC選択的開示）

```
テーブル名: NonFungibleCareerMessages
PK: messageId (String)
SK: createdAt (String)

フィールド:
- messageId (PK): メッセージID
- senderWalletAddress (String): 送信者 | GSI
- recipientWalletAddress (String): 受信者 | GSI
- threadId (String): スレッドID（会話グループ化用）
- messageBody (String): メッセージ本文
- vcClaimShared (Map): 開示されたVC情報
- createdAt (String): 作成日時

GSI:
- SenderIndex: senderWalletAddress
- RecipientIndex: recipientWalletAddress
- ThreadIndex: threadId
```

---

## 2. API設計

### 2.1 認証API

#### POST /api/auth/verify-wallet
ウォレット認証（署名検証）

**リクエスト:**
```json
{
  "walletAddress": "0x...",
  "signature": "0x...",
  "message": "Sign this message to authenticate"
}
```

**レスポンス:**
```json
{
  "token": "jwt-token",
  "user": {
    "walletAddress": "0x...",
    "userType": "student|organization",
    "organizationName": "..."
  }
}
```

#### GET /api/auth/user-profile/:walletAddress
ユーザープロフィール取得

**レスポンス:**
```json
{
  "walletAddress": "0x...",
  "userType": "student|organization",
  "organizationName": "...",
  "createdAt": "2025-12-11T..."
}
```

---

### 2.2 スタンプAPI

#### POST /api/stamps/issue
スタンプ発行（DB+BC同期）

**リクエスト:**
```json
{
  "userWalletAddress": "0x...",
  "organizationAddress": "0x...",
  "category": "internship",
  "imageUrl": "https://...",
  "description": "description",
  "certificateCategory": "internship"
}
```

**プロセス:**
1. stamps_metadata に保存
2. Stamps テーブルに記録
3. metadataUri を生成: `{API_URL}/api/stamps/metadata/{stampId}`
4. SC呼び出し
5. スタンプID返却

**レスポンス:**
```json
{
  "stampId": "stamp_...",
  "metadataUri": "https://api/stamps/metadata/stamp_...",
  "transactionHash": "0x..."
}
```

#### GET /api/stamps/user/:walletAddress
ユーザーのスタンプ一覧

**レスポンス:**
```json
{
  "stamps": [
    {
      "stampId": "stamp_...",
      "category": "internship",
      "imageUrl": "https://...",
      "description": "...",
      "issuerName": "...",
      "timestamp": 1702300000
    }
  ]
}
```

#### GET /api/stamps/metadata/:stampId
スタンプメタデータ取得

**レスポンス:**
```json
{
  "stampId": "stamp_...",
  "imageUrl": "https://...",
  "description": "...",
  "certificateCategory": "internship"
}
```

---

### 2.3 NFT API

#### POST /api/nfts/mint-from-stamps
スタンプ3つからNFT生成

**リクエスト:**
```json
{
  "ownerWalletAddress": "0x..."
}
```

**プロセス:**
1. DBでスタンプ数確認（>= 3）
2. nfts_metadata 作成
3. SC呼び出し（tokenUri付き）
4. NFTs テーブルに記録

**レスポンス:**
```json
{
  "tokenId": 123,
  "metadataUri": "https://api/nfts/metadata/123",
  "transactionHash": "0x..."
}
```

#### GET /api/nfts/user/:walletAddress
ユーザーのNFT一覧

**レスポンス:**
```json
{
  "nfts": [
    {
      "tokenId": 123,
      "displayName": "...",
      "imageUrl": "https://...",
      "description": "...",
      "rarity": "Common",
      "acquiredAt": 1702300000
    }
  ]
}
```

#### GET /api/nfts/metadata/:tokenId
NFTメタデータ取得

**レスポンス:**
```json
{
  "tokenId": 123,
  "imageUrl": "https://...",
  "displayName": "...",
  "description": "...",
  "certificateCategory": "...",
  "rarity": "Common"
}
```

---

### 2.4 イベントAPI

#### GET /api/events
イベント一覧

**レスポンス:**
```json
{
  "events": [
    {
      "eventId": "event_...",
      "eventName": "...",
      "eventDate": "2025-12-20",
      "location": "Tokyo",
      "maxParticipants": 50,
      "currentParticipants": 35,
      "imageUrl": "https://..."
    }
  ]
}
```

#### POST /api/events/:eventId/participant-joined
参加者追加

**リクエスト:**
```json
{
  "participantWalletAddress": "0x..."
}
```

#### GET /api/events/:eventId/details
イベント詳細

**レスポンス:**
```json
{
  "eventId": "event_...",
  "eventName": "...",
  "eventDate": "2025-12-20",
  "location": "Tokyo",
  "description": "...",
  "maxParticipants": 50,
  "currentParticipants": 35
}
```

---

### 2.5 メッセージAPI

#### POST /api/messages/send
メッセージ送信（VC選択的開示）

**リクエスト:**
```json
{
  "senderWalletAddress": "0x...",
  "recipientWalletAddress": "0x...",
  "messageBody": "...",
  "vcClaimShared": {}
}
```

#### GET /api/messages/thread/:recipientWalletAddress
スレッド取得

**レスポンス:**
```json
{
  "messages": [
    {
      "messageId": "msg_...",
      "senderWalletAddress": "0x...",
      "messageBody": "...",
      "vcClaimShared": {},
      "createdAt": "2025-12-11T..."
    }
  ]
}
```

---

## 3. Web3連携フロー

### 3.1 スタンプ発行フロー

```
1. フロント（UI）
   ウォレット接続完了 → スタンプ発行画面

2. フロント → バックエンド
   POST /api/stamps/issue
   {
     userWalletAddress,
     organizationAddress,
     category,
     imageUrl,
     description
   }

3. バックエンド処理
   a. stamps_metadata保存
   b. Stamps テーブルに記録
   c. metadataUri生成
   d. Web3: SC呼び出し
      StampManager.issueStamp(
        user,
        organization,
        category,
        metadataUri
      )

4. BC記録（改ざん防止）
   Stamp {
     id: stampId
     user: 0x...
     organization: 0x...
     category: "internship"
     metadataUri: "https://api/stamps/metadata/stampId"
     timestamp: ...
   }

5. フロント表示
   a. BC から stampId, category, timestamp取得
   b. DB から imageUrl, description取得
   c. 統合表示
```

### 3.2 NFT生成フロー

```
1. ユーザーがスタンプ3つを集める

2. フロント → バックエンド
   POST /api/nfts/mint-from-stamps
   { ownerWalletAddress }

3. バックエンド確認
   a. Stampsテーブルで count(stampId) >= 3
   b. BC で確認（二重確認）

4. NFTメタデータ作成
   a. nfts_metadata保存
   b. NFTs テーブルに記録

5. Web3: SC呼び出し
   CareerPassportNFT.mint(
     ownerAddress,
     tokenUri,
     name,
     rarity,
     organizations
   )

6. BC記録
   NFT {
     tokenId: 123
     owner: 0x...
     organization: 0x...
     tokenUri: "https://api/nfts/metadata/123"
     timestamp: ...
   }
```

---

## 4. 実装スケジュール

### Phase 1: 基盤構築（優先度: 高）
- [ ] DynamoDBテーブル作成スクリプト
- [ ] Usersテーブル管理ライブラリ
- [ ] ウォレット認証API（verify-wallet）
- [ ] ユーザープロフィール取得API

### Phase 2: スタンプ・NFT管理（優先度: 高）
- [ ] Stamps/StampsMetadataテーブル管理
- [ ] スタンプ発行API
- [ ] NFTs/NFTsMetadataテーブル管理
- [ ] NFT生成API

### Phase 3: イベント管理（優先度: 中）
- [ ] Eventsテーブル管理
- [ ] イベント管理API
- [ ] 参加者管理API

### Phase 4: 拡張機能（優先度: 低）
- [ ] メッセージAPI
- [ ] マッチング検索
- [ ] ZKP実装

---

## 5. 注意点

### セキュリティ
- ✅ 個人情報はDB保存しない（ウォレットアドレスのみ）
- ✅ VC/ZKPで必要情報は選択的に開示
- ✅ メッセージ送信時にVC情報のみ共有

### スケーラビリティ
- ✅ DynamoDBのGSI活用（複数クエリ効率化）
- ✅ metadataUri で BC/DB分離（処理最適化）

### 互換性
- ⚠️ hiraブランチとは認証方式が異なる
- ⚠️ マージ時に認証レイヤーの調整が必要
