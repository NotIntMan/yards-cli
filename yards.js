#!/usr/bin/env node

var program=require('commander');
var manifest=require('./package.json');
var cli=require('./yards-cli.js');

program
    .version(manifest.version);

var build=program
    .command('build [<path>]')
    .description('Building project.')
    .option('-v, --nw-version <ver>','Sets version of NW that will be used.')
    .option('--win','Add Win32 to build platforms.')
    .option('--osx','Add Mac OS X to build platforms.')
    .option('--l32','Add Linux 32 bit to build platforms.')
    .option('--l64','Add Linux 64 bit to build platforms.')
    .option('','Default build platforms: win and osx.')
    .option('--aname','Sets name of your app.')
    .option('--aver','Sets version of your app.')
    .option('-b, --build-dir <dir>','Sets output directory for builded app.')
    .option('-c, --cache-dir <dir>','Sets cache directory.')
    .option('-t, --build-type <type>','Sets build type (versioned or timestamped).')
    .option('-f, --force-download','Ignoring cache and redownload prebuild binaries.')
    .option('-i, --ico <icofile>','Sets .ico file of your win app.')
    .option('-is, --icns <icnsfile>','Sets .icns file of your osx app.')
    .option('--credits <creditsfile>','Sets creditsfile of your app. Mac OS X requires.')
    .option('--zip','Compress your source-files (it will slow app).')
    .option('--plist <plistfile>','Sets Plist file of your app. Mac OS X requires.')
    .action(function(path) {
        if (!path) path='./';
        cli.build({
            path:path,
            version:build.nwVersion,
            win:build.win,
            osx:build.osx,
            linux32:build.l32,
            linux64:build.l64,
            appName:build.aname,
            appVersion:build.aver,
            buildDir:build.buildDir,
            cacheDir:build.cacheDir,
            buildType:build.buildType,
            forceDownload:build.forceDownload,
            credits:build.credits,
            ico:build.ico,
            icns:build.icns,
            zip:build.zip,
            plist:build.plist
        }).then(function() {
            console.log('Building complete!');
        });
    });

var newTemplate=program
    .command('template [<path>]')
    .description('Packing new application template.')
    .option('-o, --output <filename>','Sets output filename.')
    .action(function(path) {
        cli.newTemplate({
            path:path,
            outputFile:newTemplate.output
        }).then(function() {
            console.log('Template is packed.')
        });
    });

var newProject=program
    .command('project [<path>]')
    .description('Creating new project.')
    .option('-t, --template <filename>','Use default or custom template.')
    .action(function(path) {
        cli.newProject({
            path:path,
            template:newProject.template
        }).then(function() {
            console.log('Project is created.')
        });
    });

var run=program
    .command('run [<path>]')
    .description('Running existing project.')
    .action(function(path) {
        console.log('Running project as application...');
        cli.run({
            path:path
        }).then(function(val) {
            console.log('Application closed.');
        });
    });

program.parse(process.argv);