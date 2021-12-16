import VueCompositionApi from '@vue/composition-api';
import Vue from 'vue';
import App from './App.vue';
import './plugins/shortkey';
import './plugins/vee-validate';
import vuetify from './plugins/vuetify';
import router from './router';
import store from './store';

Vue.use(VueCompositionApi);
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
