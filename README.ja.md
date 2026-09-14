# TurboWarp Jotai Adapter

[English](README.md)

TurboWarpのブロックから、Jotai連携用の状態定義JSONを作るための実験的・発展的パッケージです。Jotai本体をTurboWarp内で直接動かすのではなく、atom定義、action envelope、state snapshotをJSONとして表現し、React/Jotai側のbridgeへ渡すことをMVPにします。

## できること

- TurboWarpブロックでatom定義を作る。
- atomへのset操作をaction envelopeとして表現する。
- 現在のatom registry、action log、snapshotをbridge plan JSONとして出力する。
- Reactコンポーネント統合やTypeScript hooks実装とは疎結合にする。

このパッケージは、複雑なReact/Jotaiプログラミングをいきなりブロックへ閉じ込めるためのものではありません。ブロックで扱いやすい宣言的な状態モデルから、TypeScriptで書く本格的な状態管理へ橋渡しするための教材・試作基盤です。

## 要件と安全性

- Node.js 22以上
- Corepack経由のpnpm
- TurboWarpのcustom extension読み込み

MVPではJSONの生成だけを扱います。実際のJotai storeへ反映するホストアプリケーション側では、atom ID、JSON値、許可するaction種別を必ず検証してください。信頼できないTurboWarpプロジェクトから受け取ったJSONを、そのまま本番アプリの状態へ適用しないでください。

## インストール

```bash
corepack enable
pnpm install --frozen-lockfile
```

## 開発

```bash
pnpm run build
pnpm run test
```

生成される `dist/jotai-bridge.js` をTurboWarpのcustom extensionとして読み込むと、Jotai bridge用JSONを作る最低限のブロックを利用できます。

## ブロック概要

- `define Jotai atom [ATOM] default JSON [VALUE]`: atom定義を追加または置換します。
- `set Jotai atom [ATOM] JSON [VALUE]`: snapshotを更新し、set action envelopeを追加します。
- `Jotai atom [ATOM] value JSON`: atomの現在値をJSON文字列で返します。
- `Jotai set action atom [ATOM] JSON [VALUE]`: standaloneなset action envelopeを返します。
- `Jotai bridge plan JSON`: registry、snapshot、actionsをまとめたbridge planを返します。
- `clear Jotai bridge plan`: 拡張インスタンス内のplanを消去します。
- `normalized JSON [VALUE]`: JSON値を正規化して返します。

## Reactパッケージとの関係

Reactコンポーネントのmount、MUIなどのリッチGUI部品、Vite dev相当のbundle生成は、このパッケージの責務ではありません。それらはReact連携パッケージが担当し、このパッケージは「状態をどう表現し、どう受け渡すか」に集中します。

想定する分担は次の通りです。

```text
TurboWarp Jotai Adapter
  ブロックでatom registry/action/snapshotを作る

TurboWarp React Islands
  ReactコンポーネントをHTMLへ埋め込み、bridge JSONをpropsやinitial stateとして渡す

TypeScript hooks
  実際のJotai atom、derived atom、副作用、サーバー連携を実装する
```

## 教育的位置づけ

この内容は、書籍本編では6巻またはWeb限定の発展コンテンツ寄りに置くのが自然です。4巻・5巻でHTTP、HTML、React island、Cloudflare deployへの道筋を扱ったあと、状態管理を「ブロックで宣言できるグラフ」として捉え直す教材になります。

Web側資料では、書籍の補足に留めず、次の内容を独立して役に立つ形で扱うべきです。

- atom graphとは何か。
- primitive atom、derived atom、actionの違い。
- ブロックで表現してよい範囲と、TypeScriptへ逃がすべき範囲。
- VSCodeで書くhooksと、TurboWarpで作る状態定義をどう同期するか。
- 本番運用で必要なschema validation、migration、権限境界。

## MVP外

- Jotai本体のbundle同梱。
- Reactコンポーネントのmount処理。
- derived atomの完全な式評価。
- 非同期atomや副作用の実行。
- Cloudflare Workers等へのdeploy処理。

これらは、JSON契約が安定してから別パッケージまたはWeb発展教材として追加します。

## ライセンス

SPDX-License-Identifier: MPL-2.0
