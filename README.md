[![DevOps By Rultor.com](https://www.rultor.com/b/yegor256/dynamo-archive)](https://www.rultor.com/p/yegor256/dynamo-archive)

[![npm](https://github.com/yegor256/dynamo-archive/actions/workflows/npm.yml/badge.svg)](https://github.com/yegor256/dynamo-archive/actions/workflows/npm.yml)
[![NPM version](https://badge.fury.io/js/dynamo-archive.svg)](https://badge.fury.io/js/dynamo-archive)

There are two simple Node.js scripts that archive and restore an entire
[AWS Dynamo DB](http://aws.amazon.com/dynamodb/)
table in JSON format.

Install it first (I assume you have
[Node.js](http://nodejs.org/) and
[Npm](https://npmjs.org/doc/install.html) installed already):

```bash
$ npm install -g dynamo-archive
```

Create a user in [Amazon IAM](http://aws.amazon.com/iam/)
and assign a policy to it ([how?](http://docs.aws.amazon.com/IAM/latest/UserGuide/ManagingPolicies.html)):

```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:Scan", "dynamodb:DescribeTable"],
      "Resource": "arn:aws:dynamodb:us-east-1:019644334823:table/test"
    }
  ]
}
```

Where `019644334823` if your AWS account number, `us-east-1` is AWS region,
and `test` is the name of your Dynamo DB table (can be a `*`, if you grant
access to all tables).

Run it first without arguments and read the output:

```bash
$ dynamo-archive.js
```

To restore a table from a JSON file run:

```bash
$ dynamo-restore.js
```

## Crontab automation

I'd recommend to use this simple bash script to automate backups
of your Dynamo DB tables and save them to S3 (I'm using [s3cmd](http://s3tools.org/s3cmd)):

```bash
#/bin/bash

AWS_ACCESS_KEY_ID=AKIAJK.......XWGA5AA
AWS_SECRET_ACCESS_KEY=7aDUFa68GN....................IGcH0zTf3k
#optional endpoint for DynamoDB local
AWS_DYNAMODB_ENDPOINT=http://localhost:8000/
declare -a TABLES=(first second third)
for t in ${TABLES[@]}
do
  dynamo-archive/bin/dynamo-archive.js --table=$t > $t.json
  s3cmd --no-progress put $t.json s3://backup.example.com/dynamo/$t.json
  rm $t.json
done
```

## How to contribute

Read [these guidelines](https://www.yegor256.com/2014/04/15/github-guidelines.html).
Make sure your build is green before you contribute
your pull request. You will need to have NodeJS and installed. Then:

```
$ npm install
$ npm test
```

If it's clean and you don't see any error messages, submit your pull request.
