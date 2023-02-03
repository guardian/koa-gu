var AWS = require('aws-sdk')
var denodeify = require('denodeify')

module.exports = async function(cfg) {
    AWS.config.credentials = new AWS.EC2MetadataCredentials({
        httpOptions: { timeout: 5000 }, // 5 second timeout
        maxRetries: 10, // retry 10 times
        retryDelayOptions: { base: 200 }, // see AWS.Config for information
        logger: console // see AWS.Config for information
      });

    var s3 = new AWS.S3();

    var exportFns = {};

    ['putObject'].forEach(function(val) {
        exportFns[val] = denodeify(s3[val].bind(s3));
    });

    return exportFns;
}
