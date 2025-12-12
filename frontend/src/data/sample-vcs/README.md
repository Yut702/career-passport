# サンプル VC（Verifiable Credential）ファイル

このディレクトリには、求人・採用機能で使用するサンプル VC ファイルが含まれています。

## ファイル構成

### ユーザー（学生）向け VC

**学生 1（東京大学）の VC セット:**

- `student-1-mynumber.json`: マイナンバーカード VC
- `student-1-degree.json`: 学位証明書 VC
- `student-1-toeic.json`: TOEIC 証明書 VC
- `student-1-certification.json`: 基本情報技術者資格 VC

**学生 2（早稲田大学）の VC セット:**

- `student-2-mynumber.json`: マイナンバーカード VC
- `student-2-degree.json`: 学位証明書 VC
- `student-2-toeic.json`: TOEIC 証明書 VC
- `student-2-aws.json`: AWS 認定資格 VC

**学生 3（慶應義塾大学）の VC セット:**

- `student-3-mynumber.json`: マイナンバーカード VC
- `student-3-degree.json`: 学位証明書 VC
- `student-3-toeic.json`: TOEIC 証明書 VC
- `student-3-certification.json`: 応用情報技術者資格 VC

**学生 4（京都大学）の VC セット:**

- `student-4-mynumber.json`: マイナンバーカード VC
- `student-4-degree.json`: 学位証明書 VC
- `student-4-toeic.json`: TOEIC 証明書 VC
- `student-4-certification.json`: Oracle 認定 Java SE 資格 VC
- `student-4-aws.json`: AWS 認定クラウドプラクティショナー資格 VC

**学生 5（大阪大学）の VC セット:**

- `student-5-mynumber.json`: マイナンバーカード VC
- `student-5-degree.json`: 学位証明書 VC
- `student-5-toeic.json`: TOEIC 証明書 VC
- `student-5-certification.json`: 基本情報技術者資格 VC
- `student-5-certification-2.json`: 応用情報技術者資格 VC

**学生 6（一橋大学）の VC セット:**

- `student-6-mynumber.json`: マイナンバーカード VC
- `student-6-degree.json`: 学位証明書 VC
- `student-6-toeic.json`: TOEIC 証明書 VC
- `student-6-certification.json`: 統計検定 2 級資格 VC

### 企業向け VC

- `org-vc-1.json`: 株式会社テックの企業プロフィール
- `org-vc-2.json`: 株式会社スタートアップの企業プロフィール
- `org-vc-3.json`: 株式会社クラウドの企業プロフィール
- `org-vc-4.json`: 株式会社データサイエンスの企業プロフィール
- `org-vc-5.json`: 株式会社セキュリティの企業プロフィール
- `org-vc-6.json`: 株式会社モバイルの企業プロフィール

## VC の使用方法

1. **ユーザー側**:

   - 複数の VC（学位、スキル、資格、TOEIC、インターンシップなど）を読み込む
   - 求人条件設定時に、これらの VC を組み合わせて条件を設定
   - ZKP（ゼロ知識証明）を生成して、個人情報を開示せずに条件を満たすことを証明

2. **企業側**:

   - 採用条件設定時に、企業 VC を読み込んで条件を設定
   - 学生の複数の VC に基づいてマッチング条件を設定

3. **マッチング**:
   - 学生の複数の VC に基づいて ZKP（ゼロ知識証明）を生成
   - 企業の条件と照合して、条件を満たす求人・人材を検索
   - 個人情報を開示せずにマッチングが可能

## VC の構造

各 VC には以下の情報が含まれます：

### ユーザー VC の種類

各学生は複数の正式な証明書 VC を持ちます：

1. **マイナンバーカード VC** (`myNumber`)

   - 発行者: デジタル庁
   - 内容: 名前、生年月日、住所、国籍
   - 用途: ZKP で年齢条件などを証明（個人情報は開示しない）

2. **学位証明書 VC** (`degree`)

   - 発行者: 大学
   - 内容: 大学名、専攻、学位、卒業年、GPA
   - 用途: 学歴条件の証明

3. **TOEIC 証明書 VC** (`toeic`)

   - 発行者: TOEIC 運営委員会
   - 内容: スコア、リスニング/リーディングスコア、受験日、試験会場
   - 用途: ZKP でスコア条件を証明（実際のスコアは開示しない場合もある）

4. **資格証明書 VC** (`certification`)
   - 発行者: 各種資格機関（IPA、AWS、Oracle など）
   - 内容: 資格名、発行機関、発行日、資格番号、有効期限
   - 用途: 資格条件の証明

### VC と NFT の違い

詳細は `VC_AND_NFT_DIFFERENCE.md` を参照してください。

**要点:**

- **VC**: ローカル保存、個人情報、ZKP で選択的開示
- **NFT**: ブロックチェーン公開、最小限の情報、そのまま見せる

### 企業 VC

- 企業名、業界、所在地、従業員数
- 設立年、事業内容
- 必須スキル、歓迎スキル
- 勤務形態、給与範囲、福利厚生

## 注意事項

- これらはサンプルデータです
- 実際の実装では、信頼できる発行者（教育機関、法人登記機関など）が発行した VC を使用します
- VC は検証可能な証明書であり、改ざん防止のための署名が含まれます
