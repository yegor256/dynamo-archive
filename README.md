# Dynamo DB table archiver

This is a simple Node.js script that archives an entire
Dynamo DB table to console in JSON format.

Install it first (I assume you have
[node.js](http://nodejs.org/) and
[npm](https://npmjs.org/doc/install.html) installed already):

```
npm install aws-sdk
npm install optimist
npm install csv
git clone git@github.com:yegor256/dynamo-archive.git
```

Create a user in [Amazon IAM](http://aws.amazon.com/iam/)
and assign a policy to it ([how?](http://docs.aws.amazon.com/IAM/latest/UserGuide/ManagingPolicies.html)):

```
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "dynamodb:Scan",
      "Resource": "arn:aws:dynamodb:us-east-1:019644334823:table/test"
    }
  ]
}
```

Where `019644334823` if your AWS account number, `us-east-1` is AWS region,
and `test` is the name of your Dynamo DB table.

Run it first without arguments and read the output:

```
node dynamo-archive.js
```

## License

Licensed under the Apache License, Version 2.0.
