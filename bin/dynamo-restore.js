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
    optional: ['rate', 'key', 'secret', 'region'],
    usage: 'Restores Dynamo DB table from JSON file\n' +
           'Usage: dynamo-archive --table my-table [--rate 100] [--region us-east-1] [--key AK...AA] [--secret 7a...IG]'
});

delay = t => new Promise(resolve => { setTimeout(resolve, t) })

var dynamo = utils.dynamo(argv);

dynamo.describeTable({ TableName: argv.table }, (err, data) => {
        if (err != null) throw err
        if (data == null) throw 'Table ' + argv.table + ' not found in DynamoDB'

        var quota = data.Table.ProvisionedThroughput.WriteCapacityUnits;
        var promises = []
        var counter = 0

        readline.createInterface({input: process.stdin, terminal: false, output: process.stdout}).on(
            'line',
            line => {
                promises.push(() => new Promise((resolve, reject) => {
                    dynamo.putItem({
                            TableName: argv.table,
                            Item: JSON.parse(line)
                        }, (err, data) => {
                            if (err) {
                                console.log(err, err.stack);
                                return reject(err)
                            }

                            resolve()
                        }
                    );
                }))
            }
        ).on('close', function() {
            console.log(`Total promises: ${promises.length}`)

            var batches = promises.reduce((set, promise) => {
                var current = set.length - 1
                set[current].push(promise)
                if (set[current].length == quota) set.push([])

                return set
            }, [[]])

            var promiseBatches = batches.map(batch => () => {
                    if (batch.length == 0) return Promise.resolve()

                    return delay(1000)
                        .then(() => Promise.all(batch.map(promise => promise())) )
                        .then(() => { console.log(`Processed a batch with ${batch.length} items`) })
            })

            console.log(`Processing ${promiseBatches.length} batches of promises, up to ${quota} promises each`)

            Promise.series(promiseBatches, {}).then(() => {
                console.log('All done, hooray!')
            }).catch(err => {
                console.log(err)
            })
        });
    }
);

Promise.series = function(promises, initValue) {
    return promises.reduce(function(chain, promise) {
        if (typeof promise !== "function") {
            return Promise.reject(
                new Error("Error: Invalid promise item: " + promise)
            )
        }
        return chain.then(promise)
    }, Promise.resolve(initValue))
}