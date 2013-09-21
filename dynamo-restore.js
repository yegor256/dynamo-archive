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
    .usage('Restores Dynamo DB table from JSON file\nUsage: $0 [options] < my-table.json')
    .demand(['key', 'secret', 'table'])
    .default('region', 'us-east-1')
    .default('rate', '100')
    .describe('key', 'Amazon IAM access key (20 symbols)')
    .describe('secret', 'Amazon IAM secret key (40 symbols)')
    .describe('table', 'Table name to restore')
    .describe('region', 'Amazon region, e.g. "us-east-1", "us-west-1", "eu-west-1", etc.')
    .describe('rate', 'Maximum percentage of table write capacity allowed to consume')
    .argv;

var readline = require('readline');
var sleep = require('sleep');
var AWS = require('aws-sdk');
AWS.config.update(
    {
        accessKeyId: argv.key,
        secretAccessKey: argv.secret,
        region: argv.region,
    }
);

var dynamo = new AWS.DynamoDB();
dynamo.describeTable(
    {
        TableName: argv.table
    },
    function (err, data) {
        var quota = data.Table.ProvisionedThroughput.WriteCapacityUnits;
        var start = Date.now();
        var msecPerItem = Math.round(1000 / quota / (argv.rate / 100));
        var done = 0;
        readline.createInterface(process.stdin, process.stdout).on(
            'line',
            function(line) {
                dynamo.putItem(
                    {
                        TableName: argv.table,
                        Item: JSON.parse(line),
                    },
                    function (err, data) {
                        if (err != null) {
                            console.log('Error: ' + err);
                            process.exit(1);
                        }
                    }
                );
                ++done;
                var expected = start + msecPerItem * done;
                if (expected > Date.now()) {
                    sleep.usleep((expected - Date.now()) * 1000);
                }
            }
        );
    }
);
