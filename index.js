#!/usr/bin/env node

const rollup = require('rollup');
const rollupTS = require('rollup-plugin-typescript2');
const babel = require('rollup-plugin-babel');
// const rollupNodeResolve = require('rollup-plugin-node-resolve');
// const rollupCJS = require('rollup-plugin-commonjs');

const program = require('commander');
const chokidar = require('chokidar');
const fs = require('promise-fs');
const JSON5 = require('json5');
const ora = require('ora');
const jestCli = require('jest-cli');

if (!fs.existsSync('package.json')) {
  const spinner = ora().start();
  spinner.fail("no package.json in current directory")
  process.exit(1)
}

const packageRoot = process.cwd()
const packageJson = JSON.parse(fs.readFileSync(packageRoot + '/package.json', 'utf8'))
const packageName = packageJson.name
let runnedCmd = false

const outputOptions = {
  file: 'bin/bundle.js',
  format: 'cjs'
};

// const namedExportsHelp = "namedExports for commonjs (https://stackoverflow.com/questions/50080893/rollup-error-isvalidelementtype-is-not-exported-by-node-modules-react-is-inde)\n" +
//   'sample --named-exports "react:useState,useRef;fs:exists"'

program
  .command('build')
  .option('-e, --externals [names]', "external modules sample react,fs")
  // .option('-n, --named-exports [names]', namedExportsHelp)
  .action(runcmd(build))

program
  .command('watch')
  .option('-e, --externals [names]', "external modules sample react,fs")
  // .option('-n, --named-exports [names]', namedExportsHelp)
  .action(runcmd(watch))

program
  .command('test <from>')
  .description("from src | bin")
  .action(runcmd(test))

const configurator = getConfigurator()

program
  .command('config')
  .option('-o, --only [options]', Object.keys(configurator))
  .option('-e, --except [options]', Object.keys(configurator))
  .action(runcmd(config))

program.parse(process.argv)
if (!runnedCmd) program.outputHelp();

function runcmd(fn) {
  return function (a1, a2, a3) {
    runnedCmd = true
    fn(a1, a2, a3)
  }
}

async function build(cmd) {
  const spinner = ora("building: " + packageName + " ").start();
  try {
    const bundle = await rollup.rollup(await getInputOptions(cmd));
    await bundle.generate(outputOptions);
    await bundle.write(outputOptions);
    spinner.succeed(packageName + ' built')
  } catch (e) {
    spinner.fail(e.stack)
  }
}

async function watch(cmd) {
  const watchOptions = {
    ...(await getInputOptions(cmd)),
    output: outputOptions,
    watch: {
      chokidar,
      include: ['src/**'],
      exclude: ['node_modules/**', '*.test.ts*']
    },
  };
  let spinner
  const watcher = await rollup.watch(watchOptions);
  watcher.on('event', event => {
    if (event.code === "BUNDLE_START") spinner = ora("building: " + packageName + " ").start();
    if (event.code === "END") if (spinner) spinner.succeed(packageName + ' built')
    if (event.code === "ERROR") if (spinner) spinner.fail(event.error.message)
    if (event.code === "FATAL") if (spinner) spinner.fail(event.error.message)
  });

  // stop watching
  //watcher.close();
}

async function test(from, cmd) {

  const rootDir = packageRoot
  const jestArgs = [
    "--no-cache",
    "--preset", "ts-jest",
  ]
  const globals = {
    'ts-jest': {
      diagnostics: "pretty",
      // autoMapModuleNames: true
    },
  }

  //   testEnvironment: 'node',
  //   coverageThreshold: {
  //     global: {
  //       branches: 100,
  //       functions: 100,
  //       lines: 100,
  //       statements: 100,
  //     },
  //   },
  // }

  const mapper = {}
  if (from === "bin") {
    mapper[packageName] = packageRoot + "/bin/index.js"
  }
  else if (from === "src") {
    mapper[packageName] = packageRoot + "/src/index.ts"
  }
  else {
    console.log("you can run tests from src or from bin")
    return
  }

  jestArgs.push(
    "--module-name-mapper", JSON.stringify(mapper)
  )

  // console.dir(jestConfig)

  jestArgs.push('--globals', JSON.stringify(globals))

  console.log("jest " + jestArgs.map((a) => "'" + a + "'").join(" "))

  const r = await jestCli.run(jestArgs);

  console.dir(r)
}

