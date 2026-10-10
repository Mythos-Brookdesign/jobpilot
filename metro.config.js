const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Drizzle-Migrationen werden als .sql-Dateien ins Bundle übernommen
config.resolver.sourceExts.push('sql');

// SQLite im Browser läuft als WebAssembly
config.resolver.assetExts.push('wasm');

// SharedArrayBuffer (für SQLite im Browser) braucht diese Header, hier für den Dev-Server
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
