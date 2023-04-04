var AWS = require("aws-sdk");

module.exports = async function({ aws_profile }) {
  AWS.CredentialProviderChain.defaultProviders = [
    function () {
      return new AWS.EC2MetadataCredentials();
    },
    function () {
      return new AWS.SharedIniFileCredentials({
        profile: aws_profile ? aws_profile : "interactives",
      });
    },
  ];

  var chain = new AWS.CredentialProviderChain();

  try {
    const credentials = await chain.resolvePromise();
    AWS.config.credentials = credentials;
    return credentials;
  } catch(e) {
    console.log("Error authenticating AWS credentials: " + e.message);
  }
}
