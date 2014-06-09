require('dotenv').load();
var parseArgs = require('minimist');
var AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
});

module.exports = {};
module.exports.s3 = new AWS.DynamoDB;

// `opts` should be an object with keys: demand, optional, usage
module.exports.config = function(opts) {
    var args = parseArgs(process.argv.slice(2), opts);

    var filtered = {};
    opts.demand.concat(opts.optional).forEach(function(k) {
        if (args[k] !== undefined) filtered[k] = args[k];
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
