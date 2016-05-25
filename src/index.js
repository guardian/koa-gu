var fs = require('fs')
var path = require('path')
var callsite = require('callsite')
var winston = require('winston')
var mkdirp = require('mkdirp')
var _ = require('lodash')

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

    var baseCfgPath = path.join(rootDir, 'gu.json');
    var baseCfgFile = fs.readFileSync(baseCfgPath);
    var baseCfg = JSON.parse(baseCfgFile);

    var overridesCfgPath = path.join(rootDir, 'gu-overrides.json');
    var overridesCfg = fs.existsSync(overridesCfgPath) && JSON.parse(fs.readFileSync(overridesCfgPath));
    var cfg = overridesCfg ? _.merge(baseCfg, overridesCfg) : baseCfg;

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

function createLogger(logdir) {
    var transports = [new (winston.transports.Console)()];
    var exceptionHandlers = [];
    if (logdir) {
        mkdirp.sync(logdir);
        transports = transports.concat([
            new (winston.transports.File)({
              name: 'debug-file',
              filename: path.resolve(logdir, 'debug.log'),
              level: 'debug',
              tailable: true,
              maxsize: 5 * 1024 * 1024, // 5MB
              maxFiles: 10
            }),
            new (winston.transports.File)({
              name: 'error-file',
              filename: path.resolve(logdir, 'error.log'),
              level: 'error',
              tailable: true,
              maxsize: 5 * 1024 * 1024, // 5MB
              maxFiles: 10
            })
        ])
        exceptionHandlers.push(
            new winston.transports.File({ filename: path.resolve(logdir, 'exceptions.log') })
        );
    }
    return new (winston.Logger)({ transports: transports, exceptionHandlers: exceptionHandlers });
}

var gu = {
    init: function(opts) {
        opts = opts || {};
        www = opts.www !== undefined ? opts.www : true;
        db = opts.db !== undefined ? opts.db : true;

        // get the caller's directory
        var callerDir = path.dirname(callsite()[1].getFileName());

        gu.config = loadMainConfig(callerDir);
        if (www) {
            gu.router = gu.config.routes ? require('./router')(gu.config) : null;
            gu.static = gu.config.static ? require('./static')(gu.config) : null;
        }
        gu.log = createLogger(gu.config.logdir && path.resolve(gu.config.rootdir, gu.config.logdir))

        if (db) gu.db = require('./db')

        gu.s3 = require('./s3')(gu.config)
        gu.tmpl = require('./tmpl')(gu.config)

        gu.dir = function() {
            var args = [].slice.call(arguments);
            args.unshift(gu.config.rootdir);
            return path.resolve.apply(null, args);
        }

        gu.env = (process.env.GU_ENV || 'dev').toLowerCase()
        gu.dev = gu.env === 'dev'
        gu.prod = gu.env === 'prod'

        if (gu.router && gu.config.logdir) {
            gu.router.get(path.join(gu.config.base_url, 'log'), function*() {
                var logJson = fs.readFileSync(gu.dir(gu.config.logdir, 'debug.log'), 'utf8')
                var log = logJson.split('\n')
                    .filter(v => !!v)
                    .reverse().slice(0, 2000)
                    .map(JSON.parse)
                this.body = gu.tmpl('./templates/log.html', { log: log })
            })
        }

        return gu;
    }
}

module.exports = gu;
