require('dotenv').load();
var minimist = require('minimist');
var aws = require('aws-sdk');

module.exports = {};

module.exports.dynamo = (function() {
    aws.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
    });
    var opts = {};
    if (process.env.AWS_DYNAMODB_ENDPOINT){
        opts.endpoint = new aws.Endpoint(process.env.AWS_DYNAMODB_ENDPOINT);
    }
    return new aws.DynamoDB(opts);
})();

// `opts` should be an object with keys: demand, optional, usage
module.exports.config = function(opts) {
    var args = minimist(process.argv.slice(2), opts);

    var filtered = {};
    opts.demand.concat(opts.optional).forEach(function(k) {
        if (args[k] !== undefined) {
            filtered[k] = args[k];
        }
    });

    // Ensure required params are present
    if (opts.demand.reduce(function(m, k) {
        return m || filtered[k] == undefined;
    }, false)) {
        console.error('> Missing required argument')
        console.error(opts.usage);
        process.exit(1);
    }

    return filtered;
};
