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

## ステータス

β版開発中(フェーズ1:自分用MVP)
