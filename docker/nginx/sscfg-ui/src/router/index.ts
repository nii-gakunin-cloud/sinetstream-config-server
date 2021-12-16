import Vue from 'vue';
import VueRouter, { Route, RouteConfig } from 'vue-router';
import NotFoundView from '@/views/NotFoundView.vue';
import store from '@/store/';
import feathersClient from '@/feathers-client';
import SimpleAppBar from '@/components/SimpleAppBar.vue';
import StandardAppBar from '@/components/StandardAppBar.vue';

Vue.use(VueRouter);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const idMustbeNumber = (route: Route): any => {
  const props = { ...route.params };
  const id: number = +props.id;
  return { ...props, id };
};

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    components: {
      default: () => import(/* webpackChunkName: "stream" */ '@/components/ConfigServerDashboard.vue'),
      bar: SimpleAppBar,
    },
    props: { default: false, bar: { title: 'SINETStream コンフィグサーバ' } },
    meta: { requiresAuth: true },
  },
  {
    path: '/streams',
    name: 'StreamsTable',
    components: {
      default: () => import(/* webpackChunkName: "stream" */ '@/views/StreamsView.vue'),
      bar: StandardAppBar,
    },
    props: { bar: { title: 'コンフィグ情報一覧', tooltip: 'コンフィグ情報の登録' } },
    meta: { requiresAuth: true },
  },
  {
    path: '/streams/:id',
    name: 'ShowStream',
    components: {
      default: () => import(/* webpackChunkName: "stream" */ '@/views/ShowStreamView.vue'),
      bar: SimpleAppBar,
    },
    props: { default: idMustbeNumber, bar: false },
    meta: { requiresAuth: true },
  },
  {
    path: '/streams/:id/encrypt-keys',
    name: 'EncryptKeyTable',
    components: {
      default: () => import(/* webpackChunkName: "stream" */ '@/views/EncryptKeysView.vue'),
      bar: StandardAppBar,
    },
    props: { default: idMustbeNumber, bar: { tooltip: 'データ暗号鍵の登録' } },
    meta: { requiresAuth: true },
  },
  {
    path: '/streams/:id/attach-files',
    name: 'AttachFileTable',
    components: {
      default: () => import(/* webpackChunkName: "stream" */ '@/views/AttachFilesView.vue'),
      bar: StandardAppBar,
    },
    props: { default: idMustbeNumber, bar: { tooltip: '添付ファイルの登録' } },
    meta: { requiresAuth: true },
  },
  {
    path: '/streams/:id/user-parameters',
    name: 'UserParameterTable',
    components: {
      default: () => import(/* webpackChunkName: "stream" */ '@/views/UserParametersView.vue'),
      bar: StandardAppBar,
    },
    props: { default: idMustbeNumber, bar: { tooltip: 'ユーザパラメータの登録' } },
    meta: { requiresAuth: true },
  },
  {
    path: '/streams/:id/members',
    name: 'MemberTable',
    components: {
      default: () => import(/* webpackChunkName: "stream" */ '@/views/MembersView.vue'),
      bar: StandardAppBar,
    },
    props: { default: idMustbeNumber, bar: { tooltip: '共同利用者の登録' } },
    meta: { requiresAuth: true },
  },
  {
    path: '/public-keys',
    name: 'PublicKeysView',
    components: {
      default: () => import(/* webpackChunkName: "stream" */ '@/views/PublicKeysView.vue'),
      bar: StandardAppBar,
    },
    props: { bar: { title: 'ユーザ公開鍵一覧', tooltip: 'ユーザ公開鍵の登録' } },
    meta: { requiresAuth: true },
  },
  {
    path: '/access-keys',
    name: 'AccessKeysView',
    components: {
      default: () => import(/* webpackChunkName: "stream" */ '@/views/AccessKeysView.vue'),
      bar: StandardAppBar,
    },
    props: {
      bar: {
        title: 'APIアクセスキーの一覧',
        tooltip: 'APIアクセスキーの作成',
        hideSearch: true,
      },
    },
    meta: { requiresAuth: true },
  },
  {
    path: '/user-profile',
    name: 'UserProfileViewView',
    components: {
      default: () => import(/* webpackChunkName: "stream" */ '@/components/UserProfileForm.vue'),
      bar: SimpleAppBar,
    },
    props: { default: false, bar: { title: 'ユーザプロフィール' } },
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: "stream" */ '@/views/LoginView.vue'),
  },
  {
    path: '/login-shibboleth',
    name: 'LoginShibboleth',
    component: () => import(/* webpackChunkName: "stream" */ '@/views/LoginShibbolethView.vue'),
  },
  {
    path: '/logout',
    name: 'Logout',
    component: () => import(/* webpackChunkName: "stream" */ '@/views/LogoutView.vue'),
  },
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: NotFoundView,
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach(async (to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { auth } = store.state as any;
    if (!auth.user) {
      try {
        await store.dispatch('auth/authenticate');
        next();
      } catch (e) {
        next({ path: '/login', query: { redirect: to.fullPath } });
      }
    } else {
      next();
    }
  } else {
    next();
  }
});

feathersClient.hooks({
  error: {
    all: [
      (context) => {
        const { error, path } = context;
        if (error.code === 401 && path !== 'authentication') {
          router.push('/login');
        }
      },
    ],
  },
});

export default router;
