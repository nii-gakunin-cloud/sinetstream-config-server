/* eslint-disable @typescript-eslint/no-var-requires,import/no-extraneous-dependencies */
const CompressionPlugin = require('compression-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/ui/' : '/ui-devel/',
  transpileDependencies: [
    'vuetify',
    'feathers-vuex',
  ],
  configureWebpack: {
    resolve: {
      fallback: {
        util: require.resolve('util/'),
        constants: require.resolve('constants-browserify'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        assert: require.resolve('assert/'),
        buffer: require.resolve('buffer/'),
      },
    },
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
  },
  chainWebpack: (config) => {
    config.plugins.delete('prefetch');
    config.plugin('CompressionPlugin').use(CompressionPlugin);
  },
  devServer: {
    allowedHosts: 'all',
  },
  pluginOptions: {
    webpackBundleAnalyzer: {
      openAnalyzer: false,
    },
  },
};
