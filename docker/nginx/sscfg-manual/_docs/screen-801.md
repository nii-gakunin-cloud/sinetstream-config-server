---
title: ユーザプロフィール画面
---

ログインしているユーザのプロフィールを表示します。

![ユーザプロフィール画面](../img/screen-801-01.png)

この画面ではログインしているユーザのプロフィールを表示します。メールアドレス、表示名についてはそれぞれの入力欄の値を変更後に「保存」ボタンをクリックすることで登録内容を変更することが出来ます。

表示されている項目についての説明を下表に示します。

|項目名|変更|説明|
|---|---|---|
|名前|×|ユーザ名を表示します。ローカル認証のユーザの場合はシステム管理者によって登録されたユーザ名となります。学認連携認証のユーザの場合は ePPN となります。|
|メールアドレス|〇|メールアドレスを表示します。コンフィグサーバでユーザのアバターを表示する場合、メールアドレスに対応するアバターを[Gravatar](https://ja.gravatar.com/)から取得して表示しています。。|
|表示名|〇|ユーザの表示名を表示します。コンフィグサーバでユーザを表示する場合、ツールチップに表示名で設定された値を表示します。|

### 操作ボタン

下部に配置されているボタンについての説明を下表に示します。

|項目名|説明|
|---|---|
|保存|「メールアドレス」「表示名」の変更内容を登録します。|
|リセット|「メールアドレス」「表示名」の入力欄の値を登録内容に戻します。|
|戻る|ユーザプロフィール画面に遷移する前の画面に戻ります。
|パスワード変更|[パスワード変更ダイアログ](../screen-811)を表示します。ローカル認証のユーザとしてログインした場合のみ表示されます。|