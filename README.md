# Career Passport
## 東京大学 ブロックチェーンイノベーション寄附講座  
### MOFグループリポジトリ

---

## フロントエンド（React）

### パッケージ復元
```bash
cd frontend
npm install
```

### サーバー起動
```bash
cd frontend
npm start
npm run dev
```

### 機能
- React Routerを使用したルーティング (`/org-login` など)
- 組織ログイン/登録UI

### 依存
- `react-router-dom`: ルーティング
- その他: `package.json`参照

---

## バックエンド（Node.js）

### パッケージ復元
```bash
cd backend
npm install
```

### サーバー起動
```bash
cd backend
npm start
# または
node app.js
npm run dev
```

### 機能
- Express + JWT認証 + bcryptパスワードハッシュ
- DynamoDB Local (Docker) 連携

### セットアップ（開発用）
ローカルで動かすための最小手順
```bash
# 1. 環境変数をコピーして編集
cd backend
cp .env.example .env

# 2. DynamoDB Local を Docker で起動（初回のみ）
docker run -d -p 8000:8000 amazon/dynamodb-local
# データが消えないように起動するためのスクリプト
docker run -d \
  --name dynamodb \
  -p 8000:8000 \
  -v $(pwd)/dynamodb/data:/home/dynamodblocal/data \
  amazon/dynamodb-local \
  -jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data


# 3. テーブルを作成し、初期データを投入
npm run create-table
npm run seed

# 4. サーバー起動
npm start
```


### APIエンドポイント
- `POST /api/org/register`: 組織ユーザー登録 (email, password, name)
- `POST /api/org/login`: ログイン (JWTトークン返却)
- `GET /api/org/me`: ユーザー情報取得 (トークン認証必須)