async function config(cmd) {
  let failed = false
  let cfgExec
  if (cmd.only) cfgExec = cmd.only.split(',')
  else if (cmd.except) {
    const exceptOptions = cmd.except.split(',')
    exceptOptions.forEach((n) => {
      if (!configurator[n]) {
        const spinner = ora("configuring " + n).start();
        spinner.fail("invalid configuration option " + n)
        failed = true
      }
    })
    cfgExec = Object.keys(configurator).filter((n) => exceptOptions.indexOf(n) === -1)
  } else cfgExec = Object.keys(configurator)
  const count = cfgExec.length
  execNext()
  async function execNext() {
    if (failed) return
    const n = cfgExec.shift()
    const idx = count - cfgExec.length
    const spinner = ora()
    spinner.prefixText = "configuring " + idx + "/" + count + ": " + n
    spinner.start();
    const fn = configurator[n]
    if (fn) {
      const r = await fn(cmd, spinner)
      if (r !== "ok") {
        spinner.fail("error configuring " + n + " " + r)
        failed = true
      }
      else {
        spinner.text = ''
        spinner.succeed()
      }
      if (cfgExec.length && !failed) execNext()
    } else {
      spinner.fail("invalid configuration option " + n)
      failed = true
    }
  }
}

function getConfigurator() {
  return {
    async package() {
      const json = await existsAsync('package.json') ?
        JSON5.parse(await fs.readFile('package.json', { encoding: 'utf8' })) : {}

      json.main = "bin/bundle.js"
      json.types = "bin/index.d.ts"
      json.scripts = json.scripts || {}
      json.scripts.build = 'tsc-npm-bundler build'
      json.scripts.test = 'jest --watch'
      json.scripts.testWithCoverage = 'jest --coverage'
      json.scripts.lint = 'tslint -p .'
      json.scripts.lintFix = 'tslint -p . --fix'
      if (!json.scripts.prepublish) json.scripts.prepublish = 'npm run testWithCoverage && npm run build'
      delete json.jest

      const n = JSON.stringify(json, null, 2)
      await fs.writeFile('package.json', n, { encoding: 'utf8' })
      return "ok"
    },
    async dependencies(cmd, spinner) {
      await execShellCommand(spinner, "npm install --save tslib", { silent: true })
      await execShellCommand(spinner, "npm install --save-dev typescript jest ts-jest @types/jest tslint tslint-config-standard", { silent: true })
      return "ok"
    },
    async tsconfig() {
      if (await existsAsync('tsconfig.json')) await fs.unlink('tsconfig.json')
      await tsproject()
      await tsconfigSrc()
      await tsconfigTests()
      return "ok"
      async function tsproject() {
        const json = await existsAsync('tsproject.json') ?
          JSON5.parse(await fs.readFile('tsproject.json', { encoding: 'utf8' })) : {}

        json.compilerOptions = json.compilerOptions || {}
        json.compilerOptions.target = "es5"
        json.compilerOptions.module = "esnext"
        json.compilerOptions.moduleResolution = "node"
        json.compilerOptions.outDir = "bin"
        json.compilerOptions.strict = true
        json.compilerOptions.esModuleInterop = true
        json.compilerOptions.noImplicitAny = true
        json.compilerOptions.sourceMap = true
        json.compilerOptions.declaration = true
        json.compilerOptions.importHelpers = true
        json.compilerOptions.noEmitHelpers = true
        json.compilerOptions.lib = json.compilerOptions.lib || []
        if (json.compilerOptions.lib.indexOf("esnext") === -1)
          json.compilerOptions.lib.push("esnext")
        json.exclude = json.exclude || []
        // if (json.exclude.indexOf("node_modules") === -1)
        //   json.exclude.push("node_modules")
        // if (json.exclude.indexOf("bin") === -1)
        //   json.exclude.push("bin")

        const n = JSON.stringify(json, null, 2)
        await fs.writeFile('tsproject.json', n, { encoding: 'utf8' })
      }
      async function tsconfigSrc() {
        if (!(await existsAsync('src'))) await fs.mkdir('src')

        const json = await existsAsync('src/tsconfig.json') ?
          JSON5.parse(await fs.readFile('src/tsconfig.json', { encoding: 'utf8' })) : {}

        json.extends = "../tsproject.json"
        json.compilerOptions = json.compilerOptions || {}
        json.compilerOptions.baseUrl = "."

        const n = JSON.stringify(json, null, 2)
        await fs.writeFile('src/tsconfig.json', n, { encoding: 'utf8' })
      }
      async function tsconfigTests() {
        if (!await existsAsync('tests')) await fs.mkdir('tests')

        const json = await existsAsync('tests/tsconfig.json') ?
          JSON5.parse(await fs.readFile('tests/tsconfig.json', { encoding: 'utf8' })) : {}

        json.extends = "../tsproject.json"
        json.compilerOptions = json.compilerOptions || {}
        json.compilerOptions.noEmit = true
        json.compilerOptions.baseUrl = "."
        json.compilerOptions.paths = json.compilerOptions.paths || {}
        json.compilerOptions.paths[packageName] = json.compilerOptions.paths[packageName] || []
        if (json.compilerOptions.paths[packageName].indexOf('../src') === -1)
          json.compilerOptions.paths[packageName].push('../src')

        const n = JSON.stringify(json, null, 2)
        await fs.writeFile('tests/tsconfig.json', n, { encoding: 'utf8' })
      }

    },
    async  tslint() {
      const json = await existsAsync('tslint.json') ?
        JSON5.parse(await fs.readFile('tslint.json', { encoding: 'utf8' })) : {}

      if (!json.extends) json.extends = []
      if (typeof json.extends === "string") json.extends = [json.extends]
      if (json.extends.indexOf("tslint-config-standard") === -1)
        json.extends.push("tslint-config-standard")

      const n = JSON.stringify(json, null, 2)
      await fs.writeFile('tslint.json', n, { encoding: 'utf8' })
      return "ok"
    },
    async gitignore() {
      const lines = await existsAsync('.gitignore') ?
        (await fs.readFile('.gitignore', { encoding: 'utf8' }))
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .split('\n') : []
      if (lines.indexOf('bin/') === -1) lines.push('bin/')
      if (lines.indexOf('.rpt2_cache/') === -1) lines.push('.rpt2_cache/')
      await fs.writeFile('.gitignore', lines.join('\n'), { encoding: 'utf8' })
      return "ok"
    },
    async npmignore() {
      const lines = await existsAsync('.npmignore') ?
        (await fs.readFile('.npmignore', { encoding: 'utf8' }))
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .split('\n') : []
      if (lines.indexOf('src/') === -1) lines.push('src/')
      if (lines.indexOf('.rpt2_cache/') === -1) lines.push('.rpt2_cache/')
      if (lines.indexOf('ts*.json') === -1) lines.push('ts*.json')
      await fs.writeFile('.npmignore', lines.join('\n'), { encoding: 'utf8' })
      return "ok"
    },
    async vscode() {
      if (!await existsAsync('.vscode')) await fs.mkdir('.vscode')
      const json = await existsAsync('.vscode/settings.json') ?
        JSON5.parse(await fs.readFile('.vscode/settings.json', { encoding: 'utf8' })) : {}

      json["editor.tabSize"] = 2
      json["typescript.format.insertSpaceBeforeFunctionParenthesis"] = true
      json["editor.detectIndentation"] = false

      const n = JSON.stringify(json, null, 2)
      await fs.writeFile('.vscode/settings.json', n, { encoding: 'utf8' })
      return "ok"
    },
  }
}

