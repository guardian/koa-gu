var path = require('path')
var util = require('util')
var debug = require('debug')('api')
var router = require('koa-router')()

module.exports = function(conf){
    if (conf.routes) route(conf);
    return router;
};

function route(conf) {
  debug('routes: %s', conf.name);

  var controllers = require(path.resolve(conf.rootdir, conf.controllers));

  var routes = Object.keys(conf.routes).map(function(key) {
    var controller = controllers[conf.routes[key]];
    if (!controller) throw new Error('No controller found with the name ' + conf.routes[key]);
    var request = /^(\w+) ([\w\/\*]+)$/.exec(key);
    return {
      method: request[1].toLowerCase(),
      endpoint: path.join(conf.base_url, request[2]),
      controller: controller
    }
  })

  routes.forEach(function(route){
    debug(util.format('ROUTING: %s %s to %s', route.method, route.endpoint, route.controller))
    router[route.method](route.endpoint, route.controller);
  })

  return router;
}
