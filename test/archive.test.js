var test = require('tape').test
var dynalite = require('dynalite');
var exec = require('child_process').exec;
var AWS = require('aws-sdk');

var opts = {
    env: {
        AWS_ACCESS_KEY_ID: 'fake',
        AWS_SECRET_ACCESS_KEY: 'fake',
        AWS_DYNAMODB_ENDPOINT: 'http://localhost:4567',
        PATH: process.env.PATH
    },
    timeout: 10000
};

var tests = [];

tests.push(['Load archive', function (t, done) {
    t.plan(3);
    var fixture = __dirname+'/fixture.json';
    var cmd = 'dynamo-restore.js --table testing-table < '+fixture;
    exec(__dirname+'/../bin/' +cmd, opts, function(err, stdout, stderr) {
        t.notOk(err, 'Exit cleanly');
        t.notOk(stdout, 'Clean stdout');
        t.notOk(stderr, 'Clean stderr');
        done();
    });
}]);

tests.push(['Export archive', function (t, done) {
    t.plan(4);
    var cmd = 'dynamo-archive.js --table testing-table';
    exec(__dirname+'/../bin/' +cmd, opts, function(err, stdout, stderr) {
        t.notOk(err, 'Exit cleanly');
        t.notOk(stderr, 'Clean stderr');
        t.ok(stdout.length > 0, 'Got results');
        var records = stdout.split('\n').filter(function(v) { return v.length > 0; });
        t.ok(records.length == 4, 'Found items');
        done();
    });
}]);

tests.push(['Export archive with query', function (t, done) {
    t.plan(4);
    var query = JSON.stringify({
        Name: {
            ComparisonOperator: 'EQ',
            AttributeValueList: [{
                S: 'foo'
            }]
        }
    }).replace(/"/g,'\\"');
    var cmd = 'dynamo-archive.js --table testing-table --query "'+query+'"';
    exec(__dirname+'/../bin/' +cmd, opts, function(err, stdout, stderr) {
        t.notOk(err, 'Exit cleanly');
        t.notOk(stderr, 'Clean stderr');
        t.ok(stdout.length > 0, 'Got results');
        var records = stdout.split('\n').filter(function(v) { return v.length > 0; });
        t.ok(records.length == 2, 'Found items');
        done();
    });
}]);

(function() {
    function runner() {
        var current = tests.shift();
        if (!current) return dbServer.close();

        test(current[0], function(t) {
            current[1].call(this, t, runner);
        });
    }

    AWS.config.update({
        accessKeyId: opts.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: opts.env.AWS_SECRET_ACCESS_KEY,
        region: opts.env.AWS_DEFAULT_REGION || 'us-east-1'
    });

    var dbServer = dynalite({createTableMs: 5});
    dbServer.listen(4567, function(err) {
        if (err) throw err;
        var dynamo = new AWS.DynamoDB({
            endpoint: new AWS.Endpoint(opts.env.AWS_DYNAMODB_ENDPOINT)
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
            if (err) throw err;
            runner();
        });
    });
})();
