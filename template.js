var yards=require('yards');
var fs=require('fs');
var Class=yards.API.Class;
var Module=yards.API.Module;
var Package=yards.FileType.Package;
var File=yards.API.File;

var PackageDir;
PackageDir=Class(function() {
    var self=this;
    this.struct=[
        [/.*/,function(path) {
            if (fs.lstatSync(path).isDirectory())
                return new PackageDir(path);
            else
                return new File(path);
        }]
    ];
},Module);

var Template=Class(function(){
    this.module=PackageDir;
},Package);

module.exports=Template;