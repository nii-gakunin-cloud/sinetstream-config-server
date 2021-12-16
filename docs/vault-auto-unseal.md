# HashiCorp Vault の auto unsealについて

## 1. 概要

コンフィグサーバが利用している [HashiCorp Vault](https://www.vaultproject.io/) では、サービス起動時に unseal する操作が必要となります。これは Vault に記録されている暗号化されたデータを復号化して読みだすために必要となる操作です。Vaultのデフォルト構成では unseal を行うために Shamir の方式で秘密分散したunsealキーを閾値に達するまで入力する必要があります。この操作はサービス起動のたび行うことになるので運用上の手間が増えます。この手間の軽減を図るために HashiCorp Vault では [Auto Unseal](https://www.vaultproject.io/docs/concepts/seal#auto-unseal)の機能が提供されています。Auto Unseal機能ではクラウドの鍵管理システムなどを利用することでサービス起動時に自動的に unseal 状態にすることができます。機能の詳細や設定ファイルの記述方法については以下のページを参照してください。

* https://www.vaultproject.io/docs/concepts/seal#auto-unseal
* https://www.vaultproject.io/docs/configuration/seal

## 2. 設定

コンフィグサーバで Auto Unseal を利用する設定手順を示します。ここでは [AWS KMS](https://aws.amazon.com/jp/kms/)を利用する場合の手順を示します。他のクラウドの鍵管理システムを利用する場合も同様の手順で設定することができます。

主な手順を以下に示します。

1. AWS KMSにキーを作成する
2. Vaultの設定ファイルを作成する
3. 作成した設定ファイルをVaultコンテナに反映する
4. unseal操作を行いauto unsealに移行する

各手順の詳細について以下に記します。

### 2.1. 事前準備

Auto Unsealの設定を行う前にコンフィグサーバのバックアップを行ってください。また、この設定変更にはサービス停止を伴います。

### 2.2. AWS KMSにキーを作成する

KMSの対称キーを作成します。[AWS CLI](https://aws.amazon.com/jp/cli/)で作成する例を以下に示します。

```console
$ aws kms create-key
{
    "KeyMetadata": {
        "AWSAccountId": "XXXXXXXXXXXX",
        "KeyId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "Arn": "arn:aws:kms:ap-northeast-1:XXXXXXXXXXXX:key/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "CreationDate": 1636670949.475,
        "Enabled": true,
        "Description": "",
        "KeyUsage": "ENCRYPT_DECRYPT",
        "KeyState": "Enabled",
        "Origin": "AWS_KMS",
        "KeyManager": "CUSTOMER"
    }
}
```

コマンドからの出力にある `KeyId` の値が Vault の auto unseal 設定する際に必要となります。

KMSでの作成手順の詳細については以下のリンク先を参照してください。

* [AWS デベロッパーガイド: 対称 KMS キーを作成する](https://docs.aws.amazon.com/ja_jp/kms/latest/developerguide/create-keys.html#create-symmetric-cmk)

### 2.3. Vaultの設定ファイルを作成する

auto unseal に関する設定ファイルを作成します。作成する設定ファイルの内容は以下のようになります。

```hcl
seal "awskms" {
  kms_key_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  region     = "ap-northeast-1"
  access_key = "XXXXXXXXXXXXXXXXXXXX"
  secret_key = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

`kms_key_id`には前節で作成した KMS の `KeyId` の値を指定してください。`region`にはキーを作成したAWSのリージョンを指定してください。`access_key`, `secret_key` には AWSのアクセスキー、シークレットキーを指定してください。設定ファイルの記述に関する詳細については以下のリンク先を参照してください。

* [Vault Documentation - awskms Seal](https://www.vaultproject.io/docs/configuration/seal/awskms)

> 上記の例では指定していませんが、必要に応じて[`endpoint`](https://www.vaultproject.io/docs/configuration/seal/awskms#endpoint)を指定してください。

実行例を以下に記します。この例では設定ファイルを `vault-config/seal.hcl` に作成します。

まずVaultの設定ファイルを配置するディレクトリ`vault-config`を作成します。

```console
$ mkdir vault-config
```

次に設定ファイルを作成します。

```console
$ cat << EOF > vault-config/seal.hcl
> seal "awskms" {
>   kms_key_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
>   region     = "ap-northeast-1"
>   access_key = "XXXXXXXXXXXXXXXXXXXX"
>   secret_key = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
> }
> EOF
```

### 2.4. 作成した設定ファイルをVaultコンテナに反映する

前節で作成した設定ファイルを Vault コンテナに反映させます。

#### 2.4.1. コンテナ設定の変更

まず前節作成したVaultの設定ファイルをコンテナが読み込むことができるようにするため Vault コンテナのボリューム設定を変更します。コンテナに関する設定は `docker-compose.yml` に記述しているので、このファイルにある `vault`サービスの`volumes`設定に以下の記述を追加してください。

```yml
      - type: bind
        source: ./vault-config
        target: /vault/config
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
        source: ./vault-config
        target: /vault/config
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
+        source: ./vault-config
+        target: /vault/config
     environment: &vault_env
       VAULT_LOCAL_CONFIG: '{"listener": {"tcp": {"address": "[::]:8200", "tls_disable": 1}}, "storage": {"file": {"path": "/vault/file"}}}'
     command: server
```

#### 2.4.2. コンテナ設定変更の反映

次にコンテナへの設定変更を反映させるためにVaultコンテナを再作成します。コンフィグサーバの通常の起動手順と同様に、起動スクリプトを実行してください。

実行例を以下に示します。

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

> `sscfg.sh`からコンテナを起動するために実行しているdocker composeコマンドは`docker-compose.yml`が編集されたことを検知して Vaultコンテナの再作成を行っています。`docker-compose.yml`を変更せずに `vault-config/seal.hcl`のみを編集した場合は、明示的にVaultコンテナのみを再起動する必要があります。その場合は`sscfg.sh --restart vault`を実行してください。

### 2.5. unseal操作を行いauto unsealに移行する

Vaultコンテナのunseal操作を行うスクリプト`vault_unseal.sh`を`-migrate`フラグを指定して実行します。

```
$ ./vault_unseal.sh -migrate
Unseal Key (will be hidden): 
Key                           Value
---                           -----
Recovery Seal Type            shamir
Initialized                   true
Sealed                        true
Total Recovery Shares         5
Threshold                     3
Unseal Progress               1/3
Unseal Nonce                  3f9cbf76-d28a-8f6e-982f-8c6be63ef264
Seal Migration in Progress    true
Version                       1.9.0
Storage Type                  file
HA Enabled                    false
```

これを閾値に達するまで繰り返すことでauto unsealへの移行が行われます。

> unsealキーはauto unseal 移行後もリカバリーキーとして必要となるので、引き続き安全な場所に保管してください。

### 2.6. auto unseal されることを確認する

Vaultコンテナを再起動して auto unseal されることを確認します。

実行例を以下に示します。

```console
$ ./sscfg.sh --restart vault
[+] Running 1/1
 ⠿ Container sscfg-vault-1       Started                1.4s
$ ./vault_unseal.sh 
INFO: Already unsealed.
```

`vault_unseal.sh`スクリプトの実行結果からVaultコンテナを再起動後もunseal状態になっていることが確認できます。