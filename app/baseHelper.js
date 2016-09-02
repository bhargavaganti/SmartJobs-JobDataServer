'use strict';

// functions for formating the data
var exports = module.exports = {};

/**
 * Updates the base with the given records.
 * @param  {module:qm.Base} base - The base to be updated.
 * @param  {Object | Array.<Object>} records - The object(s) used to update.
 * @param  {Boolean} garbageF - If true, activates the QMiner garbageCollector.
 */
exports.updateBase = function (base, records, garbageF) {
    if (records instanceof Array) {
        for (var RecN = 0; RecN < records.length; RecN++) {
            var record = records[RecN];
            base.store("Jobs").push(record);
        }
    } else if (records instanceof Object) {
        base.store("Jobs").push(records);
    } else {
        throw "Records must be an Array of Object or an Object!";
    }

    if (garbageF) {
        base.garbageCollect();
    }
};
