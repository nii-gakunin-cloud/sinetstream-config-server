declare module 'vue-shortkey' {
  declare const Plugin: {
    install: (Vue: VueConstructor) => void;
  };

  export default Plugin;
}
