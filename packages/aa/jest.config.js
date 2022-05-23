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
    'src/agent/policy/', 
    'src/agent/registration/'
  ],
  'coverageReporters': [
    'json',
    'lcov',
    'text',
  ],
  'coverageThreshold': {
    'global': {
      'branches': 100,
      'functions': 100,
      'lines': 100,
      'statements': 100,
    },
  },
};
