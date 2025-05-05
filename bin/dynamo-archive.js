#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: Copyright (c) 2013-2025 Yegor Bugayenko
 * SPDX-License-Identifier: MIT
 */

var utils = require('../lib/utils');
var sleep = require('sleep');

var argv = utils.config({
    demand: ['table'],
    optional: ['rate', 'query', 'key', 'secret', 'region', 'index'],
    usage: 'Archives Dynamo DB table to standard output in JSON\n' +
           'Usage: dynamo-archive --table my-table [--rate 100] [--query "{}"] [--region us-east-1] [--key AK...AA] [--secret 7a...IG] [--index index-name]'
});

var dynamo = utils.dynamo(argv);
function search(params) {
    var msecPerItem = Math.round(1000 / params.Limit / ((argv.rate || 100) / 100));
    var method = params.KeyConditions ? dynamo.query : dynamo.scan;
    var read = function(start, done, params) {
        method.call(
            dynamo,
            params,
            function (err, data) {
                if (err != null) {
                    throw err;
                }
                if (data == null) {
                    throw 'dynamo returned NULL instead of data';
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
                    read(start, done + data.Items.length, params);
                }
            }
        );
    };
    read(Date.now(), 0, params);
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
        const rcu = data.Table.ProvisionedThroughput.ReadCapacityUnits;
        var params = {
            TableName: argv.table,
            ReturnConsumedCapacity: 'NONE',
            Limit: rcu > 0 ? rcu : 1000
        };
        if (argv.index) {
            params.IndexName = argv.index
        }

        if (argv.query) {
            params.KeyConditions = JSON.parse(argv.query);
        }
        search(params);
    }
);
