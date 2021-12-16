# SINETStreamコンフィグサーバ

## 1. 概要

コンフィグサーバはSINETStreamの設定ファイルをサーバで集中的に管理するためのものです。またSINETStreamの設定ファイルが参照するデータ暗号鍵やブローカーの認証情報などの秘匿情報を安全に管理する機能もあわせ持ちます。

コンフィグサーバは、設定ファイルなどを管理するためのWeb管理画面と、SINETStreamライブラリに対して設定ファイル情報を提供するREST APIサーバの機能を提供します。

## 2. インストール

コンフィグサーバをインストールする手順を示します。

### 2.1. 事前準備

インストールする前に必要となる準備について記します。

#### 2.1.1. 実行環境

コンフィグサーバの実行環境として以下のものを必要とします。

* OS
    - Linux
* [Docker Engine](https://www.docker.com/)
    - 19.03 以降

Dockerコンテナ起動などの操作には [Docker Compose](https://github.com/docker/compose) を利用します。Docker Composeはv2もしくは [1.28.0](https://docs.docker.com/compose/release-notes/#1280) 以降のものが必要となりますので、事前にインストールを行ってください。

Docker, Docker Composeのインストール手順については以下に示すリンク先の情報などを参照してください。

* [Install Docker Engine](https://docs.docker.com/engine/install/)
* [Docker Compose v2 - Where to get Docker Compose](https://github.com/docker/compose#linux)

またコンフィグサーバのセットアップスクリプトを実行するには以下のコマンドが必要となります。OSのパッケージなどを利用して事前にインストールしてください。

* curl
* jq

#### 2.1.2. ソースツリー

`git clone https://github.com/nii-gakunin-cloud/sinetstream-config-server.git` などの方法でソースファイルを取得してください。

#### 2.1.3. サーバ証明書

コンフィグサーバは HTTPS にてサービスを提供します。そのためコンフィグサーバのホスト名(FQDN)に対応するサーバ証明書とその秘密鍵が必要となります。

#### 2.1.4. 時刻同期

学認連携認証を利用する場合、正しい時刻が設定されていないとエラーとなります。NTPなどを利用して時刻同期を行うように設定してください。

### 2.2. セットアップスクリプトの実行

始めにコンフィグサーバの初期データなどの設定、登録処理を行います。セットアップスクリプト `setup/init.sh` を実行してください。

実行例を以下に示します。

```console
$ ./setup/init.sh
[+] Running 6/6
 ⠿ Volume "vault"                    Created                                    0.0s
 ⠿ Volume "postgres"                 Created                                    0.0s
 ⠿ Container sscfg-postgres-1        Started                                    1.5s
 ⠿ Container sscfg-vault-setup-1     Started                                    2.0s
 ⠿ Container sscfg-redis-1           Started                                    1.9s
 ⠿ Container sscfg-setup_db-1        Started                                    3.6s
Requiring external module ts-node/register
Created users table
Created streams table
Created members table
Created public_keys table
Created encrypt-keys table
Created attach-files table
Created user-parameters table
Created api_access_keys table
Created topics table
Batch 1 run: 17 migrations
########################################
Unseal Key 1: ow+NxdrnB4FdqtYn1zF19TK3Fs44GkUHd5p1M3wB3Cmj
Unseal Key 2: GwdH6/NupY9NoycddukNugb7u4EjnCQ2LGt/e70y4C6V
Unseal Key 3: Ym6uZzZnDB8zvRLyhNl34Lio4vv9aBoi3K/MdYRdWXVN
Unseal Key 4: AThPaMBTvjlEQc1rn3NeWm7eXgWTLHk8iH82apJKTmHO
Unseal Key 5: 3ec9s2VUFaxDIn1ICOzdgeu6uxR+sYZwJ1P3fipuVROS

Initial Root Token: s.hpvTKARy15cf7OOrQKZO9hV8
########################################
[+] Running 4/4
 ⠿ Container sscfg-redis-1           Running                                    0.0s
 ⠿ Container sscfg-vault-setup-1     Running                                    0.0s
 ⠿ Container sscfg-postgres-1        Started                                   11.5s
 ⠿ Container sscfg-setup_db-1        Started                                   12.4s
Requiring external module ts-node/register
Ran 1 seed files
Config server setup succeeded.
```

セットアップ処理が成功すると、最後に `Config server setup succeeded.`と表示されます。

セットアップスクリプトは実行中に `Unseal Key` と `Initial Root Token` を標準出力に表示します。この値はコンフィグサーバが秘匿情報を記録している[HashiCorp Vault](https://www.vaultproject.io/)の unseal キーとルートトークンになります。コンフィグサーバの起動や、管理に必要な情報となりますので安全な場所に保管してください。

セットアップスクリプトを実行することでデータベース(PostgreSQL)とHashiCorp Vaultの初期設定が行われます。コンフィグサーバではPostgreSQL, HashiCorp VaultをDockerコンテナとして実行しているので、そのデータは Docker Volumeに保持されます。以下の実行例に示すように `postgres`, `vault` と名づけられた Docker Volumeがセットアップスクリプトによって作成されたものになります。　

```console
$ docker volume ls 
DRIVER    VOLUME NAME
local     9f017d4d9034e82ea67df7a83f89851fae4e03a0c01168ea385f8a162128e226
local     789296ae129fa7a9ba517429bf0d2f974cca59a7ed24b191774efbfc5e5a7277
local     postgres
local     vault
```

> セットアップスクリプトを実行後に、前回のデータを破棄して再度セットアップを行う場合は Docker Volumeの `postgres`, `vault` を削除する必要があります。

### 2.3. サーバ証明書の配置

コンフィグサーバは HTTPS にてサービスを提供します。サーバ証明書とその秘密鍵ファイルを実行環境に配置してください。証明書を配置したパスを次節で記す設定ファイルに記述します。

### 2.4. サーバ情報の設定

コンフィグサーバの情報を設定ファイル `.env` に記述します。記述が必要となる情報を以下の表に示します。

|環境変数名|説明|
|---|---|
|`SSCFG_HOSTNAME`|コンフィグサーバのホスト名(FQDN)|
|`CERT_FILE`|サーバ証明書ファイルのパス|
|`KEY_FILE`|サーバ証明書の秘密鍵ファイルのパス|

上記の表に示した各項目を`(変数名)=(値)`の形式で `.env` に記してください。記述例を以下に示します。

```sh
SSCFG_HOSTNAME=sscfg.example.org
CERT_FILE=/srv/sscfg/certs/server.cer
KEY_FILE=/srv/sscfg/certs/server.key
```

## 3. コンフィグサーバの起動

コンフィグサーバの起動手順を示します。

1. コンテナの起動
1. HashiCorp Vault の unseal

それぞれの手順の詳細について以下に記します。

### 3.1. コンテナの起動

起動スクリプト`sscfg.sh`に`--start`を指定して実行します。

実行例を以下に記します。

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

### 3.2. HashiCorp Vault の unseal

コンフィグサーバの秘匿情報を保持している [HashiCorp Vault](https://www.vaultproject.io/) は、起動時に seal 状態で起動されます。この状態では暗号化された秘匿情報にアクセスすることができないため、コンフィグサーバはサービスをまだ開始できない状態にあります。この状態を解消するにはセットアップ時に生成された unseal キーを入力することで Vault を unseal 状態にする必要があります。Vaultにunsealキーを入力するスクリプト `vault_unseal.sh` を所定の回数（デフォルトでは３回）実行し unseal 状態となるようにしてください。

実行例を以下に記します。

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
Version            1.8.5
Storage Type       file
HA Enabled         false
```

上記の操作を所定の回数行ってください。所定の回数 unseal キーを入力して Vaultの状態が unseal に変更されると以下の例のように `Sealed`の値が `false` と表示されます。

```console
$ ./vault_unseal.sh 
Unseal Key (will be hidden): 
Key             Value
---             -----
Seal Type       shamir
Initialized     true
Sealed          false
Total Shares    5
Threshold       3
Version         1.8.5
Storage Type    file
Cluster Name    vault-cluster-a49a47cf
Cluster ID      46cf8fc4-ed4d-59e6-c977-25cf50c992c5
HA Enabled      false
```

Vaultの状態が `unseal`に変更されたことで、コンフィグサーバが利用可能な状態になります。`SSCFG_HOSTNAME`で指定したホストに対してHTTPSのアクセスを行うとログイン画面が表示されます。

> クラウドの鍵管理サービスなどを利用することでVaultの状態を自動的に unseal 状態にする設定を行うことができます。コンフィグサーバでVaultのauto unseal 機能を利用する手順については[docs/vault-auto-unseal.md](docs/vault-auto-unseal.md)を参照してください。

### 3.3. コンテナの停止

`sscfg.sh`に`--stop`を指定して実行すると、コンフィグサーバのコンテナを停止します。

```console
$ ./sscfg.sh --stop
[+] Running 5/5
 ⠿ Container sscfg-postgres-1    Stopped                            0.3s
 ⠿ Container sscfg-redis-1       Stopped                            0.7s
 ⠿ Container sscfg-nodejs-1      Stopped                           10.3s
 ⠿ Container sscfg-nginx-1       Stopped                            0.8s
 ⠿ Container sscfg-vault-1       Stopped                            0.8s
```

コンテナを停止するだけでなく削除する場合は`--down`を指定してください。`--down`を指定してもDocker Volume の削除は行わないのでコンフィグサーバのデータは残っています。

```console
$ ./sscfg.sh --down
[+] Running 6/6
 ⠿ Container sscfg-postgres-1    Removed                            0.0s
 ⠿ Container sscfg-redis-1       Removed                            0.1s
 ⠿ Container sscfg-vault-1       Removed                            0.0s
 ⠿ Container sscfg-nginx-1       Removed                            0.0s
 ⠿ Container sscfg-nodejs-1      Removed                            0.0s
 ⠿ Network sscfg_default         Removed                            0.1s
```

## 4. ユーザ管理について

コンフィグサーバではWeb管理画面を利用する際の認証方式として、以下に示す二つの方法を提供しています。

1. ローカルユーザ認証
2. 学認連携による認証

前者はコンフィグサーバが内部で管理しているユーザ名、パスワードで認証を行う方式です。後者は[学認フェデレーション](https://www.gakunin.jp/)のIdPと連携することで認証を行う方式です。この章では前者のローカルユーザ認証でのユーザ管理について説明します。後者の学認連携認証については[次章](#5-学認連携について)で説明します。


### 4.1. システム管理者

ユーザ管理を行うにはシステム管理者権限が必要となります。セットアップ時に作成された初期ユーザはシステム管理者権限が付与されているので、はじめにユーザ管理を行うには初期ユーザを利用してください。初期ユーザのユーザ名、パスワードを以下に示します。

* ユーザ名
    - `admin`
* パスワード
    - `admin-password`

初期ユーザのパスワードなどは、実際の運用を行う前に必ず変更してください。また、ユーザ管理ツールを用いて新たに登録したユーザにシステム管理者権限を付与することが出来ます。新たにシステム管理者ユーザを作成した後に、初期ユーザ`admin`を削除することを推奨します。

### 4.2. ユーザ管理ツール

ローカルユーザの登録、更新、削除を行うためのツール`user-mgmt`を `tools/` に用意しています。[tools/README.md](tools/README.md)の記述に従いインストールを行ってください。

`user-mgmt`ではCSVファイルを指定してユーザ登録などのユーザ管理操作を行います。ユーザ登録を行う場合の実行例を以下に示します。

```console
$ user-mgmt -s https://sscfg.example.org -u admin import -c users.csv
```

CSVファイルのフォーマットや`user-mgmt`の使用方法の詳細については[tools/README.md](tools/README.md)を参照してください。

## 5. 学認連携について

コンフィグサーバを[学認](https://www.gakunin.jp/)にSPとして登録することで、学術認証フェデレーションのIdPと連携した認証を行うことが出来ます。

### 5.1. セットアップ

#### 5.1.1. 学認フェデレーションへの登録

学認の[参加情報](https://www.gakunin.jp/join)などのページでフェデレーションに参加する手順を確認してください。以下に示すリンク先から、コンフィグサーバをSPとしてフェデレーションへの登録手続きを行ってください。

* [テストフェデレーション参加手続き](https://www.gakunin.jp/join/test)
* [運用フェデレーション参加手続き](https://www.gakunin.jp/join/production)

新規SPとして申請を行う際に必要となるパラメータの例を以下の表に示します。この例ではコンフィグサーバを実行するホスト名を `sscfg.example.org` としています。

|パラメータ名|指定例|
|---|---|
|entityID|`https://sscfg.example.org/shibboleth-sp`|
|DSからのリターンURL|`https://sscfg.example.org/Shibboleth.sso/DS`|
|受信する属性情報|eduPersonPrincipalName (必須)<br>mail (選択)<br>displayName (選択)<br>jaDisplayName (選択)|

「受信する属性情報の指定」では`eduPersonPrincipalName`がコンフィグサーバを運用するうえで最低限必要となる項目になります。他の`mail`, `displayName`, `jaDisplayName` に関しては「選択」として申請するか、あるいは申請する属性情報から外すことができます。必要に応じて申請内容を変更してください。`mail`, `displayName`, `jaDisplayName` の値を申請内容に追加した場合、対応する属性値をコンフィグサーバのユーザ情報として初回登録時に取り込みます。

#### 5.1.2. 署名検証証明書の取得

学認メタデータを署名検証するための証明書を取得します。証明書に関する情報については以下に示すリンク先を参照してください。

* テストフェデレーション
    - [テストフェデレーションのルール](https://www.gakunin.jp/join/test/rule)
* 運用フェデレーション
    - [メタデータ署名証明書](https://meatwiki.nii.ac.jp/confluence/display/GakuNinShibInstall/signer)

必要となる証明書は利用するフェデレーションにより異なるので、適切なものを取得してください。

#### 5.1.3. サーバ情報の設定

コンフィグサーバの情報を設定しているファイル `.env` に、学認連携認証を利用するための情報を追記します。設定が必要となる情報を以下の表に示します。

|環境変数名|説明|
|---|---|
|`ENABLE_SHIBBOLETH`|`true`を指定すると学認連携認証が有効になります。|
|`GAKUNIN_SIGNER`|学認のメタデータの署名を検証するための証明書のパスを指定してください。|
|`GAKUNIN_SAMLDS`|フェデレーションが提供するディスカバリサービスのURLを指定してください。|
|`GAKUNIN_METADATA`|フェデレーションのメタデータのURLを指定してください。|
|`SP_CERT_FILE`|SPでの暗号化、署名に用いる証明書のパスを指定してください。通常は`CERT_FILE`に指定したパスと同じ値になります。|
|`SP_KEY_FILE`|SPでの暗号化、署名に用いる証明書の秘密鍵ファイルのパスを指定してください。通常は`KEY_FILE`に指定したパスと同じ値になります。|


`GAKUNIN_SAMLDS`, `GAKUNIN_METADATA` に設定する値は参加するフェデレーションにより異なります。以下に示すリンク先の情報を確認してください。

* テストフェデレーション
    - [テストフェデレーションのルール](https://www.gakunin.jp/join/test/rule)
* 運用フェデレーション
    - [メタデータ](https://meatwiki.nii.ac.jp/confluence/pages/viewpage.action?pageId=12158173)
    - [shibboleth2.xml ファイル](https://meatwiki.nii.ac.jp/confluence/pages/viewpage.action?pageId=12158266)


`.env`の記述例を以下に示します。

```sh
SSCFG_HOSTNAME=sscfg.example.org
CERT_FILE=/srv/sscfg/certs/server.cer
KEY_FILE=/srv/sscfg/certs/server.key
ENABLE_SHIBBOLETH=true
GAKUNIN_SIGNER=/srv/sscfg/certs/gakunin-test-signer-2020.cer      
GAKUNIN_SAMLDS=https://test-ds.gakunin.nii.ac.jp/WAYF
GAKUNIN_METADATA=https://metadata.gakunin.nii.ac.jp/gakunin-test-metadata.xml  
SP_KEY_FILE=/srv/sscfg/certs/server.key
SP_CERT_FILE=/srv/sscfg/certs/server.cer
```

> 後に学認連携を無効にする必要がある場合には `ENABLE_SHIBBOLETH`の行を削除するか`#`でコメントアウトしてください。

### 5.2. コンテナの起動

既にコンフィグサーバを起動している場合は、変更前の状態にあるコンテナが残らないようにするためにいったんコンテナの停止と削除を行います。`sscfg.sh --down` を実行してください。

```console
$ ./sscfg.sh --down
[+] Running 6/6
 ⠿ Container sscfg-postgres-1    Removed                            0.0s
 ⠿ Container sscfg-redis-1       Removed                            0.1s
 ⠿ Container sscfg-vault-1       Removed                            0.0s
 ⠿ Container sscfg-nginx-1       Removed                            0.0s
 ⠿ Container sscfg-nodejs-1      Removed                            0.0s
 ⠿ Network sscfg_default         Removed                            0.1s
```

`sscfg.sh --start`を実行してコンフィグサーバを起動します。

```console
$ ./sscfg.sh --start
[+] Running 6/6
 ⠿ Container sscfg-shibboleth-1  Started               1.7s
 ⠿ Container sscfg-postgres-1    Running               0.0s
 ⠿ Container sscfg-nodejs-1      Running               0.0s
 ⠿ Container sscfg-redis-1       Running               0.0s
 ⠿ Container sscfg-vault-1       Running               0.0s
 ⠿ Container sscfg-nginx-1       Started               1.8s
```
