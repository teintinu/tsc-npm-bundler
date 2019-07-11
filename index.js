const tsplugin = require('rollup-plugin-typescript2');
const rollup = require('rollup');
const program = require('commander');
const chokidar = require('chokidar');
const fs = require('fs');
const JSON5 = require('json5')

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
    .option('-o, --only [option]', Object.keys(configurator))
    .action(function (cmd) {
        if (cmd.only) config(cmd.only)
        else Object.keys(configurator).forEach(config)
        function config(n) {
            console.log("configuring " + n)
            configurator[n]()
        }
    })

program.parse(process.argv)

if (!process.argv.slice(2).length) program.outputHelp();

async function build() {
    const bundle = await rollup.rollup(inputOptions);
    await bundle.generate(outputOptions);
    await bundle.write(outputOptions);
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
    const watcher = await rollup.watch(watchOptions);
    watcher.on('event', event => {
        if (event.code === "BUNDLE_START") console.log('building')
        if (event.code === "END") console.log('built')
    });

    // stop watching
    //watcher.close();
}


function getConfigurator() {
    return {
        dependencies() {
        },
        tsconfig() {
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
            json.compilerOptions.jsx = "react"
            json.compilerOptions.lib = json.compilerOptions.lib || []
            if (json.compilerOptions.lib.indexOf("es2015") === -1)
                json.compilerOptions.lib.push("es2015")
            if (json.compilerOptions.lib.indexOf("dom") === -1)
                json.compilerOptions.lib.push("dom")
            json.exclude = json.exclude || []
            if (json.exclude.indexOf("node_modules") === -1)
                json.exclude.push("node_modules")
            if (json.exclude.indexOf("bin") === -1)
                json.exclude.push("bin")

            const n = JSON.stringify(json, null, 2)
            fs.writeFileSync('tsconfig.json', n, { encoding: 'utf8' })
        },
        tslint() {
            const json = fs.existsSync('tslint.json') ?
                JSON5.parse(fs.readFileSync('tslint.json', { encoding: 'utf8' })) : {}

            if (!json.extends) json.extends = []
            if (typeof json.extends === "string") json.extends = [json.extends]
            if (json.extends.indexOf("tslint-config-standard") === -1)
                json.extends.push("tslint-config-standard")

            const n = JSON.stringify(json, null, 2)
            fs.writeFileSync('tslint.json', n, { encoding: 'utf8' })
        },
        gitignore() {
        },
        npmignore() {
        },
        vscode() {
        },
    }
}

