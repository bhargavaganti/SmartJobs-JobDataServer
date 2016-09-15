var qm = require('qminer');

/**
 * The postings storage class. Stores the postings that were Sent
 * through the POST /api/v1/jobs route.
 * @param {string} filepath - The path to the pending json file.
 */
function postingsStorage(filepath) {
    // store
    var self = this;

    // postings container
    var storage = [];
    // where the stores are saved on disc
    var pendingFile = '';

    // load the storage with pathfile
    if (typeof filepath === 'string') {
        try {
            // save the path
            pendingFile = filepath;
            // if file exists, load the file data
            var fin = qm.fs.openRead(filepath);
            storage = fin.readJson();
        } catch (err) {
            // Do nothing. File does not exist.
        }
    }

    /**
     * Stores the postings in an array.
     * @param  {Array.<Object> | Object} postings - The job postings.
     */
    this.storePostings = function(postings) {
        if (postings instanceof Array) {
            storage = storage.concat(postings);
        } else if (postings instanceof Object) {
            storage.push(postings);
        } else {
            throw "postingsStorage::storePostings: parameter must be an Array of Objects or an Object!";
        }
        return self;
    };

    /**
     * Gets the stored postings.
     * @return {Array.<Object>} The stored postings.
     */
    this.getPostings = function () {
        return storage;
    };

    /**
     * Gets the pending path.
     * @return {Array.<Object>} The stored postings.
     */
    this.getPendingPath = function () {
        return pendingFile;
    };


    /**
     * Clears the storage.
     */
    this.clear = function () {
        storage = [];
        return self;
    };

    /**
     * Saves the storage in the given file.
     * @param  {string} filepath - The path to the save file.
     */
    this.save = function (filepath) {
        var fout = qm.fs.openWrite(filepath);
        fout.writeJson(storage);
        fout.close();
        return self;
    };

    /**
     * Loads the storage from the given path.
     * @param  {string} filepath - The path to the load file.
     */
    this.load = function (filepath) {
        var fin = qm.fs.openRead(filepath);
        storage = fin.readJson();
        return self;
    };

    return this;
}

module.exports = postingsStorage;
