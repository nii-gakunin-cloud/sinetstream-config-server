import Vue from 'vue';
import Vuex from 'vuex';
import accessKeys from './services/accessKeys';
import attachFiles from './services/attachFiles';
import configFiles from './services/configFiles';
import encryptKeys from './services/encryptKeys';
import members from './services/members';
import publicKeys from './services/publicKeys';
import streamNames from './services/streamNames';
import streams from './services/streams';
import topics from './services/topics';
import userParameters from './services/userParameters';
import users from './services/users';
import auth from './store.auth';
import { FeathersVuex } from '@/feathers-client';

Vue.use(Vuex);
Vue.use(FeathersVuex);

export default new Vuex.Store({
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
  },
  plugins: [
    streams,
    users,
    members,
    publicKeys,
    encryptKeys,
    attachFiles,
    userParameters,
    configFiles,
    accessKeys,
    topics,
    streamNames,
    auth,
  ],
});
