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
9. 次に `supabase/migrations/20260427010000_add_summary_edit_tracking.sql` の中身をコピペ
10. Run
11. 次に `supabase/migrations/20260427020000_add_schools.sql` の中身をコピペ
12. Run
13. 次に `supabase/migrations/20260427030000_add_booking_system.sql` の中身をコピペ
14. Run
15. 最後に `supabase/seed.sql` の中身をコピペして Run

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

## 生徒向け要約の編集機能の確認

1. Supabase SQL Editor で `supabase/migrations/20260427010000_add_summary_edit_tracking.sql` を実行
2. `npm run dev` を再起動
3. 講師モックで `/dashboard` から未送信のレッスンを開く
4. 「修正が必要な場合は、こちら」をクリック
5. 1回目の確認ダイアログで「編集を続ける」を選ぶ
6. 要約項目を編集し、「変更を保存」を押す
7. 2回目の確認ダイアログで変更内容のサマリを確認して「更新する」を押す
8. 編集回数と最終編集日時が更新されることを確認
9. 送信済みレッスンでは要約編集リンクが表示されないことを確認

## 教室管理機能の確認

1. Supabase SQL Editor で `supabase/migrations/20260427020000_add_schools.sql` を実行
2. `.env.local` で `NEXT_PUBLIC_MOCK_ROLE=school_owner` に変更
3. `npm run dev` を再起動
4. `/schools` にアクセス
5. 「新しい教室を追加」から教室を作成
6. 教室詳細画面で生徒数・講師数・今月のレッスン数を確認
7. `/schools/[schoolId]/teachers` と `/schools/[schoolId]/students` を開く
8. `NEXT_PUBLIC_MOCK_ROLE=teacher` に戻して、既存の録音・要約機能が動くことを確認

既存の開発データを教室管理に紐付けるための SQL:

```sql
INSERT INTO schools (name, owner_id)
VALUES ('開発用教室', '[MOCK_USER_ID]');

INSERT INTO school_teachers (school_id, teacher_id, role)
VALUES ('[作ったschool_id]', '[MOCK_USER_ID]', 'owner');

UPDATE students
SET school_id = '[作ったschool_id]'
WHERE teacher_id = '[MOCK_USER_ID]';
```

## 場所・キャンセルポリシーつき予約機能の確認

1. Supabase SQL Editor で `supabase/migrations/20260427030000_add_booking_system.sql` を実行
2. オーナーモックで `/schools` → 対象教室を開く
3. 場所設定で `場所管理を有効にする` をオンにして保存
4. キャンセルポリシーで期限と `消化扱い / キャンセル不可` を設定
5. `エリアを追加` から、たとえば `新宿`, `渋谷` を登録
6. `場所を追加` から、`ルーム1`, `山田さん宅`, `佐藤さん宅`, `鈴木さん宅` などを登録
7. 講師モックで `/reservations/new` にアクセスし、共通予約フローで予約を作成
8. バッファ確認例:
   - `山田さん宅 9:00-10:00`
   - `佐藤さん宅 10:30` は同エリア30分バッファなら予約可能
   - `佐藤さん宅 10:00` は候補に出ない
   - `鈴木さん宅 11:00` は別エリア60分バッファなら予約可能
   - `鈴木さん宅 10:30` は候補に出ない
9. 生徒モックで `/student/reservations/new` にアクセスし、同じフローで予約できることを確認
10. 生徒モックの `/student/dashboard` で `今後の予約` と `キャンセル` を確認
11. 期限後に `consume` なら `当日消化`、`no_cancel` ならエラーメッセージになることを確認

既存データに学校・場所を紐付けるための例:

```sql
INSERT INTO schools (name, owner_id)
VALUES ('開発用教室', '[MOCK_USER_ID]');

INSERT INTO school_teachers (school_id, teacher_id, role)
VALUES ('[作ったschool_id]', '[MOCK_USER_ID]', 'owner');

UPDATE students
SET school_id = '[作ったschool_id]'
WHERE teacher_id = '[MOCK_USER_ID]';
```

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
