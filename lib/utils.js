/**
 * Copyright 2013 Yegor Bugayenko
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

require('dotenv').load();
var minimist = require('minimist');
var aws = require('aws-sdk');
var proxy = require('proxy-agent');

module.exports = {};

module.exports.dynamo = function(opts) {
    aws.config.update(
        {
            accessKeyId: opts.key || process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: opts.secret || process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: opts.session || process.env.AWS_SESSION_TOKEN,
            region: opts.region || process.env.AWS_DEFAULT_REGION || 'us-east-1'
        }
    );
    if (process.env.https_proxy) {
      aws.config.update(
          {
              httpOptions: { agent: proxy(process.env.https_proxy) }
          }
      );
    }
    var opts = {};
    if (process.env.AWS_DYNAMODB_ENDPOINT){
        opts.endpoint = new aws.Endpoint(process.env.AWS_DYNAMODB_ENDPOINT);
    }
    return new aws.DynamoDB(opts);
};

// `opts` should be an object with keys: demand, optional, usage
module.exports.config = function(opts) {
    var args = minimist(process.argv.slice(2), opts);
    var filtered = {};
    opts.demand.concat(opts.optional).forEach(
        function(k) {
            if (args[k] !== undefined) {
                filtered[k] = args[k];
            }
        }
    );
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
