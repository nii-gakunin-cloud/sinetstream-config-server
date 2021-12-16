/* eslint-disable @typescript-eslint/no-explicit-any */
declare namespace Cypress {
  interface Chainable<Subject> {
    userToken(username: string, password: string): Chainable<Subject>;
    login(username: string, password: string): Chainable<Subject>;
    logout(): Chainable<Subject>;
    downloadBlob(): Chainable<string>;

    findUserId(username: string): Chainable<Subject>;
    addUser(user: {[key: string]: any}): Chainable<Subject>;
    removeUser(id: number): Chainable<Subject>;
    updateUser(id: number, user: {[key: string]: any}): Chainable<Subject>;
    adminToken(): Chainable<Subject>;

    addPublicKey(
      token: string, publicKey?: string, defaultKey?: boolean, comment?: string
    ): Chainable<Subject>;
    clearPublicKeys(token: string): Chainable<Subject>;
    addAccessKey(
      token: string, allPermitted?: boolean, streamIds?: [number], comment?: string
    ): Chainable<Subject>;
    clearAccessKeys(token: string): Chainable<Subject>;

    addStream(
      token: string, name: string, comment?: string, configFile?: string,
    ): Chainable<Subject>;
    clearStreams(token: string): Chainable<Subject>;

    addMember(
      token: string, admin: boolean, streamId: number, user: string,
    ): Chainable<Subject>;

    addEncryptKey(
      token: string, streamId: number, size: number, target: string,
      enabled?: boolean, comment?: string,
    ): Chainable<Subject>;

    addAttachFile(
      token: string, streamId: number, filename: string, target: string,
      secret?: boolean, enabled?: boolean, comment?: string,
    ): Chainable<Subject>;

    addUserParameter(
      token: string, streamId: number, username: string, target: string,
      textContent?: string, filename?: string,
      secret?: boolean, enabled?: boolean, comment?: string,
    ): Chainable<Subject>;
  }
}
