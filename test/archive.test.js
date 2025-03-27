// SPDX-FileCopyrightText: Copyright (c) 2013-2025 Yegor Bugayenko
// SPDX-License-Identifier: MIT

var path = require('path');
var test = require('tape').test
var dynalite = require('dynalite');
var exec = require('child_process').exec;
var aws = require('aws-sdk');

var tests = [];

tests.push(['Load archive', function (t, opts, done) {
    t.plan(3);
    var fixture = path.join(__dirname, 'fixture.json');
    var cmd = './dynamo-restore.js --table testing-table < '+fixture;
    exec(cmd, opts, function(err, stdout, stderr) {
        t.notOk(err, 'Exit cleanly');
        t.notOk(stdout, 'Clean stdout');
        t.notOk(stderr, 'Clean stderr');
        done();
    });
}]);

tests.push(['Export archive', function (t, opts, done) {
    t.plan(4);
    var cmd = './dynamo-archive.js --table testing-table';
    exec(cmd, opts, function(err, stdout, stderr) {
        t.notOk(err, 'Exit cleanly');
        t.notOk(stderr, 'Clean stderr');
        t.ok(stdout.length > 0, 'Got results');
        var records = stdout.split('\n').filter(function(v) { return v.length > 0; });
        t.ok(records.length == 4, 'Found items');
        done();
    });
}]);

tests.push(['Export archive with query', function (t, opts, done) {
    t.plan(4);
    var query = JSON.stringify({
        Name: {
            ComparisonOperator: 'EQ',
            AttributeValueList: [{
                S: 'foo'
            }]
        }
    }).replace(/"/g,'\\"');
    var cmd = './dynamo-archive.js --table testing-table --query "'+query+'"';
    exec(cmd, opts, function(err, stdout, stderr) {
        t.notOk(err, 'Exit cleanly');
        t.notOk(stderr, 'Clean stderr');
        t.ok(stdout.length > 0, 'Got results');
        var records = stdout.split('\n').filter(function(v) { return v.length > 0; });
        t.ok(records.length == 2, 'Found items');
        done();
    });
}]);

(function() {
    var opts = {
        env: {
            AWS_ACCESS_KEY_ID: 'fake',
            AWS_SECRET_ACCESS_KEY: 'fake',
            AWS_DYNAMODB_ENDPOINT: 'http://localhost:',
            PATH: process.env.PATH
        },
        cwd: path.join(__dirname,'../bin/'),
        timeout: 10000
    };

    function runner() {
        var current = tests.shift();
        if (!current) {
            return dbServer.close();
        }

        test(current[0], function(t) {
            current[1].call(this, t, opts, runner);
        });
    }

    aws.config.update({
        accessKeyId: opts.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: opts.env.AWS_SECRET_ACCESS_KEY,
        region: opts.env.AWS_DEFAULT_REGION || 'us-east-1'
    });

    var dbServer = dynalite({createTableMs: 5});
    dbServer.listen(0, function(err) {
        if (err != null) {
            throw err;
        }
        opts.env.AWS_DYNAMODB_ENDPOINT += dbServer.address().port;
        var dynamo = new aws.DynamoDB({
            endpoint: new aws.Endpoint(opts.env.AWS_DYNAMODB_ENDPOINT)
        });
        var params = {
          AttributeDefinitions: [
            {
              AttributeName: 'Name',
              AttributeType: 'S',
            },
            {
              AttributeName: 'Value',
              AttributeType: 'N',
            }
          ],
          KeySchema: [
            {
              AttributeName: 'Name',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'Value',
              KeyType: 'RANGE',
            }
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
          },
          TableName: 'testing-table'
        };
        dynamo.createTable(params, function(err, data) {
            if (err != null) {
                throw err;
            }
            runner();
        });
    });
})();
