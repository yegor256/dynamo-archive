#!/usr/bin/env node
/**
 * Copyright 2017 Ali Alaoui
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
var fs = require('fs');
var readline = require('readline');

var unmarshalItem = require('dynamodb-marshaler').unmarshalItem;
var moment = require('moment-timezone');


//-- Set default timezone
moment.tz.setDefault("Europe/Paris");
moment.locale('fr');

//--
var argv = utils.config({
    demand: ['file'],
    optional: [],
    usage: 'Generates a CSV file from a JSON file\n' +
           'Usage: ddbutocsv --file my-file'
});


function writeDateToCsv(headers, file) {
   //-- Get the rest of the items
   readline.createInterface({
      input: fs.createReadStream(argv.file)
   }).on('line', function(line) {

      var values
      var header
      var value

      //-- JSON parse, unmarshal and flatten
      var item = utils.flatten(unmarshalItem(JSON.parse(line)))

      //-- Stores the headers
      values = [];
      for (i = 0; i < headers.length; i++) {
            value = ""
            header = headers[i]
            //-- Loop through the header rows, adding values if they exist
            if (item.hasOwnProperty(header)) {
               value = item[header]
               //-- Check if timestamp, there is maybe a better way to do this
               if(typeof value === "number" && value > 1400000000000)
                  value = moment(parseInt(value)).format('dddd D MMMM YYYY à kk:mm')

            } else {
               value = ""
            }
           values.push(value)
      }

      process.stdout.write(utils.csv(values))
      process.stdout.write("\n")

    });

}


//-- headers
var headers = [];

//-- Get the headers
readline.createInterface({
      input: fs.createReadStream(argv.file)
   }).on('line',function(line) {

   //-- JSON parse, unmarshal and flatten
   var item = utils.flatten(unmarshalItem(JSON.parse(line)))

   //-- Stores the headers
   for (var key in item) {
      if(headers.indexOf(key) == -1 ) {
         headers.push(key)
      }
   }

   }).on('close', function() {
      //-- Print to file
      process.stdout.write(utils.csv(headers))
      process.stdout.write("\n")

      //-- Now process all data
      writeDateToCsv(headers, argv.file)
   }
);
