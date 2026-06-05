/** @type {import('jest').Config} */
module.exports = {
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/tests/e2e/"],
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { tsconfig: "<rootDir>/tsconfig.jest.json" },
        ],
      },
    },
    {
      displayName: "components",
      testMatch: ["<rootDir>/tests/components/**/*.test.tsx"],
      testEnvironment: "jsdom",
      setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { tsconfig: "<rootDir>/tsconfig.jest.json" },
        ],
      },
    },
    {
      displayName: "integration",
      testMatch: ["<rootDir>/tests/integration/**/*.test.ts"],
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          { tsconfig: "<rootDir>/tsconfig.jest.json" },
        ],
      },
    },
  ],
};
