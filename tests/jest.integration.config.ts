const config = {
  rootDir: "../apps/api",
  roots: ["<rootDir>/../../tests/integration"],
  modulePaths: ["<rootDir>/node_modules"],
  moduleFileExtensions: ["js", "json", "ts"],
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      { useESM: true, tsconfig: "../../tests/tsconfig.json" },
    ],
  },
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  testRegex: ".*\\.integration\\.spec\\.ts$",
  testEnvironment: "node",
  testTimeout: 60000,
};

export default config;