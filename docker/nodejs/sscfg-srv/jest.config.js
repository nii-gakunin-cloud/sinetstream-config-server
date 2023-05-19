module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest', {
        diagnostics: false,
      },
    ],
  },
  coverageReporters: ['html', 'text', 'text-summary', 'cobertura'],
  setupFilesAfterEnv: ['./test/jest.setup.ts'],
};
