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
var sleep = require('sleep');

var argv = utils.config({
    demand: ['table'],
    optional: ['rate', 'query'],
    usage: 'Archives Dynamo DB table to standard output in JSON\n' +
           'Usage: dynamo-archive --table my-table [--rate 100] [--query "{}"]'
});

var dynamo = utils.dynamo;
var scan = function(start, msecPerItem, done, params) {
    dynamo.scan(
        params,
        function (err, data) {
            if (err != null) {
                throw err;
            }
            if (data == null) {
                throw 'dynamo.scan returned NULL instead of data';
            }
            for (var idx = 0; idx < data.Items.length; idx++) {
                process.stdout.write(JSON.stringify(data.Items[idx]));
                process.stdout.write("\n");
            }
            var expected = start + msecPerItem * (done + data.Items.length);
            if (expected > Date.now()) {
                sleep.usleep((expected - Date.now()) * 1000);
            }
            if (data.LastEvaluatedKey) {
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                scan(start, msecPerItem, done + data.Items.length, params);
            }
        }
    );
};
var query = function(start, msecPerItem, done, params) {
    dynamo.query(
        params,
        function (err, data) {
            if (err != null) {
                throw err;
            }
            if (data == null) {
                throw 'dynamo.scan returned NULL instead of data';
            }
            for (var idx = 0; idx < data.Items.length; idx++) {
                process.stdout.write(JSON.stringify(data.Items[idx]));
                process.stdout.write("\n");
            }
            var expected = start + msecPerItem * (done + data.Items.length);
            if (expected > Date.now()) {
                sleep.usleep((expected - Date.now()) * 1000);
            }
            if (data.LastEvaluatedKey) {
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                query(start, msecPerItem, done + data.Items.length, params);
            }
        }
    );
};
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
        var quota = data.Table.ProvisionedThroughput.ReadCapacityUnits;
        if (argv.query) {
            query(
                Date.now(),
                Math.round(1000 / quota / ((argv.rate || 100) / 100)),
                0,
                {
                    KeyConditions: JSON.parse(argv.query),
                    TableName: argv.table,
                    ReturnConsumedCapacity: 'NONE',
                    Limit: quota
                }
            );
        }
        else {
            scan(
                Date.now(),
                Math.round(1000 / quota / ((argv.rate || 100) / 100)),
                0,
                {
                    TableName: argv.table,
                    ReturnConsumedCapacity: 'NONE',
                    Limit: quota
                }
            );
        }
    }
);
