---
title: データ暗号鍵登録ダイアログ
---

データ暗号鍵を登録するためのダイアログです。

![データ暗号鍵登録ダイアログ1](../img/screen-211-01.png)

ダイアログに表示されている各項目についての説明を下表に示します。

|項目名|必須|説明|
|---|---|---|
|鍵サイズ|〇|データ暗号鍵のサイズ(bit)を入力してください。指定可能な値は 128, 192, 256 のいずれかとなります。|
|自動生成||オンにすると登録時にサーバ側でデータ暗号鍵を自動生成します。オフの場合は鍵ファイルの指定が必須となります。|
|鍵ファイル|〇(*1)|データ暗号鍵をファイルで指定します。ファイル選択のダイアログが表示されるので暗号鍵として登録するファイルを選択してください。指定するファイルのサイズは「鍵サイズ」に指定した値と一致している必要があります。|
|埋め込み先|〇|データ暗号鍵をSINETStream設定ファイルに埋め込み先を指定する文字列を入力してください。同一のコンフィグ情報のなかでは同じ値の埋め込み先を指定することが出来ません。|
|コメント||データ暗号鍵に対するコメントを入力してください。任意の内容を入力できます。|
|設定ファイルの適用対象||有効フラグを指定します。オンに設定されている場合、このデータ暗号鍵をSINETStream設定ファイルの埋め込み対象とします。|

(*1) 自動生成がオフの場合

### 埋め込み先の指定について

データ暗号鍵をSINETStream設定ファイルに埋め込む場合は、SINETStreamの暗号鍵パラメータとしての指定となります。そのため「埋め込み先」として指定する値は次表のようになります。

|埋め込み先に指定する値の例|説明|
|---|---|
|`*.crypto.key`|全てのサービスにデータ暗号鍵を埋め込む|
|`service-1.crypto.key`|特定のサービス(`service-1`)のみにデータ暗号鍵を埋め込む|

以下のような設定ファイルがコンフィグ情報に登録されている場合を例として、埋め込み先の指定がどのように扱われるかを示します。

```yaml
header:
  version: 2
config:
  service-1:
    type: kafka
    brokers: kafka:9092
    topic: topic-kafka
    crypto:
      algorithm: AES
      key_length: 256
      mode: GCM
  service-2:
    type: mqtt
    brokers: mqtt:1883
    topic: topic-mqtt
    crypto:
      algorithm: AES
      key_length: 256
      mode: GCM
```

埋め込み先の指定を `*.crypto.key`とした場合、データ暗号鍵を埋め込んだ結果は以下のようになります。

```yaml
header:
  version: 2
  fingerprint: SHA256:QNjQ5H+xd3YxAJUQGxVIinHFDJwbwK/K+9NpSBA6tlE
config:
  service-1:
    type: kafka
    brokers: kafka:9092
    topic: topic-kafka
    crypto:
      algorithm: AES
      key_length: 256
      mode: GCM
      key: !sinetstream/encrypted |-
        AAEBAdGDA0Zn2Y1he//yPt0Xdg0lBkcYao+8qgjzQ7Usn4vcTm6/zG2/2+ko+ALTpn6OMurk
(中略)
        lOApzX3SStg=
  service-2:
    type: mqtt
    brokers: mqtt:1883
    topic: topic-mqtt
    crypto:
      algorithm: AES
      key_length: 256
      mode: GCM
      key: !sinetstream/encrypted |-
        AAEBAdGDA0Zn2Y1he//yPt0Xdg0lBkcYao+8qgjzQ7Usn4vcTm6/zG2/2+ko+ALTpn6OMurk
(中略)
        lOApzX3SStg=
```

埋め込み先の指定を `service-1.crypto.key`とした場合、データ暗号鍵を埋め込んだ結果は以下のようになります。

```yaml
header:
  version: 2
  fingerprint: SHA256:QNjQ5H+xd3YxAJUQGxVIinHFDJwbwK/K+9NpSBA6tlE
config:
  service-1:
    type: kafka
    brokers: kafka:9092
    topic: topic-kafka
    crypto:
      algorithm: AES
      key_length: 256
      mode: GCM
      key: !sinetstream/encrypted |-
        AAEBAdGDA0Zn2Y1he//yPt0Xdg0lBkcYao+8qgjzQ7Usn4vcTm6/zG2/2+ko+ALTpn6OMurk
(中略)
        lOApzX3SStg=
  service-2:
    type: mqtt
    brokers: mqtt:1883
    topic: topic-mqtt
    crypto:
      algorithm: AES
      key_length: 256
      mode: GCM
```

### 携帯端末での表示

携帯端末などの表示幅が狭い端末で登録ダイアログを表示した場合、下図のような全画面表示のダイアログとなります。

![データ暗号鍵ダイアログ-携帯端末](../img/screen-211-02.png)

全画面ダイアログ表示では、登録ボタンが右上に、キャンセルボタンが左上に表示されます。
