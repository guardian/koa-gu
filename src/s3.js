var AWS = require('aws-sdk')
var denodeify = require('denodeify')

module.exports = async function(cfg) {

    async function getCredentials() {

        let chain = new AWS.CredentialProviderChain();
        chain.providers = [
            function () { return new AWS.EC2MetadataCredentials()},
            function () { return new AWS.SharedIniFileCredentials({profile: 'interactives'}); }
        ]

        let credentials = await chain.resolvePromise();
        console.log(credentials);
        return credentials;
    
    }


    AWS.config.credentials = await getCredentials();
    var s3 = new AWS.S3();

    var exportFns = {};

    ['putObject'].forEach(function(val) {
        exportFns[val] = denodeify(s3[val].bind(s3));
    });

    return exportFns;
}
