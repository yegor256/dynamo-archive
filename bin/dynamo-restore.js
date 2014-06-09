#!/usr/bin/env node
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

var utils = require('../lib/utils');
var readline = require('readline');
var sleep = require('sleep');

var argv = utils.config({
    demand: ['table'],
    optional: ['rate', 'region'],
    usage: 'Restores Dynamo DB table from JSON file\n' +
           'Usage: dynamo-archive --table my-table [--rate 100]'
});

var dynamo = argv.dynamo;
dynamo.describeTable(
    {
        TableName: argv.table
    },
    function (err, data) {
        if (err != null) {
            throw err;
        }
        if (data == null) {
            throw 'Table ' + argv.table + ' not found in DynamoDB';
        }
        var quota = data.Table.ProvisionedThroughput.WriteCapacityUnits;
        var start = Date.now();
        var msecPerItem = Math.round(1000 / quota / ((argv.rate || 100) / 100));
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
                            throw err;
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
