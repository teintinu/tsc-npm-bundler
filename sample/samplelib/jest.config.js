//const tsconfig = require("./tests/tsconfig.json")

const moduleNameMapper = {
  // samplelib: '<rootDir>/../src' 
  // samplelib: "/home/work/hoda5/tsc-npm-bundler/sample/samplelib/src"
  "^samplelib$": "/home/work/hoda5/tsc-npm-bundler/sample/samplelib/bin"
}

// require("tsconfig-paths-jest")(tsconfig)
console.dir(moduleNameMapper)

module.exports = {
  preset: "ts-jest",
  // roots: ["<rootDir>/src/", "<rootDir>/tests/"],
  moduleNameMapper: moduleNameMapper
  // {
  //   samplelib: "/home/work/hoda5/tsc-npm-bundler/sample/samplelib/src"
  // }
}

