module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  coverageReporters: ['html', 'text', 'text-summary', 'cobertura'],
  setupFilesAfterEnv: ['./test/jest.setup.ts'],
};
