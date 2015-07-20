var fs = require('fs');
var path = require('path');
var callsite = require('callsite')

function findRootDir(callerDir) {
    // search caller's ancestors for gu.json
    for (var i=0; i < 5; i++) {
        var up = Array.apply(null, {length: i})
            .map(function() { return '..'; })
            .join('/')
        var testPath = path.join(callerDir, up, 'gu.json')
        if (fs.existsSync(testPath)) return path.dirname(testPath);
    }

    throw new Error('No gu.json found in ancestors of ' + callerDir)
}

function loadMainConfig(callerDir) {
    var rootDir = findRootDir(callerDir);
    var cfgPath = path.join(rootDir, 'gu.json');
    var cfgFile = fs.readFileSync(cfgPath);
    var cfg = JSON.parse(cfgFile);
    cfg.rootdir = rootDir;

    // override cfg with any GU_ prefixed environment variables
    Object.keys(process.env)
        .filter(function(key) { return /^GU_/i.test(key); })
        .map(function(key) {
            return { key: key.substr(3).toLowerCase(), val: process.env[key] };
        })
        .forEach(function(prop) { cfg[prop.key] = prop.val })

    return cfg;
}

var gu = {
    init: function(www) {
        www = www !== undefined ? www : true;

        // get the caller's directory
        var callerDir = path.dirname(callsite()[1].getFileName());

        gu.config = loadMainConfig(callerDir);
        if (www) gu.router = gu.config.routes ? require('./router')(gu.config) : null;
        gu.db = require('./db')
        gu.s3 = require('./s3')(gu.config)
        gu.tmpl = require('./tmpl')(gu.config)
        return gu;
    }
}

module.exports = gu;
