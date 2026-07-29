module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo wires up the Reanimated/worklets plugin itself when
  // react-native-reanimated is installed, so it must stay last in the chain.
  return { presets: ['babel-preset-expo'] };
};
