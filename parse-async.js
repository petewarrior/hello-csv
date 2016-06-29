// Please use async lib https://github.com/caolan/async
'use strict';

const debug = require('debug')('parse-async');

const readline = require('readline');
const fs = require('fs');
const async = require('async');

const rl = readline.createInterface({
    input: fs.createReadStream('sample.csv')
});


rl.on('line', function parseLine(line){
});

rl.on('close', function closeReadline() {

});