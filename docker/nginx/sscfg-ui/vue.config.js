/* eslint-disable @typescript-eslint/no-var-requires */
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/ui/' : '/ui-devel/',
  transpileDependencies: [
    'vuetify',
    'feathers-vuex',
  ],
  chainWebpack: (config) => {
    config.plugins.delete('prefetch');
    config.plugin('CompressionPlugin').use(CompressionPlugin);
    config.module
      .rule('worker-loader')
      .test(/\.worker\.js$/)
      .use({ loader: 'worker-loader' })
      .loader('worker-loader')
      .end();
  },
  devServer: {
    disableHostCheck: true,
  },
  pluginOptions: {
    webpackBundleAnalyzer: {
      openAnalyzer: false,
    },
  },
};
