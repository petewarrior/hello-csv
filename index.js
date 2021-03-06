'use strict';

const debug = require('debug')('hello');

const fs = require('fs');
const parse = require('csv-parse');
const helper = require('./helper');

// 0. Naïve

function naive() {
    fs.readFile(__dirname + '/sample.csv', function thenParse(err, loadedCsv) {
    	if (err) {
            debug(err.message);
        }

        parse(loadedCsv, function transformEachLine(err, parsed) {
        	if (err) {
                debug(err.message);
            }
        	
            for (let index in parsed) {
                let line = parsed[index];
                
                // FIXME: Put your transformation here
                let full_name = line[0] + ' ' + line[1];
                
                let newLine = [ full_name ].concat(line.slice(2));
                console.log(newLine);
                
                
                if (index > 0) {
                    debug(`sending data index: ${index - 1}`);

                    helper.sendSms(newLine, function afterSending(err, sendingStatus) {
                        let lineToLog;
                        if (err) {
                            debug(err.message);

                            lineToLog = {
                                sendingStatus,
                                newLine,
                            };
                        }

                        if (lineToLog) {
                            helper.logToS3(lineToLog, function afterLogging(err, loggingStatus) {
                                if (err) {
                                    debug(err.message);
                                }
                            });
                        }
                    });
                }

                index++;
            }
        });
    });
}

naive();

