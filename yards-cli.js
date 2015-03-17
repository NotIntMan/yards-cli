var template=require('./template.js');
var path=require('path');
var yards=require('yards');
var Promise=yards.API.PromiseMixin;
var Builder=require('node-webkit-builder');
var detectCurrentPlatform = require('./node_modules/node-webkit-builder/lib/detectCurrentPlatform.js');

module.exports.yards=yards;

var _asIs=function(name,val,opts) {opts[name]=val};
var o=function(def,decode) {
    return {
        def:def,
        decode:decode||_asIs
    };
};

var _options={
    path:o('./',function(name,val,opts) {
        opts.files=path.resolve(val,'**','**');
    }),
    version:o('latest'),
    platforms:o('',function(name,val,opts) {
        opts.platforms=val.toString().split(',');
    }),
    appName:o(false),
    appVersion:o(false),
    buildDir:o('./build',function(name,val,opts) {
        opts.buildDir=path.resolve(val);
    }),
    cacheDir:o(path.resolve(__dirname,'cache'),function(name,val,opts) {
        opts.cacheDir=path.resolve(val);
    }),
    buildType:o('default'),
    forceDownload:o(false),
    credits:o(false,function(name,val,opts) {
        opts.macCredits=val;
    }),
    ico:o(false,function(name,val,opts) {
        opts.winIco=val;
    }),
    icns:o(false,function(name,val,opts) {
        opts.macIcns=val;
    }),
    zip:o(false,function(name,val,opts) {
        opts.macZip=val;
    }),
    plist:o(false,function(name,val,opts) {
        opts.macPlist=val;
    })
};

module.exports.build=function(options) {
    var opts={};
    for (var i in _options) {
        var val;
        if (!!options[i])
            val=options[i];
        else
            val=_options[i].def;
        _options[i].decode(i,val,opts);
    };
    var builder=new Builder(opts);
    builder.on('log', console.log);
    var fn;
    builder.on('stdout', fn=function(data) {
        console.log(data.toString('utf-8'));
    });
    builder.on('stderr', fn);
    return builder.build();
};

var _projOptions={
    path:o('./',function(name,val,opts) {
        opts.path=path.resolve(val);
    }),
    template:o('')
};

module.exports.newProject=function(options) {
    var opts={};
    for (var i in _projOptions) {
        var val;
        if (!!options[i])
            val=options[i];
        else
            val=_projOptions[i].def;
        _projOptions[i].decode(i,val,opts);
    };
    var y=new template('');
    var arr=[
        opts.template,
        path.resolve(__dirname,'templates',opts.template+'.bin')
    ].map(function(p) {
        var t=new template(p);
        return t.promise();
    });
    return Promise.all(arr).then(function(arr) {
        for (var i=0; i<arr.length; i++)
            if (arr[i].$fileExists) {
                console.log('Using template',path.relative(path.resolve(arr[i].filename,'..'),arr[i].filename));
                arr[i].read();
                return arr[i].writeToDir(opts.path);
            };
    });
};

var _templateOptions={
    path:o('./',function(name,val,opts) {
        opts.path=path.resolve(val);
    }),
    outputFile:o('./template.bin',function(name,val,opts) {
        opts.outputFile=path.resolve(val);
    })
};

module.exports.newTemplate=function(options) {
    var opts={};
    for (var i in _templateOptions) {
        var val;
        if (!!options[i])
            val=options[i];
        else
            val=_templateOptions[i].def;
        _templateOptions[i].decode(i,val,opts);
    };
    var t=new template(opts.outputFile);
    return t.readFromDir(opts.path).then(function() {
        return t.write();
    });
};

var _runOptions={
    path:o('./',function(name,val,opts) {
        opts.files=path.resolve(val,'**');
    })
};

module.exports.run=function(options) {
    var opts={};
    for (var i in _runOptions) {
        var val;
        if (!!options[i])
            val=options[i];
        else
            val=_runOptions[i].def;
        _runOptions[i].decode(i,val,opts);
    };

    var currentPlatform = detectCurrentPlatform();
    opts.platforms=[currentPlatform];
    opts.currentPlatform=currentPlatform;
    opts.cacheDir=path.resolve(__dirname,'cache');
    console.log(opts);
    var builder=new Builder(opts);
    builder.on('log', console.log);
    var fn;
    builder.on('stdout', fn=function(data) {
        console.log(data.toString('utf-8'));
    });
    builder.on('stderr', fn);
    return builder.run();
};