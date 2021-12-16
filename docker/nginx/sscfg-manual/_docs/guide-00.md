---
title: 利用シナリオ
---

コンフィグサーバの利用シナリオとして、以下に示す２つのケースを想定しています。

1. SINETStream設定ファイルを利用者が配置する場合
1. SINETStreamライブラリがコンフィグサーバから直接情報を取得する場合

それぞれの利用シナリオにおける操作の流れを図示します。

### SINETStream設定ファイルを利用者が配置する場合

```mermaid
graph TD
  subgraph ss[SINETStream実行環境]
    S(SINETStream) <-->|4.メッセージ送受信|B[ブローカ];
  end
  subgraph config[ ]
    A([fa:fa-user データ管理者])-->|1.設定ファイルの登録|C[コンフィグサーバ];
    U([fa:fa-user 共同利用者])-->|2.設定ファイルの取得|C[コンフィグサーバ];
    U([fa:fa-user 共同利用者])-.->|3.設定ファイルの配置|S(SINETStream);
  end
```

### SINETStreamライブラリがコンフィグサーバから直接情報を取得する場合

```mermaid
graph TD
  subgraph ss[SINETStream実行環境]
    S(SINETStream) <-->|5.メッセージ送受信|B[ブローカ];
  end
  subgraph config[ ]
    A([fa:fa-user データ管理者])-->|1.設定ファイルの登録|C[コンフィグサーバ];
    U([fa:fa-user 共同利用者])-->|2.APIアクセスキーの取得|C[コンフィグサーバ];
    U([fa:fa-user 共同利用者])-.->|3.APIアクセスキーの配置|S(SINETStream);
    S-->|4.設定ファイル情報の取得|C;
  end
```
