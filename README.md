# ぬいぐるみ原価計算

キャラクターごとに、日本販売・中国販売の原価と利益を試算する社内ツールです。
Firebase Hosting で公開し、見積もりは Cloud Firestore に保存します。

サイトの URL を開いた人は、だれでも閲覧・編集できます（ログインや合言葉はありません）。
URL は社内の人にだけ伝えてください。検索エンジンには載らない設定にしています。

## ファイル構成

| ファイル | 内容 |
|---|---|
| `public/index.html` | サイト本体（画面・計算・保存） |
| `public/firebase-config.js` | Firebase の接続設定（初回に値を貼り付ける） |
| `firestore.rules` | データベースの読み書きルール |
| `firebase.json` | 公開とルールの設定 |
| `.firebaserc` | 使う Firebase プロジェクトの ID |

## 初回の準備

### 1. Firebase プロジェクトを作る

1. https://console.firebase.google.com/ で「プロジェクトを追加」を押し、名前を付けて作成します（例：`inclue-genka`）。
   無料の Spark プランで動きます。
2. 左メニューの「構築 → Firestore Database」で「データベースを作成」を押します。
   - ロケーション：`asia-northeast1（東京）`
   - モード：「本番環境モード」
3. 「プロジェクトの設定（歯車）→ 全般 → マイアプリ」で、ウェブアプリ（`</>`）を追加します。
   表示された `firebaseConfig` の値を、`public/firebase-config.js` の該当する欄に貼り付けます。
4. `.firebaserc` の `YOUR_FIREBASE_PROJECT_ID` を、作ったプロジェクトの ID に書き換えます。

### 2. 公開する

パソコンに Node.js が入っている前提です。

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

`firebase deploy` で、サイトの公開とデータベースのルール設定が一度に行われます。
完了すると `https://<プロジェクトID>.web.app` で開けるようになります。

### 3. 独自ドメインをつなぐ

1. Firebase コンソールの「構築 → Hosting」で「カスタムドメインを追加」を押し、使うドメインを入力します（例：`genka.example.jp`）。
2. 表示される DNS レコード（TXT と A レコード）を、ドメインを管理しているサービスの DNS 設定に追加します。
3. 確認が済むと、数時間ほどで SSL 証明書が自動で発行され、`https://genka.example.jp` で開けるようになります。

## 使い方の注意

- URL を知っている人は、すべての見積もりを編集・削除できます。
- 社外の人に見られないようにしたくなったら、ログイン機能（Firebase Authentication）を追加できます。
- 為替レートの初期値（1元＝21.8円、1ドル＝156円）は参考値です。最初に実際のレートに直してください。
- 国際送料は、飛流通王（上海）の 2026年8月 料金表をもとに計算しています。料金表が変わったら `public/index.html` の `SERVICES` を更新してください。

## 更新のしかた

`public/index.html` を編集したら、もう一度 `firebase deploy` を実行すると反映されます。
