/// <reference types='../support' />

import * as NodeRSA from 'node-rsa';
import * as sshpk from 'sshpk';

describe('公開鍵に関するテスト', () => {
  const { username, password, email } = Cypress.env();
  let pubKey: string;
  let fingerprint: string;
  const comment = 'comment';
  const keyFile = 'id_rsa_pub.pem';
  const badKeyFile = 'id_ed25519.pub';

  describe('ユーザ公開鍵一覧画面', () => {
    describe('公開鍵が登録されていない場合', () => {
      it('一覧画面の表示', () => {
        cy.get('header input[data-cy=search]');
        cy.get('table th').parent().as('tableHeaders');
        cy.get('@tableHeaders').contains('フィンガープリント');
        cy.get('@tableHeaders').contains('コメント');
        cy.get('@tableHeaders').contains('デフォルト');
        cy.get('@tableHeaders').contains('登録日時');
        cy.get('table td').contains('データはありません。');
      });
    });

    describe('公開鍵が登録されている場合', () => {
      let fingerprints: string[];

      it('一覧画面の表示', () => {
        cy.get('table th').parent().as('tableHeaders');
        cy.get('@tableHeaders').contains('フィンガープリント');
        cy.get('@tableHeaders').contains('コメント');
        cy.get('@tableHeaders').contains('デフォルト');
        cy.get('@tableHeaders').contains('登録日時');
        cy.get('table tbody').within(() => {
          cy.contains(fingerprints[0])
            .parents('tr').first().contains('td', `${comment} 1`);
          cy.contains(fingerprints[1])
            .parents('tr').first().contains('td', `${comment} 2`)
            .parent()
            .get('td i')
            .should('have.class', 'mdi-check');
        });
      });

      it('一覧画面の検索', () => {
        cy.get('header input[data-cy=search]').type(`${comment} 1`);
        cy.get('table tbody').within(() => {
          cy.contains(fingerprints[0])
            .parents('tr').first().contains('td', `${comment} 1`);
          cy.contains(fingerprints[1]).should('not.exist');
        });
      });

      beforeEach(() => {
        fingerprints = [];
        cy.userToken(username, password).then((token) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          cy.wrap([1, 2]).each((element, index, $list) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cy.addPublicKey(token, null, true, `${comment} ${element}`).then((resp: any) => {
              fingerprints.push(resp.body.fingerprint);
            });
          });
        });
        cy.visit('/');
        cy.visit('/public-keys').contains('ユーザ公開鍵一覧');
      });
    });

    beforeEach(() => {
      cy.userToken(username, password).then((token) => {
        cy.clearPublicKeys(token);
      });
      cy.visit('/public-keys').contains('ユーザ公開鍵一覧');
    });
  });

  describe('ユーザ公開鍵の登録ダイアログ', () => {
    let fixturesFingerprint: string;

    describe('公開鍵が登録されていない場合', () => {
      it('テキストエリアに直接入力して公開鍵を登録する', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('input[data-cy=input-default-key]').should('be.disabled').and('be.checked');
          cy.get('@btnSubmit').contains('登録');
          cy.get('@btnSubmit').should('be.disabled');
          cy.get('button[data-cy=btn-keypair-dialog]').as('btnKeypairDialog');
          cy.get('@btnKeypairDialog').should('be.enabled');
          cy.get('textarea[data-cy=input-public-key]').type(pubKey);
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('@btnKeypairDialog').should('be.disabled');
          cy.get('textarea[data-cy=input-comment]').type(comment);
          cy.get('@btnSubmit').click();
        });
        cy.contains('form header', 'ユーザ公開鍵の登録').should('not.exist');
        cy.get('table tbody').within(() => {
          cy.contains(fingerprint)
            .parents('tr').first().contains('td', comment)
            .parent()
            .get('td i')
            .should('have.class', 'mdi-check');
        });
      });

      it('ファイル選択で公開鍵を登録する', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('input[data-cy=input-default-key]').should('be.disabled').and('be.checked');
          cy.get('@btnSubmit').contains('登録');
          cy.get('@btnSubmit').should('be.disabled');
          cy.get('button[data-cy=btn-keypair-dialog]').as('btnKeypairDialog');
          cy.get('@btnKeypairDialog').should('be.enabled');
          cy.get('textarea[data-cy=input-comment]').type(comment);
          cy.get('@btnSubmit').should('be.disabled');

          cy.get('textarea[data-cy=input-public-key]')
            .parents('div.v-textarea').first()
            .prev('div.v-file-input')
            .get('input[type=file]')
            .as('inputFile');
          cy.fixture(keyFile, 'base64').then((data) => {
            cy.get('@inputFile').attachFile({
              fileContent: data,
              filePath: keyFile,
              fileName: keyFile,
              encoding: 'base64',
              mimeType: 'application/octet-stream',
            });
          });
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('@btnKeypairDialog').should('be.disabled');
          cy.get('@btnSubmit').click();
        });
        cy.contains('form header', 'ユーザ公開鍵の登録').should('not.exist');
        cy.get('table tbody').within(() => {
          cy.contains(fixturesFingerprint)
            .parents('tr').first().contains('td', comment)
            .parent()
            .get('td i')
            .should('have.class', 'mdi-check');
        });
      });

      it('登録をキャンセルする', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('input[data-cy=input-default-key]').should('be.disabled').and('be.checked');
          cy.get('@btnSubmit').contains('登録');
          cy.get('@btnSubmit').should('be.disabled');
          cy.get('button[data-cy=btn-keypair-dialog]').as('btnKeypairDialog');
          cy.get('@btnKeypairDialog').should('be.enabled');
          cy.get('textarea[data-cy=input-public-key]').type(pubKey);
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('@btnKeypairDialog').should('be.disabled');
          cy.get('textarea[data-cy=input-comment]').type(comment);
          cy.get('@btnCancel').click();
        });
        cy.contains('form header', 'ユーザ公開鍵の登録').should('not.exist');

        // 登録ダイアログを再度開く
        cy.get('button[data-cy=btn-create]').click();
        cy.contains('form header', 'ユーザ公開鍵の登録');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('input[data-cy=input-default-key]').should('be.disabled').and('be.checked');
          cy.get('@btnSubmit').contains('登録');
          cy.get('@btnSubmit').should('be.disabled');
          cy.get('textarea[data-cy=input-public-key]').should('have.value', '');
          cy.get('textarea[data-cy=input-comment]').should('have.value', '');
        });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.clearPublicKeys(token);
        });
        cy.visit('/');
        cy.visit('/public-keys').contains('ユーザ公開鍵一覧');
        cy.get('button[data-cy=btn-create]').click();
        cy.contains('form header', 'ユーザ公開鍵の登録');
      });
    });

    describe('公開鍵が登録されている場合', () => {
      it('デフォルトの公開鍵を登録する', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('input[data-cy=input-default-key]').should('be.enabled').and('be.checked');
          cy.get('@btnSubmit').contains('登録');
          cy.get('@btnSubmit').should('be.disabled');
          cy.get('textarea[data-cy=input-public-key]').type(pubKey);
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('textarea[data-cy=input-comment]').type(comment);
          cy.get('@btnSubmit').click();
        });

        cy.contains('form header', 'ユーザ公開鍵の登録').should('not.exist');
        cy.get('table tbody').within(() => {
          cy.contains(fingerprint)
            .parents('tr').first().contains('td', comment)
            .parent()
            .get('td i')
            .should('have.class', 'mdi-check');
        });
      });

      it('デフォルトでない公開鍵を登録する', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('input[data-cy=input-default-key]').should('be.enabled').and('be.checked');
          cy.get('@btnSubmit').contains('登録');
          cy.get('@btnSubmit').should('be.disabled');
          cy.get('textarea[data-cy=input-public-key]').type(pubKey);
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('textarea[data-cy=input-comment]').type(comment);
          cy.get('input[data-cy=input-default-key]').uncheck({ force: true });
          cy.get('@btnSubmit').click();
        });

        cy.contains('form header', 'ユーザ公開鍵の登録').should('not.exist');
        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).parents('tr').first().within(() => {
            cy.contains('td', comment);
            cy.get('td i.mdi-check').should('not.exist');
          });
        });
      });

      it('登録をキャンセルする', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('input[data-cy=input-default-key]').should('be.enabled').and('be.checked');
          cy.get('@btnSubmit').contains('登録');
          cy.get('@btnSubmit').should('be.disabled');
          cy.get('textarea[data-cy=input-public-key]').type(pubKey);
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('textarea[data-cy=input-comment]').type(comment);
          cy.get('input[data-cy=input-default-key]').uncheck({ force: true });
          cy.get('@btnCancel').click();
        });
        cy.contains('form header', 'ユーザ公開鍵の登録').should('not.exist');

        // 登録ダイアログを再度開く
        cy.get('button[data-cy=btn-create]').click();
        cy.contains('form header', 'ユーザ公開鍵の登録');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('input[data-cy=input-default-key]').should('be.enabled').and('be.checked');
          cy.get('@btnSubmit').contains('登録');
          cy.get('@btnSubmit').should('be.disabled');
          cy.get('textarea[data-cy=input-public-key]').should('have.value', '');
          cy.get('textarea[data-cy=input-comment]').should('have.value', '');
        });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.clearPublicKeys(token);
          cy.addPublicKey(token);
        });
        cy.visit('/');
        cy.visit('/public-keys').contains('ユーザ公開鍵一覧');
        cy.get('button[data-cy=btn-create]').click();
        cy.contains('form header', 'ユーザ公開鍵の登録');
      });
    });

    describe('異常系', () => {
      it('RSAでない公開鍵を登録する', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('input[data-cy=input-default-key]').should('be.disabled').and('be.checked');
          cy.get('@btnSubmit').contains('登録');
          cy.get('@btnSubmit').should('be.disabled');
          cy.get('textarea[data-cy=input-comment]').type(comment);
          cy.get('@btnSubmit').should('be.disabled');

          cy.get('textarea[data-cy=input-public-key]')
            .parents('div.v-textarea').first()
            .prev('div.v-file-input')
            .get('input[type=file]')
            .as('inputFile');
          cy.fixture(badKeyFile, 'base64').then((data) => {
            cy.get('@inputFile').attachFile({
              fileContent: data,
              filePath: badKeyFile,
              fileName: badKeyFile,
              encoding: 'base64',
              mimeType: 'application/octet-stream',
            });
          });
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('@btnSubmit').click();

          // エラーメッセージが表示されること
          cy.get('textarea[data-cy=input-public-key]')
            .parents('div.v-textarea').first().within(() => {
              cy.get('div.error--text .v-messages__message')
                .should('have.text', 'RSA暗号の公開鍵ではありません');
            });
        });

        // エラー後に登録できること
        cy.get('@dialogForm').within(() => {
          cy.fixture(keyFile, 'base64').then((data) => {
            cy.get('@inputFile').attachFile({
              fileContent: data,
              filePath: keyFile,
              fileName: keyFile,
              encoding: 'base64',
              mimeType: 'application/octet-stream',
            });
          });
          cy.get('textarea[data-cy=input-public-key]')
            .should('include.value', 'BEGIN RSA PUBLIC KEY');
          cy.get('@btnSubmit').click();
        });

        cy.contains('form header', 'ユーザ公開鍵の登録').should('not.exist');
        cy.get('table tbody').within(() => {
          cy.contains(fixturesFingerprint)
            .parent().get('td').contains(comment)
            .parent()
            .get('td i')
            .should('have.class', 'mdi-check');
        });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.clearPublicKeys(token);
        });
        cy.visit('/');
        cy.visit('/public-keys').contains('ユーザ公開鍵一覧');
        cy.get('button[data-cy=btn-create]').click();
        cy.contains('form header', 'ユーザ公開鍵の登録');
      });
    });

    before(() => {
      cy.readFile('tests/e2e/fixtures/id_rsa_pub.pem').then((c) => {
        fixturesFingerprint = sshpk.parseKey(c, 'auto').fingerprint('sha256').toString();
      });
    });
  });

  describe('キーペア生成ダイアログ', () => {
    it('キーペア生成の実行', () => {
      cy.get('textarea[data-cy=input-public-key]').as('inputPublicKey');
      cy.get('@inputPublicKey').should('have.value', '');
      cy.get('button[data-cy=btn-keypair-dialog]').as('btnKeypairDialog');
      cy.get('@btnKeypairDialog').should('be.enabled');
      cy.get('@btnKeypairDialog').click();
      cy.get('header').contains('キーペアの生成');

      cy.get('button[data-cy=btn-keypair-exec]').as('btnExec');
      cy.get('@btnExec').should('be.enabled');
      cy.get('button[data-cy=btn-keypair-close]').as('btnClose');
      cy.get('@btnClose').should('be.enabled');

      cy.get('@btnExec').click();
      cy.get('@btnExec').should('not.exist');
      cy.get('@btnClose').should('be.enabled');
      cy.get('a[data-cy=btn-keypair-download]', { timeout: 120000 }).as('btnDownload');
      cy.get('@btnClose').should('be.disabled');

      cy.get('@btnDownload').click();
      cy.get('@btnClose').should('be.enabled');

      cy.get('@btnDownload').downloadBlob().then((dl) => {
        cy.wrap(dl).should('contain', 'BEGIN RSA PRIVATE KEY');
        const privKey = sshpk.parsePrivateKey(dl, 'auto');
        const fingerprint1 = privKey.toPublic().fingerprint('sha256').toString();

        cy.get('@btnClose').click();
        cy.get('header').contains('キーペアの生成').should('not.exist');
        cy.get('@btnKeypairDialog').should('be.disabled');

        cy.get('@inputPublicKey').invoke('val').then((v) => {
          const pubKey0 = sshpk.parseKey(v.toString(), 'auto');
          const fingerprint0 = pubKey0.fingerprint('sha256').toString();
          cy.wrap(fingerprint1).should('equal', fingerprint0);
        });

        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').should('be.enabled');
        cy.get('@btnSubmit').click();
        cy.contains('form header', 'ユーザ公開鍵の登録').should('not.exist');
        cy.get('table tbody td').contains(fingerprint1).parents('tr').first()
          .within(() => {
            cy.get('td i').should('have.class', 'mdi-check');
          });
      });
    });

    it('閉じるボタン', () => {
      cy.get('textarea[data-cy=input-public-key]').as('inputPublicKey');
      cy.get('@inputPublicKey').should('have.value', '');
      cy.get('button[data-cy=btn-keypair-dialog]').as('btnKeypairDialog');
      cy.get('@btnKeypairDialog').should('be.enabled');
      cy.get('@btnKeypairDialog').click();
      cy.get('header').contains('キーペアの生成');

      cy.get('button[data-cy=btn-keypair-exec]').as('btnExec');
      cy.get('@btnExec').should('be.enabled');
      cy.get('button[data-cy=btn-keypair-close]').as('btnClose');
      cy.get('@btnClose').should('be.enabled');
      cy.get('@btnClose').click();

      cy.get('header').contains('キーペアの生成').should('not.exist');
      cy.get('@btnKeypairDialog').should('be.enabled');
      cy.get('button[data-cy=btn-dialog-submit]').should('be.disabled');
    });

    it('キーペア生成の中断', () => {
      cy.get('textarea[data-cy=input-public-key]').as('inputPublicKey');
      cy.get('@inputPublicKey').should('have.value', '');
      cy.get('button[data-cy=btn-keypair-dialog]').as('btnKeypairDialog');
      cy.get('@btnKeypairDialog').should('be.enabled');
      cy.get('@btnKeypairDialog').click();
      cy.get('header').contains('キーペアの生成');

      cy.get('button[data-cy=btn-keypair-exec]').as('btnExec');
      cy.get('@btnExec').should('be.enabled');
      cy.get('button[data-cy=btn-keypair-close]').as('btnClose');
      cy.get('@btnClose').should('be.enabled');

      cy.get('@btnExec').click();
      cy.get('@btnExec').should('not.exist');
      cy.get('@btnClose').should('be.enabled');
      cy.get('@btnClose').click();

      cy.get('header').contains('キーペアの生成').should('not.exist');
      cy.get('@btnKeypairDialog').should('be.enabled');
      cy.get('button[data-cy=btn-dialog-submit]').should('be.disabled');
    });

    beforeEach(() => {
      cy.userToken(username, password).then((token) => {
        cy.clearPublicKeys(token);
      });
      cy.visit('/');
      cy.visit('/public-keys').contains('ユーザ公開鍵一覧');
      cy.get('button[data-cy=btn-create]').click();
      cy.contains('form header', 'ユーザ公開鍵の登録');
    });
  });

  describe('ユーザ公開鍵の更新ダイアログ', () => {
    describe('操作対象以外の公開鍵が登録されていない場合', () => {
      it('コメントの変更', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('textarea[data-cy=input-comment]').as('inputComment');
          cy.get('@inputComment').should('have.value', '');
          cy.get('@btnSubmit').contains('更新');
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('input[data-cy=input-default-key]')
            .should('be.disabled').and('be.checked');

          cy.get('input[data-cy=input-fingerprint]')
            .should('have.value', fingerprint).and('have.attr', 'readonly');
          cy.get('input[data-cy=input-created-at]').should('have.attr', 'readonly');

          cy.get('@inputComment').type(comment);
          cy.get('@btnSubmit').click();
        });
        cy.contains('ユーザ公開鍵情報の更新').should('not.exist');

        cy.get('table tbody').within(() => {
          cy.contains(fingerprint)
            .parents('tr').first().contains('td', comment)
            .parent()
            .get('td i')
            .should('have.class', 'mdi-check');
        });
      });

      it('キャンセルボタン', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('textarea[data-cy=input-comment]').as('inputComment');
          cy.get('@inputComment').should('have.value', '');
          cy.get('input[data-cy=input-default-key]')
            .should('be.disabled').and('be.checked');
          cy.get('input[data-cy=input-fingerprint]')
            .should('have.value', fingerprint).and('have.attr', 'readonly');
          cy.get('input[data-cy=input-created-at]').should('have.attr', 'readonly');
          cy.get('@inputComment').type(comment);
          cy.get('@btnCancel').click();
        });
        cy.contains('ユーザ公開鍵情報の更新').should('not.exist');

        // 更新ダイアログを再度開く
        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).parents('tr').first().within(() => {
            cy.get('button[data-cy=btn-update-public-key]').click();
          });
        });
        cy.contains('ユーザ公開鍵情報の更新');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('input[data-cy=input-default-key]')
            .should('be.disabled').and('be.checked');
          cy.get('textarea[data-cy=input-comment]').should('have.value', '');
        });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.clearPublicKeys(token);
          cy.addPublicKey(token, pubKey, true);
        });
        cy.visit('/');
        cy.visit('/public-keys').contains('ユーザ公開鍵一覧');
        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).parents('tr').first().within(() => {
            cy.get('button[data-cy=btn-update-public-key]').click();
          });
        });
        cy.contains('ユーザ公開鍵情報の更新');
      });
    });

    describe('操作対象以外の公開鍵が登録されている場合', () => {
      it('コメントの変更', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('textarea[data-cy=input-comment]').as('inputComment');
          cy.get('@inputComment').should('have.value', '');
          cy.get('@btnSubmit').contains('更新');
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('input[data-cy=input-default-key]')
            .should('be.enabled').and('be.checked');

          cy.get('input[data-cy=input-fingerprint]')
            .should('have.value', fingerprint).and('have.attr', 'readonly');
          cy.get('input[data-cy=input-created-at]').should('have.attr', 'readonly');

          cy.get('@inputComment').type(comment);
          cy.get('@btnSubmit').click();
        });
        cy.contains('ユーザ公開鍵情報の更新').should('not.exist');

        cy.get('table tbody').within(() => {
          cy.contains(fingerprint)
            .parents('tr').first().contains('td', comment)
            .parent()
            .get('td i')
            .should('have.class', 'mdi-check');
        });
      });

      it('デフォルトフラグの変更', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('textarea[data-cy=input-comment]').as('inputComment');
          cy.get('@inputComment').should('have.value', '');
          cy.get('@inputComment').type(comment);

          cy.get('input[data-cy=input-default-key]').as('inputDefaultKey');
          cy.get('@inputDefaultKey').should('be.enabled').and('be.checked');
          cy.get('@inputDefaultKey').uncheck({ force: true });

          cy.get('input[data-cy=input-fingerprint]')
            .should('have.value', fingerprint).and('have.attr', 'readonly');
          cy.get('input[data-cy=input-created-at]').should('have.attr', 'readonly');

          cy.get('@btnSubmit').contains('更新');
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('@btnSubmit').click();
        });
        cy.contains('ユーザ公開鍵情報の更新').should('not.exist');

        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).parents('tr').first().within(() => {
            cy.contains('td', comment);
            cy.get('td i.mdi-check').should('not.exist');
          });
          cy.get('td i.mdi-check').should('exist');
        });
      });

      it('キャンセルボタン', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('textarea[data-cy=input-comment]').as('inputComment');
          cy.get('@inputComment').should('have.value', '');
          cy.get('input[data-cy=input-default-key]')
            .should('be.enabled').and('be.checked');
          cy.get('input[data-cy=input-fingerprint]')
            .should('have.value', fingerprint).and('have.attr', 'readonly');
          cy.get('input[data-cy=input-created-at]').should('have.attr', 'readonly');
          cy.get('@inputComment').type(comment);
          cy.get('@btnCancel').click();
        });
        cy.contains('ユーザ公開鍵情報の更新').should('not.exist');

        // 更新ダイアログを再度開く
        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).parents('tr').first().within(() => {
            cy.get('button[data-cy=btn-update-public-key]').click();
          });
        });
        cy.contains('ユーザ公開鍵情報の更新');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('input[data-cy=input-default-key]')
            .should('be.enabled').and('be.checked');
          cy.get('textarea[data-cy=input-comment]').should('have.value', '');
        });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.clearPublicKeys(token);
          cy.addPublicKey(token);
          cy.addPublicKey(token, pubKey, true);
        });
        cy.visit('/');
        cy.visit('/public-keys').contains('ユーザ公開鍵一覧');
        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).parents('tr').first().within(() => {
            cy.get('button[data-cy=btn-update-public-key]').click();
          });
        });
        cy.contains('ユーザ公開鍵情報の更新');
      });
    });

    describe('操作対象以外のデフォルト公開鍵が登録されている場合', () => {
      it('デフォルトフラグの変更', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('textarea[data-cy=input-comment]').as('inputComment');
          cy.get('@inputComment').should('have.value', '');
          cy.get('@inputComment').type(comment);

          cy.get('input[data-cy=input-default-key]').as('inputDefaultKey');
          cy.get('@inputDefaultKey').should('be.enabled').and('not.be.checked');
          cy.get('@inputDefaultKey').check({ force: true });

          cy.get('input[data-cy=input-fingerprint]')
            .should('have.value', fingerprint).and('have.attr', 'readonly');
          cy.get('input[data-cy=input-created-at]').should('have.attr', 'readonly');

          cy.get('@btnSubmit').contains('更新');
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('@btnSubmit').click();
        });
        cy.contains('ユーザ公開鍵情報の更新').should('not.exist');

        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).parents('tr').first().within(() => {
            cy.get('td').contains(comment);
            cy.get('td i').should('have.class', 'mdi-check');
          });
        });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.clearPublicKeys(token);
          cy.addPublicKey(token);
          cy.addPublicKey(token, pubKey, false);
        });
        cy.visit('/');
        cy.visit('/public-keys').contains('ユーザ公開鍵一覧');
        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).parents('tr').first().within(() => {
            cy.get('button[data-cy=btn-update-public-key]').click();
          });
        });
        cy.contains('ユーザ公開鍵情報の更新');
      });
    });
  });

  describe('ユーザ公開鍵の削除ダイアログ', () => {
    describe('操作対象以外の公開鍵が登録されていない場合', () => {
      it('削除の実行', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('削除');
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('input[data-cy=input-fingerprint]')
            .should('have.value', fingerprint).and('have.attr', 'readonly');
          cy.get('textarea[data-cy=input-comment]')
            .should('have.value', comment).should('have.attr', 'readonly');
          cy.get('input[data-cy=input-created-at]')
            .should('have.attr', 'readonly');
          cy.get('input[data-cy=input-default-key]')
            .should('be.disabled').and('be.checked');
          cy.get('@btnSubmit').click();
        });
        cy.contains('ユーザ公開鍵の削除').should('not.exist');

        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).should('not.exist');
          cy.contains('データはありません。');
        });
      });

      it('キャンセルボタン', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('削除');
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('input[data-cy=input-fingerprint]')
            .should('have.value', fingerprint).and('have.attr', 'readonly');
          cy.get('textarea[data-cy=input-comment]')
            .should('have.value', comment).should('have.attr', 'readonly');
          cy.get('input[data-cy=input-created-at]')
            .should('have.attr', 'readonly');
          cy.get('input[data-cy=input-default-key]')
            .should('be.disabled').and('be.checked');
          cy.get('@btnCancel').click();
        });
        cy.contains('ユーザ公開鍵の削除').should('not.exist');

        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).parents('tr').first().within(() => {
            cy.get('td').contains(comment);
            cy.get('td i').should('have.class', 'mdi-check');
          });
        });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.clearPublicKeys(token);
          cy.addPublicKey(token, pubKey, true, comment);
        });
        cy.visit('/');
        cy.visit('/public-keys').contains('ユーザ公開鍵一覧');
        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).parents('tr').first().within(() => {
            cy.get('button[data-cy=btn-remove-public-key]').click();
          });
        });
        cy.contains('ユーザ公開鍵の削除');
      });
    });

    describe('操作対象以外の公開鍵が登録されている場合', () => {
      it('削除の実行', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('削除');
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('input[data-cy=input-fingerprint]')
            .should('have.value', fingerprint).and('have.attr', 'readonly');
          cy.get('textarea[data-cy=input-comment]')
            .should('have.value', comment).should('have.attr', 'readonly');
          cy.get('input[data-cy=input-created-at]')
            .should('have.attr', 'readonly');
          cy.get('input[data-cy=input-default-key]')
            .should('be.disabled').and('be.checked');
          cy.get('@btnSubmit').click();
        });
        cy.contains('ユーザ公開鍵の削除').should('not.exist');

        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).should('not.exist');
          cy.get('td i').should('have.class', 'mdi-check');
        });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.clearPublicKeys(token);
          cy.addPublicKey(token);
          cy.addPublicKey(token, pubKey, true, comment);
        });
        cy.visit('/');
        cy.visit('/public-keys').contains('ユーザ公開鍵一覧');
        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).parents('tr').first().within(() => {
            cy.get('button[data-cy=btn-remove-public-key]').click();
          });
        });
        cy.contains('ユーザ公開鍵の削除');
      });
    });

    describe('操作対象以外のデフォルト公開鍵が登録されている場合', () => {
      it('削除の実行', () => {
        cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
        cy.get('@btnSubmit').parents('form').first().as('dialogForm');
        cy.get('@dialogForm').within(() => {
          cy.get('@btnSubmit').contains('削除');
          cy.get('@btnSubmit').should('be.enabled');
          cy.get('input[data-cy=input-fingerprint]')
            .should('have.value', fingerprint).and('have.attr', 'readonly');
          cy.get('textarea[data-cy=input-comment]')
            .should('have.value', comment).should('have.attr', 'readonly');
          cy.get('input[data-cy=input-created-at]')
            .should('have.attr', 'readonly');
          cy.get('input[data-cy=input-default-key]')
            .should('be.disabled').and('not.be.checked');
          cy.get('@btnSubmit').click();
        });
        cy.contains('ユーザ公開鍵の削除').should('not.exist');

        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).should('not.exist');
          cy.get('td i').should('have.class', 'mdi-check');
        });
      });

      beforeEach(() => {
        cy.userToken(username, password).then((token) => {
          cy.clearPublicKeys(token);
          cy.addPublicKey(token);
          cy.addPublicKey(token, pubKey, false, comment);
        });
        cy.visit('/');
        cy.visit('/public-keys').contains('ユーザ公開鍵一覧');
        cy.get('table tbody').within(() => {
          cy.contains(fingerprint).parents('tr').first().within(() => {
            cy.get('button[data-cy=btn-remove-public-key]').click();
          });
        });
        cy.contains('ユーザ公開鍵の削除');
      });
    });
  });

  beforeEach(() => {
    cy.login(username, password);
  });

  before(() => {
    cy.findUserId(username).then((uid) => {
      const userInfo = { password, email };
      if (uid == null) {
        cy.addUser({ name: username, ...userInfo });
      } else {
        cy.updateUser(uid, userInfo);
      }
    });

    const rsa = new NodeRSA();
    rsa.generateKeyPair();
    pubKey = rsa.exportKey('public');
    fingerprint = sshpk.parseKey(pubKey, 'auto').fingerprint('sha256').toString();
  });
});
