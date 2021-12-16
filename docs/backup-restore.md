# バックアップとリストア

コンフィグサーバのバックアップとリストアの手順について記します。

## 1. バックアップ

### 1.1. バックアップ対象

このドキュメントで扱う、コンフィグサーバのバックアップ対象を以下に示します。

* Docker Volume
    - `postgres`
    - `vault`
* 設定ファイル
    - `.env`
    - `.env.sscfg`

上記に示したものの他にサーバ証明書や Vault のunseal keyがコンフィグサーバを実行するには必要となります。これらのバックアップについてはこのドキュメントでは扱わないので、別途対応を行ってください。また、ソースツリーに含まれているファイルやコンテナイメージについてもバックアップの対象とはしていません。実行環境でコンテナイメージや`docker-compose.yml`などを変更した場合は個別にバックアップを行ってください。

### 1.2. バックアップ手順

バックアップスクリプト`setup/backup.sh`を実行してください。バックアップ処理中は`docker pause`によりコンテナを一時的に停止します。そのためコンフィグサーバのサービスが一時的に提供できなくなります。また、コンフィグサーバが停止中だと `setup/backup.sh` でバックアップをとることが出来ません。サーバは実行した状態でバックアップスクリプトを実行してください。

実行例を以下に示します。


```console
$ ./setup/backup.sh 
[+] Running 1/0
 ⠿ Container sscfg-vault-1  Paused                     0.0s
[+] Running 1/0
 ⠿ Container sscfg-vault-1  Unpaused                   0.0s 
[+] Running 1/0
 ⠿ Container sscfg-postgres-1  Paused                  0.0s 
[+] Running 1/0
 ⠿ Container sscfg-postgres-1  Unpaused                0.0s
Backup is done: /srv/sscfg/backup/backup-20211110030443.tar.gz
```

バックアップファイルは `backup/`ディレクトリに作成されます。

## 2. リストア

### 2.1. 前提条件

リストアを行う前提となるものを以下に示します。

* コンフィグサーバのソースツリーが配置されていること
* 以下に示すDocker Volumeが存在していないこと
    - `postgres`
    - `vault`
* 以下に示すコマンドがインストールされていること
    - `docker`
    - `docker compose`
    - `curl`
    - `jq`

### 2.2. コンフィグサーバの復旧手順

バックアップファイルからコンフィグサーバを復旧する手順を示します。主な手順は以下のようになります。

1. バックアップファイルのリストア
2. サーバ証明書の配置
3. コンフィグサーバの起動

それぞれの手順について以下に記します。

#### 2.2.1. バックアップファイルのリストア

バックアップファイルからDocker Volumeと設定ファイルをリストアします。リストアを行うスクリプト`setup/restore.sh`を実行してください。対象となるバックアップファイルをスクリプトの引数`-f`で指定する必要があります。

実行例を以下に示します。

```console
$ ./setup/restore.sh -f /srv/sscfg/backup/backup-20211110030443.tar.gz
Recovery is now complete.
```

#### 2.2.2. サーバ証明書の配置

コンフィグサーバのサーバ証明書とその秘密鍵を配置してください。配置場所は設定ファイル`.env`の`CERT_FILE`, `KEY_FILE` に記されている場所に合せてください。証明書の配置場所が変わる場合は`.env`の設定値を変更してください。

#### 2.2.3. コンフィグサーバの起動

通常の手順でコンフィグサーバを起動します。`sscfg.sh`に`--start`を指定して実行します。

```console
$ ./sscfg.sh --start
[+] Running 6/6
 ⠿ Network sscfg-Created                            0.1s
 ⠿ Container sscfg-postgres-1  Started                            2.9s
 ⠿ Container sscfg-redis-1     Started                            2.7s
 ⠿ Container sscfg-vault-1     Started                            2.9s
 ⠿ Container sscfg-nginx-1     Started                            2.3s
 ⠿ Container sscfg-nodejs-1    Started                            3.0s
=============================
You need to unseal the Vault.
=============================
```


Vaultのunsealを行うために `vault_unseal.sh`を所定の回数実行してください。

```console
$ ./vault_unseal.sh 
Unseal Key (will be hidden): 
Key                Value
---                -----
Seal Type          shamir
Initialized        true
Sealed             true
Total Shares       5
Threshold          3
Unseal Progress    1/3
Unseal Nonce       42c8f9d8-2fe7-933f-353c-1e509b0f38b9
Version            1.8.4
Storage Type       file
HA Enabled         false
```

以上の手順でコンフィグサーバの復旧が完了しました。