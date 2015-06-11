var template=require('./template.js');
var path=require('path');
var yards=require('yards');
var Promise=yards.API.PromiseMixin;
var File=yards.API.File;
var Builder=require('node-webkit-builder');
var detectCurrentPlatform = require('./node_modules/node-webkit-builder/lib/detectCurrentPlatform.js');
var prompt=require('prompt');
var formatJSON=require('format-json');

module.exports.yards=yards;
module.exports.currentPlatform=detectCurrentPlatform();

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
    version:o('unknown'),
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
    if (opts.version==='unknown')
        try {
            opts.version=require(path.resolve(options.path,'package.json')).nwversion;
        } catch(e) {
            opts.version='latest';
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
    }).then(function() {
        prompt.message='YARDS';
        prompt.start();
        return new Promise(function(resolve,reject) {
            prompt.get([
                {
                    name:'name',
                    description:'App name',
                    type:'string',
                    required:true,
                    default:path.relative(path.resolve(opts.path,'..'),opts.path)
                },
                {
                    name:'main',
                    description:'Main page file',
                    type:'string',
                    required:true,
                    default:'index.html'
                },
                {
                    name:'version',
                    description:'App version',
                    type:'string',
                    required:true,
                    default:'0.0.0',
                    conform:function(a) {
                        var t=a.split('.');
                        return (t.length>=3)&&(t.every(function (a) {return a.length}));
                    }
                },
                {
                    name:'nwversion',
                    description:'NW.js version',
                    type:'string',
                    required:true,
                    default:'latest',
                    conform:function(a) {
                        if (a.trim()==='latest') return true;
                        var t=a.split('.');
                        return (t.length>=3)&&(t.slice(0,3).every(function (a) {return a.length}));
                    }
                },
                {
                    name:'description',
                    description:'App description',
                    type:'string'
                },
                {
                    name:'keywords',
                    description:'Keywords',
                    type:'string',
                    before:function(v) {
                        return v.split(' ')
                        .map(function(a){return a.trim()})
                        .filter(function(a){return a.length});
                    }
                },
                {
                    name:'license',
                    description:'License',
                    type:'string',
                    default:'MIT'
                },
                {
                    name:'author',
                    description:'Author',
                    type:'string',
                    before:function(v) {
                        return {name:v};
                    }
                }
            ],function(err,res) {
                if (err) return reject(err);
                resolve(res);
            });
        });
    }).then(function(res) {
        var f=new File(path.resolve(opts.path,'package.json'));
        f.data=formatJSON.plain(res);
        return f.write('utf-8');
    })
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
        opts.$c+=1;
    })
};

module.exports.run=function(options) {
    var opts={$c:0};
    for (var i in _runOptions) {
        var val;
        if (!!options[i])
            val=options[i];
        else
            val=_runOptions[i].def;
        _runOptions[i].decode(i,val,opts);
    };
    process.argv.splice(2,1+opts.$c);
    var currentPlatform = detectCurrentPlatform();
    opts.platforms=[currentPlatform];
    opts.currentPlatform=currentPlatform;
    opts.cacheDir=path.resolve(__dirname,'cache');
    try {
        opts.version=require(path.resolve(opts.files,'../package.json')).nwversion;
    } catch(e) {
        opts.version='latest';
    }
    var builder=new Builder(opts);
    builder.on('log', function(data) {
        console.log(data);
    });
    var fn;
    builder.on('stdout', fn=function(data) {
        console.log(data.toString('utf-8'));
    });
    builder.on('stderr', fn);
    return builder.run();
};