#!/usr/bin/env node

const tsplugin = require('rollup-plugin-typescript2');
const rollup = require('rollup');
const program = require('commander');
const chokidar = require('chokidar');
const fs = require('fs');
const JSON5 = require('json5');
const ora = require('ora');

const inputOptions = {
  input: "src/index.ts",
  plugins: [
    tsplugin({
      tsconfig: "tsconfig.json",
      exclude: ["*.d.ts", "**/*.d.ts", "*.test.ts"]
    }),
  ]
};

const outputOptions = {
  file: 'bin/bundle.js',
  format: 'cjs'
};

program
  .command('build')
  .action(build)

program
  .command('watch')
  .action(watch)

const configurator = getConfigurator()
program
  .command('config')
  .option('-o, --only [options]', Object.keys(configurator))
  .option('-e, --except [options]', Object.keys(configurator))
  .action(function (cmd) {
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
  })

program.parse(process.argv)

if (!process.argv.slice(2).length) program.outputHelp();

async function build() {
  const spinner = ora("building").start();
  try {
    const bundle = await rollup.rollup(inputOptions);
    await bundle.generate(outputOptions);
    await bundle.write(outputOptions);
  } catch (e) {
    spinner.fail(e.message)
  } finally {
    spinner.succeed('built')
  }
}

async function watch() {
  const watchOptions = {
    ...inputOptions,
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
    if (event.code === "BUNDLE_START") spinner = ora("building").start();
    if (event.code === "END") if (spinner) spinner.succeed('built')
    if (event.code === "ERROR") if (spinner) spinner.fail(event.error.message)
    if (event.code === "FATAL") if (spinner) spinner.fail(event.error.message)
  });

  // stop watching
  //watcher.close();
}

function getConfigurator() {
  return {
    async package() {
      const json = fs.existsSync('package.json') ?
        JSON5.parse(fs.readFileSync('package.json', { encoding: 'utf8' })) : {}

      json.main = "bin/bundle.js"
      json.types = "bin/index.d.ts"
      json.scripts = json.scripts || {}
      json.scripts.build = 'tsc-npm-bundler build'
      json.scripts.test = 'jest --watch'
      json.scripts.testWithCoverage = 'jest --coverage'
      json.scripts.lint = 'tslint -p .'
      json.scripts.lintFix = 'tslint -p . --fix'
      if (!json.scripts.prepublish) json.scripts.prepublish = 'npm run testWithCoverage && npm run build'
      json.jest = json.jest || {}
      json.jest.preset = 'ts-jest'
      json.jest.testEnvironment = 'node'
      json.jest.coverageThreshold = json.jest.coverageThreshold || {}
      json.jest.coverageThreshold.global = json.jest.coverageThreshold.global || {}
      json.jest.coverageThreshold.global.branches = 100
      json.jest.coverageThreshold.global.functions = 100
      json.jest.coverageThreshold.global.lines = 100
      json.jest.coverageThreshold.global.statements = 100

      const n = JSON.stringify(json, null, 2)
      fs.writeFileSync('package.json', n, { encoding: 'utf8' })
      return "ok"
    },
    async dependencies(cmd, spinner) {
      await execShellCommand(spinner, "npm install --save tslib", { silent: true })
      await execShellCommand(spinner, "npm install --save-dev typescript jest ts-jest @types/jest tslint tslint-config-standard", { silent: true })
      return "ok"
    },
    async tsconfig() {
      const json = fs.existsSync('tsconfig.json') ?
        JSON5.parse(fs.readFileSync('tsconfig.json', { encoding: 'utf8' })) : {}

      json.compilerOptions = json.compilerOptions || {}
      json.compilerOptions.target = "esnext"
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
      if (json.exclude.indexOf("node_modules") === -1)
        json.exclude.push("node_modules")
      if (json.exclude.indexOf("bin") === -1)
        json.exclude.push("bin")

      const n = JSON.stringify(json, null, 2)
      fs.writeFileSync('tsconfig.json', n, { encoding: 'utf8' })
      return "ok"
    },
    async  tslint() {
      const json = fs.existsSync('tslint.json') ?
        JSON5.parse(fs.readFileSync('tslint.json', { encoding: 'utf8' })) : {}

      if (!json.extends) json.extends = []
      if (typeof json.extends === "string") json.extends = [json.extends]
      if (json.extends.indexOf("tslint-config-standard") === -1)
        json.extends.push("tslint-config-standard")

      const n = JSON.stringify(json, null, 2)
      fs.writeFileSync('tslint.json', n, { encoding: 'utf8' })
      return "ok"
    },
    async gitignore() {
      const lines = fs.existsSync('.gitignore') ?
        fs.readFileSync('.gitignore', { encoding: 'utf8' })
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .split('\n') : []
      if (lines.indexOf('bin/') === -1) lines.push('bin/')
      if (lines.indexOf('.rpt2_cache/') === -1) lines.push('.rpt2_cache/')
      fs.writeFileSync('.gitignore', lines.join('\n'), { encoding: 'utf8' })
      return "ok"
    },
    async npmignore() {
      const lines = fs.existsSync('.npmignore') ?
        fs.readFileSync('.npmignore', { encoding: 'utf8' })
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .split('\n') : []
      if (lines.indexOf('src/') === -1) lines.push('src/')
      if (lines.indexOf('.rpt2_cache/') === -1) lines.push('.rpt2_cache/')
      if (lines.indexOf('ts*.json') === -1) lines.push('ts*.json')
      fs.writeFileSync('.npmignore', lines.join('\n'), { encoding: 'utf8' })
      return "ok"
    },
    async vscode() {
      if (!fs.existsSync('.vscode')) fs.mkdirSync('.vscode')
      const json = fs.existsSync('.vscode/settings.json') ?
        JSON5.parse(fs.readFileSync('.vscode/settings.json', { encoding: 'utf8' })) : {}

      json["editor.tabSize"] = 2
      json["typescript.format.insertSpaceBeforeFunctionParenthesis"] = true
      json["editor.detectIndentation"] = false

      const n = JSON.stringify(json, null, 2)
      fs.writeFileSync('.vscode/settings.json', n, { encoding: 'utf8' })
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