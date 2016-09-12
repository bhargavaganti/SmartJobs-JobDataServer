'use strict';

var path = require('path');
var fs = require('fs');


var pendingDirectory = path.join(__dirname, '..', 'data', 'pending');
if(!fs.existsSync(pendingDirectory)) {
    fs.mkdirSync(pendingDirectory);
}

// saves the job postings in the pending file
function saveJobPosting(job, pendingDirectory) {
    fs.appendFile(pendingDirectory + '/pending.txt', JSON.stringify(job) + "\n", function (err) {
        if (err) console.log(err);
    });
}

// functions for formating the data
var exports = module.exports = {};

/**
 * Updates the base with the given records.
 * @param  {module:qm.Base} base - The base to be updated.
 * @param  {Object | Array.<Object>} records - The object(s) used to update.
 * @param  {Boolean} garbageF - If true, activates the QMiner garbageCollector.
 */
exports.updateBase = function (base, records, garbageF) {
    var garbage = garbageF === undefined ? false : garbageF;

    if (records instanceof Array) {
        for (var RecN = 0; RecN < records.length; RecN++) {
            var record = records[RecN];
            base.store("JobPostings").push(record);
            saveJobPosting(record, pendingDirectory);
        }
    } else if (records instanceof Object) {
        base.store("JobPostings").push(records);
        saveJobPosting(records, pendingDirectory);
    } else {
        throw "Records must be an Array of Object or an Object!";
    }

    if (garbage) {
        base.garbageCollect();
    }
};
