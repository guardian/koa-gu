var fs = require('fs')
var path = require('path')
var callsite = require('callsite')
var winston = require('winston')
var mkdirp = require('mkdirp')

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
              maxsize: 5 * 1024 * 1024 // 5MB
            }),
            new (winston.transports.File)({
              name: 'error-file',
              filename: path.resolve(logdir, 'error.log'),
              level: 'error',
              maxsize: 5 * 1024 * 1024 // 5MB
            })
        ])
        exceptionHandlers.push(
            new winston.transports.File({ filename: path.resolve(logdir, 'exceptions.log') })
        );
    }
    return new (winston.Logger)({ transports: transports, exceptionHandlers: exceptionHandlers });
}

var gu = {
    init: function(www) {
        www = www !== undefined ? www : true;

        // get the caller's directory
        var callerDir = path.dirname(callsite()[1].getFileName());

        gu.config = loadMainConfig(callerDir);
        if (www) {
            gu.router = gu.config.routes ? require('./router')(gu.config) : null;
            gu.static = gu.config.static ? require('./static')(gu.config) : null;
        }
        gu.log = createLogger(gu.config.logdir && path.resolve(gu.config.rootdir, gu.config.logdir))

        gu.db = require('./db')
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
                var log = logJson.split('\n').filter(v => !!v).map(JSON.parse)
                log.reverse()
                this.body = gu.tmpl('./templates/log.html', { log: log })
            })
        }

        gu.log.debug('koa-gu initialized');

        return gu;
    }
}

module.exports = gu;
