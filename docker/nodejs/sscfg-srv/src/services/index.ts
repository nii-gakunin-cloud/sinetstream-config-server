import { Application } from '../declarations';
import accessKeyExpirations from './access-key-expirations/access-key-expirations.service';
import accessKeys from './access-keys/access-keys.service';
import apiV1Configs from './api-v1-configs/api-v1-configs.service';
import apiV1PublicKeys from './api-v1-public-keys/api-v1-public-keys.service';
import apiV1Secrets from './api-v1-secrets/api-v1-secrets.service';
import attachFiles from './attach-files/attach-files.service';
import configFiles from './config-files/config-files.service';
import encryptKeys from './encrypt-keys/encrypt-keys.service';
import info from './info/info.service';
import members from './members/members.service';
import publicKeys from './public-keys/public-keys.service';
import streamNames from './stream-names/stream-names.service';
import streams from './streams/streams.service';
import sysVault from './sys-vault/sys-vault.service';
import topics from './topics/topics.service';
import userParameters from './user-parameters/user-parameters.service';
import users from './users/users.service';
import vault from './vault/vault.service';
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application): void {
  app.configure(users);
  app.configure(streams);
  app.configure(members);
  app.configure(publicKeys);
  app.configure(vault);
  app.configure(encryptKeys);
  app.configure(attachFiles);
  app.configure(userParameters);
  app.configure(configFiles);
  app.configure(accessKeys);
  app.configure(accessKeyExpirations);
  app.configure(sysVault);
  app.configure(apiV1Configs);
  app.configure(apiV1Secrets);
  app.configure(topics);
  app.configure(streamNames);
  app.configure(info);
  app.configure(apiV1PublicKeys);
}
