// Please use async lib https://github.com/caolan/async
'use strict';

const debug = require('debug')('parse-async');

const fs = require('fs');
const async = require('async');
const parse = require('csv-parse');
const helper = require('./helper');

var printError = function (err) {
    debug(err);
};

var readTheFile = function (filename, callback) {
    fs.readFile(filename, callback);
};

var parseCSV = function (data, callback) {
    parse(data, callback);
};

var createFullName = function (record, callback) {
    try {
        let fullName = record.slice(0, 2).join(' ');
        let newLine = [fullName].concat(record.slice(2));
        callback(null, newLine);
    } catch (err) {
        callback(err);
    }
};

var sendSms = function (line, callback) {
    try {
        helper.sendSms(line, function afterSending(err, sendingStatus) {
            let lineToLog;
            if (err) {
                printError(err);
                lineToLog = {
                    sendingStatus,
                    line,
                };
            }

            if (lineToLog) {
                logError(lineToLog);
            }

            callback(sendingStatus);
        });
    } catch (error) {
        callback(error);
    }
};

function logError(lineToLog) {
    debug('logging ', lineToLog);
    helper.logToS3(lineToLog, function afterLogging(err, loggingStatus) {
        if (err) {
            printError(err);
            return err;
        } else {
            debug('log complete');
            return loggingStatus;
        }
    });
}

function processData(parsed, callback) {
    async.each(parsed, function (record, callback) {
        if (record[0] === 'first_name') return 0;
        async.waterfall([
            async.apply(createFullName, record),
            sendSms,
            ], printError);
    }, printError);
}

async.waterfall([
    async.apply(readTheFile, __dirname + '/sample.csv'),
    parseCSV,
    processData,
],
printError);
