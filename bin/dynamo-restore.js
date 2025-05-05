#!/usr/bin/env node
/**
 * SPDX-FileCopyrightText: Copyright (c) 2013-2025 Yegor Bugayenko
 * SPDX-License-Identifier: MIT
 */

var utils = require('../lib/utils');
var readline = require('readline');
var sleep = require('sleep');

var argv = utils.config({
    demand: ['table'],
    optional: ['rate', 'key', 'secret', 'region'],
    usage: 'Restores Dynamo DB table from JSON file\n' +
           'Usage: dynamo-archive --table my-table [--rate 100] [--region us-east-1] [--key AK...AA] [--secret 7a...IG]'
});

var dynamo = utils.dynamo(argv);
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
                        Item: JSON.parse(line)
                    },
                    function (err, data) {
                        if (err) {
                            console.log(err, err.stack);
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
