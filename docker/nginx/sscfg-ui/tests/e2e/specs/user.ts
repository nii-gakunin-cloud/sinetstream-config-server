/// <reference types='../support' />

describe('ユーザ情報に関するテスト', () => {
  const {
    username, password, email, display_name: displayName,
  } = Cypress.env();

  describe('ユーザプロフィール画面', () => {
    it('表示要素の確認', () => {
      cy.contains('label', '名前').next('input')
        .should('have.value', username).and('have.attr', 'readonly');
      cy.contains('label', 'メールアドレス').next('input')
        .should('have.value', email);
      cy.contains('label', '表示名').next('input')
        .should('have.value', displayName);
    });

    it('リセットボタン', () => {
      cy.contains('label', 'メールアドレス').next('input')
        .clear().type(`new-${email}`);
      cy.contains('label', '表示名').next('input')
        .clear().type(`new-${displayName}`);
      cy.get('button[data-cy=btn-reset]').click();

      cy.contains('label', '名前').next('input')
        .should('have.value', username);
      cy.contains('label', 'メールアドレス').next('input')
        .should('have.value', email);
      cy.contains('label', '表示名').next('input')
        .should('have.value', displayName);
    });

    it('プロフィールの更新', () => {
      const newEmail = `new-${email}`;
      const newDisplayName = `new-${displayName}`;
      cy.contains('label', 'メールアドレス').next('input')
        .clear().type(newEmail);
      cy.contains('label', '表示名').next('input')
        .clear().type(newDisplayName);
      cy.get('button[type=submit]').click();

      cy.visit('/').contains('SINETStream コンフィグサーバ');
      cy.visit('/user-profile').contains('ユーザプロフィール');
      cy.contains('label', '名前').next('input')
        .should('have.value', username);
      cy.contains('label', 'メールアドレス').next('input')
        .should('have.value', newEmail);
      cy.contains('label', '表示名').next('input')
        .should('have.value', newDisplayName);
    });

    it('戻るボタン', () => {
      cy.visit('/').contains('SINETStream コンフィグサーバ');
      cy.get('button[data-cy=nav-icon]').click();
      cy.get('nav').get('a[data-cy=menu-user-profile]').click();
      cy.contains('ユーザプロフィール');

      cy.get('button[data-cy=btn-back]').click();
      cy.contains('SINETStream コンフィグサーバ');
    });

    beforeEach(() => {
      cy.visit('/user-profile').contains('ユーザプロフィール');
    });
  });

  describe('パスワード変更ダイアログ', () => {
    it('パスワードの変更', () => {
      const newPassword = `new-${password}`;
      cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
      cy.get('@btnSubmit').should('be.disabled');

      cy.contains('label', '現在のパスワード').next('input[type=password]')
        .clear().type(password);
      cy.get('@btnSubmit').should('be.disabled');

      cy.contains('label', '新しいパスワード').next('input[type=password]')
        .clear().type(newPassword);
      cy.get('@btnSubmit').should('be.disabled');

      cy.contains('label', '新しいパスワード:確認').next('input[type=password]')
        .clear().type(newPassword);
      cy.get('@btnSubmit').should('be.enabled');

      cy.get('@btnSubmit').click();
      cy.contains('パスワードの変更').should('not.exist');

      cy.logout();
      cy.login(username, newPassword);
      cy.visit('/').contains('SINETStream コンフィグサーバ');
    });

    it('キャンセルする', () => {
      const newPassword = `new-${password}`;
      cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
      cy.get('button[data-cy=btn-dialog-cancel]').as('btnCancel');
      cy.get('@btnSubmit').should('be.disabled');
      cy.get('@btnCancel').should('be.enabled');

      cy.contains('label', '現在のパスワード').next('input[type=password]')
        .clear().type(password);
      cy.get('@btnSubmit').should('be.disabled');

      cy.contains('label', '新しいパスワード').next('input[type=password]')
        .clear().type(newPassword);
      cy.get('@btnSubmit').should('be.disabled');

      cy.contains('label', '新しいパスワード:確認').next('input[type=password]')
        .clear().type(newPassword);
      cy.get('@btnSubmit').should('be.enabled');

      cy.get('@btnCancel').click();
      cy.contains('パスワードの変更').should('not.exist');

      cy.logout();
      cy.login(username, password);
      cy.visit('/').contains('SINETStream コンフィグサーバ');
    });

    it('確認用パスワードが一致していない', () => {
      const newPassword = `new-${password}`;
      cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
      cy.get('@btnSubmit').should('be.disabled');

      cy.contains('label', '現在のパスワード').next('input').clear().type(password);
      cy.get('@btnSubmit').should('be.disabled');

      cy.contains('label', '新しいパスワード').next('input').clear().type(newPassword);
      cy.get('@btnSubmit').should('be.disabled');

      cy.contains('label', '新しいパスワード:確認').as('confirm');
      cy.get('@confirm').next('input').clear().type(password);
      cy.get('@confirm').parents('div.v-input__control').first().within(() => {
        cy.get('div.error--text .v-messages__message').should('not.be.empty');
      });
      cy.get('@btnSubmit').should('be.disabled');
    });

    it('変更前パスワードが正しくない', () => {
      const badPassword = `bad-${password}`;
      const newPassword = `new-${password}`;
      cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
      cy.get('@btnSubmit').should('be.disabled');

      cy.contains('label', '現在のパスワード').as('password');
      cy.get('@password').next('input').clear().type(badPassword);

      cy.contains('label', '新しいパスワード').next('input').clear().type(newPassword);
      cy.contains('label', '新しいパスワード:確認').next('input').clear().type(newPassword);
      cy.get('@btnSubmit').should('be.enabled');
      cy.get('@btnSubmit').click();

      cy.get('@password').parents('div.v-input__control').first().within(() => {
        cy.get('div.error--text .v-messages__message').should('not.be.empty');
      });
      cy.get('@btnSubmit').should('be.disabled');
    });

    it('エラー後に再実行する', () => {
      const badPassword = `bad-${password}`;
      const newPassword = `new-${password}`;
      cy.get('button[data-cy=btn-dialog-submit]').as('btnSubmit');
      cy.get('@btnSubmit').should('be.disabled');

      cy.contains('label', '現在のパスワード').as('password');
      cy.get('@password').next('input').clear().type(badPassword);

      cy.contains('label', '新しいパスワード').next('input').clear().type(newPassword);
      cy.contains('label', '新しいパスワード:確認').next('input').clear().type(newPassword);
      cy.get('@btnSubmit').should('be.enabled');
      cy.get('@btnSubmit').click();

      cy.get('@password').parents('div.v-input__control').first().within(() => {
        cy.get('div.error--text .v-messages__message').should('not.be.empty');
      });
      cy.get('@btnSubmit').should('be.disabled');

      cy.get('@password').next('input').clear().type(password);
      cy.get('@btnSubmit').should('be.enabled');

      cy.get('@btnSubmit').click();
      cy.contains('パスワードの変更').should('not.exist');

      cy.logout();
      cy.login(username, newPassword);
      cy.visit('/').contains('SINETStream コンフィグサーバ');
    });

    beforeEach(() => {
      cy.visit('/user-profile').contains('ユーザプロフィール');
      cy.get('button[data-cy=btn-change-password]').click();
      cy.contains('パスワードの変更');
    });
  });

  beforeEach(() => {
    cy.findUserId(username).then((uid) => {
      cy.updateUser(uid, { password, email, displayName });
    });
    cy.login(username, password);
  });

  before(() => {
    cy.findUserId(username).then((uid) => {
      const userInfo = { password, email, displayName };
      if (uid == null) {
        cy.addUser({ name: username, ...userInfo });
      } else {
        cy.updateUser(uid, userInfo);
      }
    });
  });
});
