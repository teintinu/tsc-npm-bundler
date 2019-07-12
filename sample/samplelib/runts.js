process.env.TS_NODE_PROJECT = './tests/tsconfig.json';
process.env.TS_CONFIG_PATHS = true;
require('ts-mocha');
const Mocha = require('mocha');
const path = require('path');

const mocha = new Mocha();
const s=process.cwd()+ `/tests/add.test.ts`
console.dir({s})
mocha.addFile(s);
mocha.run((failures) => {
  process.on('exit', () => {
    process.exit(failures); 
  });
});
