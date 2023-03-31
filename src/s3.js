var AWS = require("aws-sdk");
var denodeify = require("denodeify");

module.exports = async function (cfg) {
  AWS.CredentialProviderChain.defaultProviders = [
    function () {
      return new AWS.EC2MetadataCredentials();
    },
    function () {
      return new AWS.SharedIniFileCredentials({
        profile: cfg.aws_profile ? cfg.aws_profile : "default",
      });
    },
  ];

  var chain = new AWS.CredentialProviderChain();

  var chainpromise = chain.resolvePromise();

  chainpromise.then(
    function (credentials) {
      AWS.config.credentials = credentials;
    },
    function (err) {
      console.log("Error: " + err.message);
    }
  );

  var s3 = new AWS.S3();

  const exportFns = {};

  ["putObject"].forEach(function (val) {
    exportFns[val] = denodeify(s3[val].bind(s3));
  });

  return exportFns;
};
