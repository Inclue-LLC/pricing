# ぬいぐるみ原価計算

キャラクターごとに、日本販売・中国販売の原価と利益を試算する社内ツールです。
Firebase Hosting で公開し、見積もりは Cloud Firestore に保存します。

共有リンク（URL の `#` 以降に合言葉が付いたもの）を知っている人は、だれでも閲覧・編集できます。
合言葉の付いていない URL を開いても、データは表示されません。

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

### 4. 共有リンクを作る

合言葉は、32 文字以上の推測できない文字列にします。次のコマンドで作れます。

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

出てきた文字列を URL の `#` の後ろに付けたものが共有リンクです。

```
https://genka.example.jp/#ここに合言葉
```

このリンクを、使ってほしい人にだけ伝えてください。
合言葉はリポジトリやチャットの公開の場には書かないでください。

## 使い方の注意

- リンクを知っている人は、すべての見積もりを編集・削除できます。
- リンクが外部に漏れた場合は、新しい合言葉でリンクを作り直してください。
  データは合言葉ごとに別々に保存されるため、新しいリンクは空の状態から始まります。必要な見積もりは移し替えが必要です。
- 為替レートの初期値（1元＝21.8円、1ドル＝156円）は参考値です。最初に実際のレートに直してください。
- 国際送料は、飛流通王（上海）の 2026年8月 料金表をもとに計算しています。料金表が変わったら `public/index.html` の `SERVICES` を更新してください。

## 更新のしかた

`public/index.html` を編集したら、もう一度 `firebase deploy` を実行すると反映されます。
