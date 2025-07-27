module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended'
  ],
  rules: {
    'no-console': 'off',
    'prettier/prettier': 'error'
  }
};
