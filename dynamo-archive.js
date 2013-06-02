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

var argv = require('optimist')
    .usage('Archives Dynamo DB table to standard output in JSON\nUsage: $0 [options] > my-table.csv')
    .demand(['key', 'secret', 'table'])
    .default('region', 'us-east-1')
    .default('format', 'json')
    .describe('key', 'Amazon IAM access key (20 symbols)')
    .describe('secret', 'Amazon IAM secret key (40 symbols)')
    .describe('table', 'Comma-separated list of Dynamo DB tables to archive')
    .describe('region', 'Amazon region, e.g. "us-east-1", "us-west-1", "eu-west-1", etc.')
    .argv;

var AWS = require('aws-sdk');
AWS.config.update(
    {
        accessKeyId: argv.key,
        secretAccessKey: argv.secret,
        region: argv.region,
    }
);

var dynamo = new AWS.DynamoDB();
var params = {
    TableName: argv.table,
    ReturnConsumedCapacity: 'NONE',
};
while (true) {
    dynamo.scan(
        params,
        function (err, data) {
            if (err != null) {
                console.log('Error: ' + err);
                process.exit(1);
            }
            params['ExclusiveStartKey'] = data['LastEvaluatedKey'];
            for (var idx = 0; idx < data['Items'].length; idx++) {
                var item = data['Items'][idx];
                process.stdout.write(JSON.stringify(item));
                process.stdout.write("\n");
            }
        }
    );
    if (params['ExclusiveStartKey'] == null) {
        break;
    }
}
