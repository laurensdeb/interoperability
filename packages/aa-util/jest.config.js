/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  'preset': 'ts-jest',
  'testEnvironment': 'node',
  'testRegex': '(/__tests__/.*|\\.(test|spec))\\.(ts)$',
  'collectCoverageFrom': [
    'src/**/*.ts',
  ],
  'coveragePathIgnorePatterns': [
    '<rootDir>/node_modules',
    'src/index.ts',
    'src/logging/LogLevel.ts',
    'src/util/FetchFactory.ts'
  ],
  'coverageReporters': [
    'json',
    'lcov',
    'text',
  ],
  'coverageThreshold': {
    'global': {
      'branches': 80,
      'functions': 80,
      'lines': 80,
      'statements': 80,
    },
  },
};
