## Archive and Restore AWS Dynamo DB Table

There are two simple Node.js scripts that archive and restore an entire
[AWS Dynamo DB](http://aws.amazon.com/dynamodb/)
table in JSON format.

Install prerequisites first (I assume you have
[node.js](http://nodejs.org/) and
[npm](https://npmjs.org/doc/install.html) installed already):

> npm install aws-sdk optimist readline sleep

Then, clone the project:

> git clone git@github.com:yegor256/dynamo-archive.git

Create a user in [Amazon IAM](http://aws.amazon.com/iam/)
and assign a policy to it ([how?](http://docs.aws.amazon.com/IAM/latest/UserGuide/ManagingPolicies.html)):

```
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

> node dynamo-archive.js

To restore a table from a JSON file run:

> node dynamo-restore.js

## Crontab automation

I'd recommend to use this simple bash script to automate backups
of your Dynamo DB tables and save them to S3 (I'm using [s3cmd](http://s3tools.org/s3cmd)):

```bash
#/bin/bash

KEY=AKIAJK.......XWGA5AA
SECRET=7aDUFa68GN....................IGcH0zTf3k
declare -a TABLES=(first second third)
for t in ${TABLES[@]}
do
  node dynamo-archive/dynamo-archive.js --key=$KEY --secret=$SECRET --table=$t > $t.json
  s3cmd --no-progress put $t.json s3://backup.example.com/dynamo/$t.json
  rm $t.json
done
```

## License

Licensed under the Apache License, Version 2.0.
