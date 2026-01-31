const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Soluzione per l'errore "Stripping types is currently unsupported" in SDK 54
config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
    keep_classnames: true,
  },
};

module.exports = config;
