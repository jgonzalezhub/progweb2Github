export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/swagger.js',
    '!src/index.js',
    '!src/services/logger.service.js',  // requiere Slack webhook externo
    '!src/services/mail.service.js',    // requiere SMTP externo
    '!src/services/storage.service.js'  // requiere Cloudinary externo (mockeado en tests)
  ],
  coverageThreshold: {
    global: { lines: 70 }
  }
};
