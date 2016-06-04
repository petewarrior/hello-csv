// 0. Please use readline (https://nodejs.org/api/readline.html) to deal with per line file reading
// 1. Then use the parse API of csv-parse (http://csv.adaltas.com/parse/ find the Node.js Stream API section)

'use strict';

const debug = require('debug')('parse-stream');

const readline = require('readline');
const fs = require('fs');
const parse = require('csv-parse');
const helper = require('./helper');


//Create the parser
const parser = parse({
	  //columns: true
});

//Use the writable stream api
parser.on('data', function(record){
	if(record[0] == 'first_name') return false;
	debug('Line from file: ', record);
	let full_name = record[0] + ' '  + record[1];
	//debug('Full name: ', full_name);
    let newLine = [ full_name ].concat(record.slice(2));
	debug('Combined line: ', newLine);
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
});


// Catch any error
parser.on('error', function(err){
  debug(err.message);
});

const input = fs.createReadStream('./sample.csv');

const rl = readline.createInterface({
  input: input
});



rl.on('line', function parseLine(line){
	//debug(line);
	parser.write(line);
	parser.write('\n');
});

rl.on('close', function closeReadline() {
	parser.end();
});

//stream.pipe(rl);