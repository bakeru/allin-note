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
5. 次に `supabase/migrations/20260424120000_add_reservations.sql` の中身をコピペ
6. Run
7. 次に `supabase/migrations/20260427000000_add_teacher_message.sql` の中身をコピペ
8. Run
9. 最後に `supabase/seed.sql` の中身をコピペして Run

注意:

- RLSポリシーはフェーズ1のモック認証では効かないため、開発中はRLSバイパスのservice_roleキーを使う
- `seed.sql` の `auth.users` への直接INSERTは本番環境では行わない
- マイグレーションファイルは作成のみで、実行は手動で行う

## 予約機能の動作確認

1. Supabase SQL Editor で `supabase/migrations/20260424120000_add_reservations.sql` を実行
2. `npm run dev` を再起動
3. `/reservations` にアクセス
4. 「新しい予約を追加」から、生徒・日時・所要時間を設定して保存
5. `/record` にアクセス
6. 当日の予約一覧から、対象の予約で「このレッスンを録音開始」を押す
7. 録音してアップロードまで進める
8. Supabaseの `reservations` テーブルで `status` が `completed` になっていることを確認
9. `lessons` テーブルで `reservation_id` が入っていることを確認

## 講師メッセージ機能の確認

1. Supabase SQL Editor で `supabase/migrations/20260427000000_add_teacher_message.sql` を実行
2. `npm run dev` を再起動
3. 講師モックで `/dashboard` にアクセス
4. 未送信のレッスンから「編集する」を開く
5. 「先生からのメッセージ」を入力して「一旦保存」または「保存して送信」を押す
6. `/dashboard` へ戻り、未送信/最近送信したレッスンの表示が変わることを確認
7. 生徒モックで `/student/dashboard` → レッスン詳細を開き、メッセージが表示されることを確認

## 録音アップロード確認

開発用の生徒レコードをSupabaseのSQL Editorで作成します。
`[YOUR_MOCK_USER_ID]` は `.env.local` の `MOCK_USER_ID` に置き換えてください。

```sql
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'dev-student@example.com',
  '',
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, role, display_name)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'dev-student@example.com',
  'student',
  '開発用生徒'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO students (user_id, teacher_id, start_date, status, notes)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '[YOUR_MOCK_USER_ID]',
  CURRENT_DATE,
  'active',
  '開発用のテスト生徒'
) ON CONFLICT (user_id) DO NOTHING;
```

`.env.local` に設定します:

```sh
NEXT_PUBLIC_DEV_STUDENT_ID=00000000-0000-0000-0000-000000000002
```

動作確認:

1. `.env.local` に `NEXT_PUBLIC_DEV_STUDENT_ID` を設定
2. `npm run dev` で起動
3. `/record` にアクセス
4. 録音開始→停止
5. 自動でアップロード開始
6. 成功メッセージを確認
7. Supabaseの Table Editor で `lessons` テーブルにレコードが追加されたことを確認
8. Cloudflare R2の `allin-note-audio` バケットにファイルが追加されたことを確認

注意:

- 開発中はRLSバイパスの `SUPABASE_SECRET_KEY` を使って `lessons` に保存する
- 90分録音は40MB前後になる想定のため、デプロイ先のリクエストサイズ制限を確認する
- R2アップロード後の文字起こし・要約・DBステータス更新は別タスクで実装する

## ステータス

β版開発中(フェーズ1:自分用MVP)
