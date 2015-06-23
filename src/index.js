var fs = require('fs');
var path = require('path');

function loadMainConfig(rootdir) {
    var cfgFile = fs.readFileSync(path.join(rootdir, 'gu.json'));
    var cfg = JSON.parse(cfgFile);
    cfg.rootdir = rootdir;

    Object.keys(process.env)
        .filter(function(key) { return /^GU_/i.test(key); })
        .map(function(key) {
            return { key: key.substr(2).toLowerCase(), val: process.env[key] };
        })
        .forEach(function(prop) { cfg[prop.key] = prop.val })

    return cfg;
}

var gu = {
    init: function(rootdir) {
        gu.config = loadMainConfig(rootdir);
        gu.router = gu.config.routes ? require('./router')(gu.config) : null;
        gu.db = require('./db')
        gu.s3 = require('./s3')(gu.config)
        gu.tmpl = require('./tmpl')(gu.config)
        return gu;
    }
}

module.exports = gu;
