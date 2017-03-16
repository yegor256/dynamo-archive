[![Made By Teamed.io](http://img.teamed.io/btn.svg)](http://www.teamed.io)
[![DevOps By Rultor.com](http://www.rultor.com/b/yegor256/dynamo-archive)](http://www.rultor.com/p/yegor256/dynamo-archive)

[![Build Status](https://travis-ci.org/yegor256/dynamo-archive.svg)](https://travis-ci.org/yegor256/dynamo-archive)
[![NPM version](https://badge.fury.io/js/dynamo-archive.svg)](http://badge.fury.io/js/dynamo-archive)
[![Dependency Status](https://gemnasium.com/yegor256/dynamo-archive.svg)](https://gemnasium.com/yegor256/dynamo-archive)

## Archive, Restore and Export to CSV AWS Dynamo DB Table

There are three simple Node.js scripts that archive, restore and export to csv an entire
[AWS Dynamo DB](http://aws.amazon.com/dynamodb/)
table in JSON format.

Install it first (I assume you have
[node.js](http://nodejs.org/) and
[npm](https://npmjs.org/doc/install.html) installed already):

```bash
$ npm install dynamo-archive
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
$ ./bin/dynamo-archive.js
```

To restore a table from a JSON file run:

```bash
$ ./bin/dynamo-restore.js
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

You can also save locally and export to csv

```bash
#/bin/bash

AWS_ACCESS_KEY_ID=AKIAJK.......XWGA5AA
AWS_SECRET_ACCESS_KEY=7aDUFa68GN....................IGcH0zTf3k
#/bin/bash
#make a dir with the current datetime and cd into it
DT=$(date +%Y%m%d_%H%M%S)
mkdir $DT && cd $DT
#archive all into json files
declare -a TABLES=(first second third)
for t in ${TABLES[@]}
do
	dynamo-archive/bin/dynamo-archive.js --table=$t > $t.json
done
#export the json into csv
for t in ${TABLES[@]}
do
	dynamo-archive/bin/dynamo-export.js --file=$t.json > $t.csv
done
cd ../

```


## License

Licensed under the Apache License, Version 2.0.


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/yegor256/dynamo-archive/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
