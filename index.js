const tsplugin = require('rollup-plugin-typescript2');
const rollup = require('rollup');
const program = require('commander');
const chokidar = require('chokidar');

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

program
    .command('init <dir>')
    .option('--disable-vscode', 'Disable VSCode')
    .action(function (dir, cmd) {
        console.log('remove ' + dir + (cmd.disableVscode ? ' recursively' : ''))
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
