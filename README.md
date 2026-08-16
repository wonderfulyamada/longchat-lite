# LongChat Lite

長大化した ChatGPT の会話で、過去の会話ターンを非表示にし、ブラウザ側の描画負荷を軽減する**非公式ユーザースクリプト**です。プロジェクト名は **LongChat Lite** です。

> **Unofficial project. This project is not affiliated with or endorsed by OpenAI. ChatGPT is a trademark of OpenAI.**

## できること

- 古い会話ターンを自動で非表示
- 直近に残すターン数を `5 / 10 / 20 / 30 / 40 / 60` から選択
- 表示中のターンに `content-visibility: auto` を適用
- 軽量化の ON / OFF をワンクリックで切り替え
- ChatGPT 内で別の会話へ移動したときに自動で再適用
- 設定を `localStorage` に保存

会話データそのものを削除するわけではありません。ブラウザ上で古いターンを非表示にしているだけです。

## なぜ軽くなる？

長い会話では、ブラウザが大量のメッセージ要素をレイアウト・描画し続けることで、スクロールや入力が重くなる場合があります。

LongChat Lite は古いターンを `display: none` にし、現在表示対象のターンにも `content-visibility: auto` を適用します。

また、v0.2.0 では `MutationObserver` による常時 DOM 監視をやめました。

代わりに **3秒ごとに会話ターン数だけを確認し、ターン数が変わった場合にだけ処理**します。これにより、ChatGPT が回答をストリーミングしている最中にスクリプト自身が大量の再処理を行うことを避けています。

## 動作環境

- Chrome / Edge
- Tampermonkey
- `https://chatgpt.com/`

Windows版 ChatGPT アプリ向けではありません。

## インストール

1. Chrome または Edge に Tampermonkey をインストール
2. Tampermonkey で新しいユーザースクリプトを作成
3. 初期コードをすべて削除
4. [`longchat-lite.user.js`](./longchat-lite.user.js) の内容を貼り付け
5. 保存
6. `https://chatgpt.com/` を再読み込み

Chrome の設定によっては、Tampermonkey の拡張機能設定で **「ユーザースクリプトを許可」** を ON にする必要があります。

## 使い方

ChatGPT を開くと、画面右下に小さなパネルが表示されます。

- **ON / OFF**  
  軽量化を切り替えます。
- **Keep**  
  直近に表示したまま残す会話ターン数を選びます。
- **Apply**  
  現在の設定を手動で再適用します。

長大なチャットでは `Keep 10` または `Keep 20` が目安です。

## 注意事項

- ChatGPT の画面構造が変更されると動作しなくなる可能性があります。
- 非公式ツールです。
- OpenAI とは関係ありません。
- 表示上は古い会話が消えますが、ChatGPT 側の会話データを削除しているわけではありません。
- 不具合が起きた場合は、まず `OFF` にするか Tampermonkey 上でスクリプトを無効化してください。

## 開発メモ

### v0.1.x

最初の実装では `MutationObserver` を使い、ChatGPT の DOM 変更を監視していました。

しかし長文回答のストリーミング中にも監視が頻繁に発火し、軽量化スクリプト自身が追加負荷になる問題がありました。

### v0.2.0

常時 DOM 監視を廃止。

- 3秒ごとの軽量チェック
- ターン数が変わった場合だけ再処理
- URL変更時のみ強制再適用

という方式へ変更し、長大チャットでの操作負荷を大幅に抑えました。

## License

MIT License
