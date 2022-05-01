module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
  },
  'extends': [
    'google',
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module',
  },
  'plugins': [
    '@typescript-eslint',
  ],
  'rules': {
    'max-len': [2, {'code': 120, 'tabWidth': 4, 'ignoreUrls': true}],
  },
  'overrides': [
    {
      'rules': {
        'new-cap': 'off'
      }
    }
  ],
  'ignorePatterns': [
    'node_modules',
    'dist',
    'coverage',
    '*.conf.js',
    '*.config.js',
    '*.conf.ts',
    '*.config.ts',
  ],
};
