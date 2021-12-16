# HashiCorp Vault について

## 1. トークン

コンフィグサーバではVaultコンテナにアクセスするためのVaultトークンをセットアップ時に作成します。作成したトークンは`.env.sscfg` ファイルに`VAULT_TOKEN`として記録されます。このトークンには、コンフィグサーバが必要とするアクセス権が設定されています。トークンのアクセス権は、トークンに設定されているVaultポリシー`sscfg`の内容で確認することができます。

`.env.sscfg`に書き込まれたトークンは Vault の [periodic token](https://www.vaultproject.io/docs/concepts/tokens#periodic-tokens)として作成されています。一般的な Vault のトークンは有効期限が設定されており、その期限内でのみ利用できるようになっています。一方 periodic token は一定時間毎に更新を行うことで、有効期限の制約を事実上受けずに利用することが可能となります。ただし一定時間以内に更新処理を行わないと periodic token であっても失効してしまいます。

コンフィグサーバではトークンの更新処理を一日一度の頻度で行っています。また更新処理を実施しなかった場合の有効期限は720時間となっています。保守などでコンフィグサーバを停止する場合は、トークン更新処理が720 時間以上途絶えることがないように注意してください。もし`.env.sscfg`に記録されているトークンが失効してしまった場合は、コンフィグサーバのセットアップ時に表示されたVaultのrootトークンを用いてトークンを再作成することができます。

## 2. 外部の HashiCorp Vault を利用する

コンフィグサーバのセットアップスクリプト`setup/init.sh`によって構成された Vault コンテナは小規模な利用では十分なものとなっています。しかし運用形態によってはVaultのストレージバックエンドに[Consul](https://www.vaultproject.io/docs/configuration/storage/consul)や[Integrated Storage](https://www.vaultproject.io/docs/configuration/storage/raft)などを利用したい場合があります。このような場合に対応するために、コンフィグサーバでは外部の HashiCorp Vault を指定することが出来ます。

### 2.1. 準備

外部のVaultサーバを利用する前提条件として、コンフィグサーバに関するデータが登録済の状態となっていることが必要となります。

内部のVaultから外部のVaultに登録データを移行するには、コンフィグサーバのバックアップファイルを利用するのが簡単です。

スクリプト`setup/backup.sh`が作成するバックアップファイルは tar ファイルの中に `vault.tar.gz` が含まれています。

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
Backup is done: /srv/sscfg/backup/backup-20211117110335.tar.gz

$ tar tzf backup/backup-20211117110335.tar.gz
./
./.env.sscfg
./.env
./postgres.tar.gz
./vault.tar.gz
```

コンフィグサーバが内部で利用している Vault コンテナではデータを[Filesystem Storage Backend](https://www.vaultproject.io/docs/configuration/storage/filesystem)として保持しています。バックアップファイルに含まれている `vault.tar.gz` は Vaultコンテナの Filesystem Storeage のファイルをアーカイブしたものとなっています。

外部の Vault サーバにコンフィグサーバの Vault データを移行するには、まず Filesystem Storage として Vault を構成してください。そして Filesystem Storage として指定したディレクトリに `vault.tar.gz` の内容を展開して下さい。この状態でVaultサーバを起動してデータにアクセスできることを確認してください。

その後、以下のリンク先などの情報を参考にして、実際に運用で用いる Storage Backendへのマイグレーションを実施してください。

* [operator migrate](https://www.vaultproject.io/docs/commands/operator/migrate)
* [Storage Migration tutorial - Consul to Integrated Storage](https://learn.hashicorp.com/tutorials/vault/raft-migration?in=vault/raft)




### 2.2. 設定手順

コンフィグサーバが利用する外部の Vault のアドレスを `.env.sscfg`ファイルの`VAULT_ADDR` に指定します。

具体的な手順を以下に示します。

まずコンフィグサーバが内部で起動している Vaultコンテナの削除を確実におこなうために、いったん全てのコンテナを停止、削除します。

```console
$ ./sscfg.sh --down
[+] Running 6/6
 ⠿ Container sscfg-nginx-1       Removed                   0.6s
 ⠿ Container sscfg-redis-1       Removed                   0.6s
 ⠿ Container sscfg-postgres-1    Removed                   0.6s
 ⠿ Container sscfg-vault-1       Removed                   0.7s
 ⠿ Container sscfg-nodejs-1      Removed                  10.3s
 ⠿ Network sscfg_default         Removed                   0.1s
```

次に、設定ファイル `.env.sscfg` に Vault　のアドレスを記述します。例えば Vault のアドレスが `https://vault.example.org:8200` だった場合は、以下のようになります。


```console
$ echo 'VAULT_ADDR=https://vault.example.org:8200' >> .env.sscfg
$ cat .env.sscfg
POSTGRES_PASSWORD=xxxxxxxxxxxxxxxx
VAULT_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXX
VAULT_ADDR=https://vault.example.org:8200
$
```

起動スクリプト`sscfg.sh`を実行して、コンフィグサーバを起動します。

```console
$ ./sscfg.sh --start
[+] Running 5/5
 ⠿ Network sscfg-default         Created                   0.1s
 ⠿ Container sscfg-nodejs-1      Started                   2.3s
 ⠿ Container sscfg-postgres-1    Started                   2.4s
 ⠿ Container sscfg-redis-1       Started                   2.7s
 ⠿ Container sscfg-nginx-1       Started                   3.7s
```

表示から、内部の Vault コンテナが起動されていないことが確認できます。以上で、外部の Vault サーバの利用に関する設定変更が完了しました。

> 外部の Vaultサーバを利用している場合は、起動スクリプトに Vault の seal/unseal 状態の表示を行いません。Vaultサーバ側で適切な手順を実行して unseal 状態に設定してください。

### 2.3. バックアップ、リストア

コンフィグサーバでは、データのバックアップ、リストアを行うためのスクリプト `setup/backup.sh`, `setup/restore.sh` を用意しています。外部の Vault サーバを利用するように設定した場合、提供しているスクリプトは Vault をバックアップ対象から除外します。

外部の Vault に関しては、個別にバックアップを行ってください。Vaultのバックアップ手順については以下のリンク先などを参照してください。

* [Vault Data Backup Standard Procedure](https://learn.hashicorp.com/tutorials/vault/sop-backup)


## 3. 監査ログ

HashiCorp Vaultでは、Vaultに対するアクセスの記録を[監査ログ](https://www.vaultproject.io/docs/audit)として取得することができます。

コンフィグサーバは、デフォルトではVaultの監査ログを有効にしていませんが、追加の設定を行うことで監査ログを記録することができます。ここではその設定手順を示します。

主な手順は以下のようになります。

1. 監査ログの出力先となるディレクトリをコンテナ設定に追加する
1. 監査ログを有効にする

> 監査ログの出力先は [syslog](https://www.vaultproject.io/docs/audit/syslog)や[socket](https://www.vaultproject.io/docs/audit/socket)を指定することも出来ますが、ここでは[ファイル](https://www.vaultproject.io/docs/audit/file)へ出力する設定手順を示します。

### 3.1. 監査ログの出力先となるディレクトリをコンテナ設定に追加する

監査ログの出力先となるディレクトリを作成し、そのディレクトリをVaultコンテナに bind mount する設定を追加します。

まず出力先となるディレクトリを作成します。

```console
$ mkdir -p vault-logs
```

次に `docker-compose.yml`を編集してVaultコンテナの設定を変更します。`docker-compose.yml`の`vault`サービスの`volumes`設定に以下の記述を追加してください。

```yml
      - type: bind
        source: ./vault-logs
        target: /vault/logs
```

編集後の`docker-compose.yml`は以下のようになります。

```yml
version: '3.8'
services:
(中略)
  vault:
    image: &vault_image vault:${VAULT_VERSION:-1.9.0}
    restart: always
    volumes:
      - &vault_vol
        type: volume
        source: vault
        target: /vault/file
      - type: bind
        source: ./vault-logs
        target: /vault/logs
(以下略)
```

差分は以下のようになります。

```diff
--- a/docker-compose.yml
+++ b/docker-compose.yml
@@ -53,6 +53,9 @@ services:
         type: volume
         source: vault
         target: /vault/file
+      - type: bind
+        source: ./vault-logs
+        target: /vault/logs
     environment: &vault_env
       VAULT_LOCAL_CONFIG: '{"listener": {"tcp": {"address": "[::]:8200", "tls_disable": 1}}, "storage": {"file": {"path": "/vault/file"}}}'
     command: server
```

`docker-compose.yml`の変更をコンテナに反映させるために Vault コンテナの再作成を指示します。通常の手順でコンフィグサーバの起動スクリプトを実行してください。

```console
$ ./sscfg.sh --start
[+] Running 6/6
 ⠿ Container sscfg-vault-1       Started                1.4s
 ⠿ Container sscfg-nginx-1       Running                0.0s
 ⠿ Container sscfg-redis-1       Running                0.0s
 ⠿ Container sscfg-shibboleth-1  Running                0.0s
 ⠿ Container sscfg-nodejs-1      Running                0.0s
 ⠿ Container sscfg-postgres-1    Running                0.0s
=============================
You need to unseal the Vault.
=============================
```

コンテナを再作成したので vault が seal 状態になっています。`vault_unseal.sh`を所定の回数実行して unseal key を入力し unseal 状態にしてください。

### 3.2. 監査ログを有効にする

監査ログを有効にするには、実行中の Vault コンテナの中で [`vault audit`](https://www.vaultproject.io/docs/audit) コマンドを実行します。

具体的な実行例を以下に示します。

まずVaultコンテナ内のシェルを `docker compose`で起動します。シェルの起動に成功するとプロンプト`/ #`が表示されます。

```console
$ docker compose exec vault sh
/ # 
```

> 上記の例では Docker Compose v2 を用いています。Docker Compose v1 を利用している環境では `docker compose`のかわりに `docker-compose` を用いてください。

次に、コンテナ内のシェルでvaultのアドレスとトークンを環境変数に設定します。トークンについてはシェルの履歴に残さないようにするために`cat`コマンドで標準入力から入力します（`cat`の入力を終えるには `ctrl-d`などをタイプしてください）。

```console
/ # export VAULT_ADDR=http://localhost:8200
/ # export VAULT_TOKEN=$(cat)
XXXXXXXXXXXXXXXXXXXXXXXXXX
/ #
```

ここで環境変数 `VAULT_TOKEN` に設定するトークンには、コンフィグサーバのセットアップ時に表示された root トークンを入力してください。

> `.env.sscfg`に記録されている`VAULT_TOKEN`の値などを設定するとアクセス権が不足しているため、監査ログの設定でエラーとなります。

変更前の監査ログの設定状況を確認します。

```console
/ # vault audit list
No audit devices are enabled.
/ #
```

監査ログの設定を行います。

```console
/ # vault audit enable file file_path=/vault/logs/audit.log
Success! Enabled the file audit device at: file/
/ #
```

上記の例ではコンテナ内のログ出力先を `/vault/logs/audit.log` としています。出力先ディレクトリを `/vault/logs/` とすることで、コンテナの外側では前節でbind mountを設定したディレクトリ`./vault-logs/`にログファイルが出力されます。

以上の操作でVaultの監査ログが有効になります。コンテナのシェルを `exit` して、コンテナの外側で監査ログファイルが存在していることを確認してください。

```console
/ # exit
$ ls -n vault-logs/
total 4
-rw------- 1 100 1000 1319 Nov 17 03:47 audit.log
```


ここで示した手順では、コンテナ内で実行する `vault audit enable`コマンドに`file_path`で出力先のファイル名のみを指定しています。他オプションの指定方法などの`vault audit enable`コマンドの詳細については以下に示すリンク先を参照してください。

* [File Audit Device - Configuration](https://www.vaultproject.io/docs/audit/file#configuration-1)
