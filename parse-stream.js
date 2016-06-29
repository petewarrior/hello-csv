// 0. Please use readline (https://nodejs.org/api/readline.html) to deal with per line file reading
// 1. Then use the parse API of csv-parse (http://csv.adaltas.com/parse/ find the Node.js Stream API section)

'use strict';

const debug = require('debug')('parse-stream');

const readline = require('readline');
const fs = require('fs');
const parse = require('csv-parse');
const helper = require('./helper');
const transform = require('stream-transform');

const input = fs.createReadStream('./sample.csv');

//Create the parser
const parser = parse();

//Use the writable stream api
//parser.on('data', function () {
var createFullNameRecord = transform(function(record) {
    if (record[0] == 'first_name') return false;
    //debug('Line from file: ', record);
    let fullName = record[0] + ' '  + record[1];

    let newLine = [fullName].concat(record.slice(2));
    //debug('Combined line: ', newLine);
    return record;
}, {parallel: 100});

var printErr = function(err) {
    debug(err.message);
}

var sendSms = transform(helper.sendSms, {parallel: 100});
sendSms.on('error', printErr)

var sendSms_ = transform(function(newLine) {
    var lineToLog;
    helper.sendSms(newLine, function afterSending(err, sendingStatus) {
        if (err) {
            //debug('to log: ', err.message);
        
            lineToLog = {
                sendingStatus,
                newLine,
            };
        }
    });

    if(lineToLog) debug('lineToLog: ', lineToLog);
    return lineToLog;

}, {parallel: 20});

var logToS3 = transform(helper.logToS3, {parallel: 100});
logToS3.on('error', printErr);

var logToS3 = transform(function(lineToLog) {
    debug('lineToLog: ', lineToLog);
      if (lineToLog) {
            
            helper.logToS3(lineToLog, function afterLogging(err, loggingStatus) {
                if (err) {
                    debug(err.message);
                }

                debug(loggingStatus);
            });
        }
}, {parallel: 20});

// Catch any error
parser.on('error', printErr);

const rl = readline.createInterface({
    input: input,
    output: parser
});

// rl.on('line', function parseLine(line) {
// //    debug('line: ', line);
//      //parser.write(line);
// //     parser.write('\n');
// });

rl.on('close', function closeReadline() {
    parser.end();
});

//stream.pipe(rl);
input.pipe(parser).pipe(createFullNameRecord).pipe(sendSms).pipe(logToS3);