function execShellCommand(spinner, cmd) {
  spinner.text = cmd
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) reject(error)
      else resolve(stdout ? stdout : stderr)
    });
  });
}

async function getInputOptions(cmd) {
  const input = {
    input: "src/index.ts",
    external: await getExternal(),
    plugins: [
      // rollupNodeResolve({
      //   // modulesOnly: true,
      //   // jail: '/src',
      //   // only: ["tmp2-google-maps-react-hooks"]
      //   // dedupe: [ 'react', 'react-dom' ]
      //   // browser: true,
      //   // mainFields: ["jsnext:main", 'module', 'main']
      // }),
      // rollupCJS({
      //   include: 'node_modules/**',
      //   namedExports: getNamedExports()
      //   // include: /node_modules/      
      // }),      
      rollupTS({
        tsconfig: "src/tsconfig.json",
        exclude: ["node_modules/**", "*.d.ts", "**/*.d.ts", "*.test.ts"]
      }),
      babel({
        babelrc: false,
        presets: [['env']],
        exclude: 'node_modules/**'
      }),
    ]
  }
  // console.log(JSON.stringify(input))
  return input
  function getNamedExports() {
    const r = {
      'react': ['useState', "useRef", "useEffect", "createElement", "cloneElement", "Children"]
    }
    if (cmd.namedExports) {
      const modules = cmd.namedExports.split(';')
      modules.forEach((m) => {
        const [n, e] = m.split(':')
        e.split(',').forEach((i) => {
          r[n] = r[n] || []
          if (r[n].indexOf(i) === -1) r[n].push(i)
        })
      })
    }
    return r
  }

  async function getExternal() {
    const dirs = await fs.readdir("node_modules")
    const externals = []
    for (var i = 0; i < dirs.length; i++) {
      const d = dirs[i]
      const n = "node_modules/" + d + "/package.json"
      if (await existsAsync(n)) {
        const p = JSON.parse(await fs.readFile(n, "utf8"))
        externals.push(p.name)
      }
    }
    // console.log(JSON.stringify(externals))
    return externals
  }
}

function existsAsync(path) {
  return fs.stat(path).then(function () {
    return true
  }).catch(function () {
    return false
  })
}