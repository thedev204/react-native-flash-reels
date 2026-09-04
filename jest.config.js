module.exports = {
  preset: '@react-native/jest-preset',
  rootDir: __dirname,
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/example/node_modules',
    '<rootDir>/lib/',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/example/',
    '<rootDir>/lib/',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|@react-native/js-polyfills|@shopify/flash-list|react-native-reanimated|react-native-gesture-handler|react-native-video|@gorhom))',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/index.ts'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov'],
  clearMocks: true,
};
