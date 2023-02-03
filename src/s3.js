var AWS = require('aws-sdk')
var denodeify = require('denodeify')

module.exports = function(cfg) {
    // OLD WAY FOR COMPARISON
    // AWS.config.credentials = credentials;

    var staticcredentials = new AWS.SharedIniFileCredentials(cfg.aws_profile ? {profile: cfg.aws_profile} : {});    
    var chain = new AWS.CredentialProviderChain();
    chain.providers.push(staticcredentials);
    credentials = chain.resolve();
    var s3 = new AWS.S3();

    var exportFns = {};

    ['putObject'].forEach(function(val) {
        exportFns[val] = denodeify(s3[val].bind(s3));
    });

    return exportFns;
}
