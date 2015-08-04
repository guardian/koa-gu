var glob = require('glob')
var path = require('path')
var send = require('koa-send')
var _ = require('lodash')

module.exports = function(conf){
    var staticRoutes = _(conf.static)
        .map(function(opts) {
            return _(opts.src).map(function(globString) {
                return glob
                    .sync(globString, {cwd: path.resolve(conf.rootdir, opts.cwd || '.')})
                    .map(function(filePath) {
                        return [
                            path.join(conf.base_url, opts.dest || '', filePath),
                            path.resolve(opts.cwd, filePath)
                        ];
                    });

            }).flatten().valueOf();
        })
        .flatten().zipObject().valueOf();

    return function *serve(next){
        if (this.method == 'HEAD' || this.method == 'GET') {
            var targetFile = staticRoutes[this.path];
            if (targetFile) {
                if (yield send(this, targetFile)) return;
            }
        }
        yield* next;
    };
};
