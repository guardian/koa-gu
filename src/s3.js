var AWS = require('aws-sdk')
var denodeify = require('denodeify')

module.exports = async function(cfg) {

    // var credentials = new AWS.SharedIniFileCredentials(cfg.aws_profile ? {profile: cfg.aws_profile} : {});
    // AWS.config.credentials = credentials;

    AWS.CredentialProviderChain.defaultProviders = [
        function () { return new AWS.EC2MetadataCredentials(); },
        function () { return new AWS.EnvironmentCredentials('AWS'); },
        function () { return new AWS.EnvironmentCredentials('AMAZON'); },
        function () { return new AWS.SharedIniFileCredentials({profile: aws_profile ? aws_profile : 'default' }); }
      ];

    
var chain = new AWS.CredentialProviderChain();

chain.resolvePromise((err, cred)=>{
	AWS.config.credentials = cred;}).then(() =>{

        var s3 = new AWS.S3();

        var exportFns = {};
    
        ['putObject'].forEach(function(val) {
            exportFns[val] = denodeify(s3[val].bind(s3));
        });
    
        return exportFns;
    
})


    
}
