var AWS = require("aws-sdk");
var denodeify = require("denodeify");

module.exports = function () {
  var s3 = new AWS.S3();

  const exportFns = {};

  ["putObject"].forEach(function (val) {
    exportFns[val] = denodeify(s3[val].bind(s3));
  });

  return exportFns;
};
