---
title: ユーザパラメータ更新ダイアログ
---

ユーザパラメータを更新するためのダイアログです。パラメータの更新では設定値の指定方法（直接入力かファイル指定か）を変更することはできません。登録時と同じ方法で入力するので、ダイアログの表示もそれぞれで異なります。

入力方法を変更したい場合はいったん削除してから改めて登録しなおす必要があります。

### 設定値が直接入力で登録されている場合

![ユーザパラメータ更新ダイアログ1](../img/screen-421-01.png)

ダイアログに表示されている各項目についての説明を下表に示します。

|項目名|変更|必須|説明|
|---|---|---|---|
|ユーザ名|×||パラメータの対象となるユーザ名を表示します。|
|設定値|〇||パラメータの設定値を指定します。秘匿フラグがオンの場合は空欄になっていることがあります。設定内容を変更しない場合は空欄のままにしてください。|
|秘匿情報|〇||秘匿情報フラグを指定します。フラグをオンに設定すると、登録された値をコンフィグサーバから取得する場合に暗号化されます。|
|埋め込み先|〇|〇|ユーザパラメータをSINETStreamの設定ファイルに埋め込む先を指定します。指定する文字列の例は[ユーザパラメータ登録ダイアログの記述](../screen-411/#埋め込み先の指定について)を参照してください。|
|コメント|〇||ユーザパラメータに対するコメントを入力してください。任意の内容を入力できます。|
|設定ファイルの適用対象|〇||有効フラグを指定します。オンに設定されている場合、このユーザパラメータをSINETStream設定ファイルの埋め込み対象とします。|

### 設定値がファイル選択で登録されている場合

![ユーザパラメータ更新ダイアログ2](../img/screen-421-02.png)

ダイアログに表示されている各項目についての説明を下表に示します。

|項目名|変更|必須|説明|
|---|---|---|---|
|ユーザ名|×||パラメータの対象となるユーザ名を表示します。|
|設定値のファイル|〇||パラメータとして設定ファイルに埋め込む値をファイルで指定します。ファイル選択のダイアログが表示されるのでファイルを指定してください。設定内容を変更しない場合は空欄のままにしてください。|
|秘匿情報|〇||秘匿情報フラグを指定します。フラグをオンに設定すると、登録された値をコンフィグサーバから取得する場合に暗号化されます。|
|埋め込み先|〇|〇|ユーザパラメータをSINETStreamの設定ファイルに埋め込む先を指定します。指定する文字列の例は[ユーザパラメータ登録ダイアログの記述](../screen-411/#埋め込み先の指定について)を参照してください。|
|コメント|〇||ユーザパラメータに対するコメントを入力してください。任意の内容を入力できます。|
|設定ファイルの適用対象|〇||有効フラグを指定します。オンに設定されている場合、このユーザパラメータをSINETStream設定ファイルの埋め込み対象とします。|


### 携帯端末での表示

携帯端末などの表示幅が狭い端末で更新ダイアログを表示した場合、下図のような全画面表示のダイアログとなります。

![ユーザパラメータダイアログ1-携帯端末](../img/screen-421-03.png)

![ユーザパラメータダイアログ2-携帯端末](../img/screen-421-04.png)

全画面ダイアログ表示では、更新ボタンが右上に、キャンセルボタンが左上に表示されます。
