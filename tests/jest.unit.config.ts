const config = {
  rootDir: "../apps/api",
  roots: ["<rootDir>/../../tests/unit"],
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
  testRegex: ".*\\.spec\\.ts$",
  testEnvironment: "node",
};

export default config;