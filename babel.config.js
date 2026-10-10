module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Drizzle-Migrationen (.sql) als Text einbinden
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
