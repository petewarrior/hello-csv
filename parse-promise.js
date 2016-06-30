// please use promise approach to fight the naive one in parse-callback.js
'use strict';

const debug = require('debug')('parse-promise');

const fs = require('fs');
const parse = require('csv-parse');
const helper = require('./helper');

var printError = function (err) {
    debug(err);
};

var readTheFile = function (filename) {
    return new Promise(function (resolve, reject) {
        fs.readFile(filename, function (err, res) {
            if (err) reject(err);
            else resolve(res);
        });
    });
};

var parseCSV = function (data) {
    return new Promise(function (resolve, reject) {
        parse(data, function (err, res) {
            if (err) reject(err);
            else resolve(res);
        });
    });
};

var createFullName = function (record) {
    return new Promise(function (resolve, reject) {
        try {
            let fullName = record.slice(0, 2).join(' ');
            let newLine = [fullName].concat(record.slice(2));
            debug('record: ', newLine);
            resolve(newLine);
        } catch (err) {
            reject(err);
        }
    });
};

var sendSms = function (line) {
    return new Promise(function (resolve, reject) {
        try {
            helper.sendSms(line, function afterSending(err, sendingStatus) {
                let lineToLog;
                if (err) {
                    lineToLog = {
                        sendingStatus,
                        line,
                    };
                }

                if (lineToLog) {
                    logError(lineToLog);
                }

                debug('sendingStatus: ', sendingStatus);
                resolve(sendingStatus);
            });
        } catch (err) {
            reject(err);
        }
    });
};

function logError(lineToLog) {
    return new Promise(function (resolve, reject) {
        helper.logToS3(lineToLog, function afterLogging(err, loggingStatus) {
            if (err) {
                debug(err.message);
                reject(err);
            } else {
                debug('log complete');
                resolve(loggingStatus);
            }
        });
    });
}

var processData = function (parsed) {
    for (let record of parsed) {
        if (record[0] === 'first_name') continue;
        createFullName(record).then(sendSms).catch(printError);
    };
};

readTheFile(__dirname + '/sample.csv')
.then(parseCSV)
.then(processData)
.catch(printError);
