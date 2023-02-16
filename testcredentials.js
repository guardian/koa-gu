var AWS = require('aws-sdk');

var cfg = {
    "base_url": "/uploader",
    "controllers": "./src/controllers",
    "routes": {
        "GET /": "index",
        "POST /upload": "upload",
        "GET /error": "error",
    	"GET /success": "success"
    },

    "logdir": "var/log",

    "static": [
        {"src": ["**/*"], "cwd": "public", "dest": "/"},
        {"src": ["**/*"], "cwd": "bower_components", "dest": "/"}
    ],

    "bucketName": "gdn-cdn",
    "folderPath": "uploader/embed",
    "baseURL": "https://interactive.guim.co.uk/",
    "accessKeyId": "",
    "secretAccessKey": "",
    "secret": "supersecret"
}

// var staticcredentials = new AWS.SharedIniFileCredentials(cfg.aws_profile ? {profile: cfg.aws_profile} : {});    
//     var chaincredentials = new AWS.CredentialProviderChain();
    // console.log(chain)
    // chain.providers.push(staticcredentials);
    // credentials = chain.resolve();
    // console.log(chaincredentials.providers[0]);
    async function getCredentials() {
        credentials = await new AWS.CredentialProviderChain().resolvePromise();
        console.log(credentials);
    
    }

    getCredentials();
