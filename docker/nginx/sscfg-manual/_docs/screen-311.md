---
title: 添付ファイル登録ダイアログ
---

添付ファイルを登録するためのダイアログです。

![添付ファイル登録ダイアログ1](../img/screen-311-01.png)

ダイアログに表示されている各項目についての説明を下表に示します。

|項目名|必須|説明|
|---|---|---|
|添付ファイル|〇|添付ファイルとして登録するファイルを指定します。ファイル選択のダイアログが表示されるのでファイルを指定してください。|
|秘匿情報||秘匿情報フラグを指定します。フラグをオンに設定すると、登録された添付ファイルをコンフィグサーバから取得する場合に暗号化されます。|
|埋め込み先|〇|添付ファイルをSINETStreamの設定ファイルに埋め込む先を指定します。
|コメント||添付ファイルに対するコメントを入力してください。任意の内容を入力できます。|
|設定ファイルの適用対象||有効フラグを指定します。オンに設定されている場合、この添付ファイルをSINETStream設定ファイルの埋め込み対象とします。|

### 埋め込み先の指定について

埋め込み先として指定する文字列の例を次表に示します。パラメータの詳細については[SINETStreamのドキュメント](https://www.sinetstream.net/docs/userguide/config.html)を参照してください。

|埋め込み先の指定|説明|
|---|---|
|`*.tls.ca_certs_data`|CA証明書|
|`*.tls.certfile_data`|クライアント証明書|
|`*.tls.keyfile_data`|クライアント証明書秘密鍵|
|`*.tls.trustStore_data`|トラストストア|
|`*.tls.keyStore_data`|キーストア|
|`*.ssl_cafile_data`|CA証明書(Kafka)|
|`*.ssl_certfile_data`|クライアント証明書((Kafka)|
|`*.ssl_keyfile_data`|クライアント証明書秘密鍵(Kafka)|
|`*.ssl_truststore_location_data`|トラストストア(Kafka)|
|`*.ssl_keystore_location_data`|キーストア(Kafka)|
|`*.tls_set.ca_certs_data`|CA証明書(MQTT)|
|`*.tls_set.certfile_data`|クライアント証明書(MQTT)|
|`*.tls_set.keyfile_data`|クライアント証明書秘密鍵(MQTT)|
|`*.tls_set.trustStore_data`|トラストストア(MQTT)|
|`*.tls_set.keyStore_data`|キーストア(MQTT)|

特定のサービスのみに対して埋め込みを行う場合は`*`の代わりにサービス名を指定してください。

### 携帯端末での表示

携帯端末などの表示幅が狭い端末で登録ダイアログを表示した場合、下図のような全画面表示のダイアログとなります。

![添付ファイルダイアログ-携帯端末](../img/screen-311-02.png)

全画面ダイアログ表示では、登録ボタンが右上に、キャンセルボタンが左上に表示されます。
