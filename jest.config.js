module.exports = {
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/test/setup.js"],
  moduleNameMapper: { "\\.css$": "<rootDir>/test/styleMock.js" },
  transform: {
    "^.+\\.js$": [
      "babel-jest",
      { presets: [["@babel/preset-env", { targets: { node: "current" } }]] },
    ],
  },
};
