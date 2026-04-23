# AllIn Note

AIが書いてくれる、教室のカルテと連絡ノート。

AllIn Note は、レッスン中の会話を録音するだけで、
AIが自動で要約・カルテ化し、講師と生徒(保護者)
それぞれに最適化された情報を届けるSaaSです。

## セットアップ

```sh
npm install
cp .env.local.example .env.local  # 環境変数を設定
npm run dev
```

## 技術スタック

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (DB + Auth)
- Cloudflare R2 (音声ストレージ)
- OpenAI (Whisper + GPT-4o)

## DBマイグレーション

Supabaseダッシュボードで実行する場合:

1. Supabaseダッシュボード → SQL Editor
2. New query
3. `supabase/migrations/20260424000000_initial_schema.sql` の中身をコピペ
4. Run
5. 次に `supabase/seed.sql` の中身をコピペして Run

注意:

- RLSポリシーはフェーズ1のモック認証では効かないため、開発中はRLSバイパスのservice_roleキーを使う
- `seed.sql` の `auth.users` への直接INSERTは本番環境では行わない
- マイグレーションファイルは作成のみで、実行は手動で行う

## ステータス

β版開発中(フェーズ1:自分用MVP)
