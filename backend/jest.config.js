module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "models/**/*.js",
    "middlewares/**/*.js",
    "utils/**/*.js",
    "routes/**/*.js",
    "!**/node_modules/**",
    "!**/tests/**"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  testMatch: [
    "**/tests/**/*.test.js",
    "**/tests/**/*.spec.js"
  ],
  testPathIgnorePatterns: [
    "/node_modules/"
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
