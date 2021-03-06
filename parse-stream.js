// 0. Please use readline (https://nodejs.org/api/readline.html) to deal with per line file reading
// 1. Then use the parse API of csv-parse (http://csv.adaltas.com/parse/ find the Node.js Stream API section)

'use strict';

const debug = require('debug')('parse-stream');

const fs = require('fs');
const parse = require('csv-parse');
const helper = require('./helper');
const transform = require('stream-transform');

const input = fs.createReadStream('./sample.csv');

//Create the parser
const parser = parse();
input.on('close', function () {
    parser.end();
});

var counter = 0;

var createFullNameRecord = transform(function (record, callback) {
    if (!record) return false;
    debug('total lines', parser.count);
    if (record[0] === 'first_name') return false;
    let fullName = record.slice(0, 2).join(' ');

    let newLine = [fullName].concat(record.slice(2));

    debug('Full name: ', newLine);
    callback(null, newLine);
}, { parallel: 20 });

var printErr = function (err) {
    debug(err.message);
};

var logErr = transform(function (logData) {
    debug('error to log: ', logData);
    helper.logToS3(logData, function (error, loggingStatus) {
        if (error) debug(error.message);
    });
});

var sendSms = transform(function (newLine) {
    var lineToLog;
    helper.sendSms(newLine, function afterSending(err, sendingStatus) {
        if (err) {
            debug('to log: ', err.message);

            logErr.write({
                sendingStatus,
                newLine,
            });
        }
    });

    if (lineToLog) debug('lineToLog: ', lineToLog);
    return lineToLog;

}, { parallel: 10 });

var logToS3 = transform(helper.logToS3, { parallel: 1 });
logToS3.on('error', printErr);

input.pipe(parser).pipe(createFullNameRecord).pipe(sendSms);
