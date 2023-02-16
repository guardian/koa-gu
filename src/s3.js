var AWS = require('aws-sdk')
var denodeify = require('denodeify')

module.exports = async function(cfg) {

    async function getCredentials() {
        let credentials = await new AWS.CredentialProviderChain().resolvePromise();
        console.log(credentials);
        return credentials;
    }

    var credentials = await getCredentials();
    AWS.config.credentials = credentials;
    var s3 = new AWS.S3();

    var exportFns = {};

    ['putObject'].forEach(function(val) {
        exportFns[val] = denodeify(s3[val].bind(s3));
    });

    return exportFns;
}
