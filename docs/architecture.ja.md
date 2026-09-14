# TurboWarp Jotai Adapter アーキテクチャ

このパッケージは、TurboWarpブロックをJotaiの実行環境そのものにするのではなく、Jotai bridgeへ渡す状態契約を作るための拡張機能です。MVPでは「ブロックでJSONを作る」ことに集中します。

## 目的

狙いは、Reactプログラミングへの橋渡しです。学習者は、まずTurboWarpブロックでatom、action、snapshotという状態管理の基本構造を扱い、その後にVSCodeでTypeScript hooksやJotai atom実装へ進めます。

実用面では、ブロックから生成したJSONをReactアプリのinitial stateやstate operationとして渡せます。ただし、本番運用ではホストアプリケーション側のschema validation、許可リスト、migrationが必須です。

## レイヤー

```text
TurboWarp blocks
  atom定義、set action、snapshotを作る

Bridge JSON
  registry/actions/snapshotを安定した形式で表す

React/Jotai host
  JSONを検証し、実際のJotai storeへ反映する

TypeScript hooks
  derived atom、副作用、外部API連携、永続化を担当する
```

## JSON契約

MVPのbridge planは次の構造を持ちます。

```json
{
  "formatVersion": 1,
  "registry": {
    "atoms": [
      {
        "id": "counter",
        "label": "counter",
        "defaultValue": 0,
        "writable": true,
        "tags": []
      }
    ]
  },
  "snapshot": {
    "values": {
      "counter": 2
    }
  },
  "actions": [
    {
      "formatVersion": 1,
      "kind": "jotai.setAtom",
      "atomId": "counter",
      "value": 2
    }
  ]
}
```

`formatVersion` は将来のmigration境界です。atom IDは英字で始まり、英数字、`_`、`.`、`:`、`-` のみを許可します。値はJSON serializableな値に限定します。

## React連携パッケージとの責務分離

React連携パッケージは、HTMLへのReact island埋め込み、Vite bundle、props注入、MUIなどのリッチGUI部品を扱います。このJotaiパッケージは、Reactの描画方式やbundle方式を知らない状態に保ちます。

この分離により、TurboWarp側では「宣言的な状態定義」を扱い、複雑なhooks、derived atom、副作用、認証済みAPIアクセス、永続化はTypeScript側へ委譲できます。発展的には、VSCode側のatom定義からTurboWarpブロック候補を生成する、またはブロックから型付きatom skeletonを生成する流れも考えられます。

## 教材としての位置づけ

書籍構成では、6巻またはWeb限定の発展コンテンツに置くのが自然です。状態管理は、HTTPハンドラやHTML生成より抽象度が高く、ReactやTypeScript hooksと一緒に扱う必要があります。

Web側資料では、書籍本文に入れきれない次の内容を扱うと有用です。

- atom graphの可視化。
- primitive atomとderived atomの対応。
- action envelopeとイベント設計。
- ブロックからTypeScript hooksへ進む演習。
- 永続化、migration、権限境界、テスト戦略。

## 実用上の注意

ブロックから出たJSONを直接信頼しないでください。ホストアプリケーションは、受け入れるatom ID、値のschema、action kind、状態更新の頻度を制限する必要があります。

また、Jotaiの強みであるderived atom、async atom、React hooksとの統合は、ブロック上で完全再現しようとすると教育性も実用性も下がります。ブロックは状態構造の入口として使い、複雑な処理はTypeScriptへ進む導線として設計するのがこのパッケージの方針です。
