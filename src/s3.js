var AWS = require('aws-sdk')
var denodeify = require('denodeify')

module.exports = function(cfg) {
    var credentials = new AWS.SharedIniFileCredentials(cfg.AWSProfile ? {profile: cfg.AWSProfile} : {});
    AWS.config.credentials = credentials;
    var s3 = new AWS.S3();

    var exportFns = {};

    ['putObject'].forEach(function(val) {
        exportFns[val] = denodeify(s3[val].bind(s3));
    });

    return exportFns;
}
