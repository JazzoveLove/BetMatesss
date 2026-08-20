// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
const jestPlugin = require("eslint-plugin-jest");
const testingLibraryPlugin = require("eslint-plugin-testing-library");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["node_modules/*", "dist/*", ".expo/*", "ios/*", "android/*"],
  },
  {
    files: ["__tests__/**/*.{ts,tsx}"],
    plugins: {
      jest: jestPlugin,
      "testing-library": testingLibraryPlugin,
    },
    languageOptions: {
      globals: jestPlugin.environments.globals.globals,
    },
    rules: {
      ...jestPlugin.configs["flat/recommended"].rules,
      ...testingLibraryPlugin.configs["flat/react"].rules,
    },
  },
]);
