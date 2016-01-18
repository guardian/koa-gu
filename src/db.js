var denodeify = require('denodeify')
var redis = require('redis');
var client = redis.createClient();

client.on("error", function (err) {
    console.error("Error " + err);
});

var denodeifyCommands = ['get', 'set', 'mget', 'mset', 'zrevrange', 'zadd', 'zcard']
denodeifyCommands.forEach(function(val) { client[val] = denodeify(client[val].bind(client) );});

client.setObj = function(key, obj) { return client.set(key, JSON.stringify(obj)); }
client.getObj = function(key) {
    return client.get(key)
        .then(function(val) { return JSON.parse(val); });
}

module.exports = client
