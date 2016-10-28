'use strict';

module.exports = exports = (function () {
    var qm = require('qminer');

    var exports = {};

    /**
     * QMiner database container.
     */
    exports.Database = function () {
        /**
         * The QMiner database.
         * @type {module:qm.Base}
         */
        var base = new qm.Base({
            mode: 'openReadOnly',
            dbPath: './data/database/'
        });

        /////////////////////////////////////////
        /// Get Methods

        /**
         * Returns the QMiner base.
         * @return {module:qm.Base} The database.
         */
        this.getBase = function () {
            return base;
        }

        /**
         * Gets the specific record with id.
         * @param  {number} id - The id of the record.
         * @return {qm.Record} The record.
         */
        this.getRecord = function (storeName, id) {
            return base.store(storeName)[id];
        }

        /**
         * Creates a new record.
         * @param  {Object} record - The record structure.
         * @return {qm.Record} The record.
         */
        this.createNewRecord = function (storeName, record) {
            return base.store(storeName).newRecord(record);
        }

        /**
         * Creates a new record set.
         * @param  {qm.la.IntVector} intV - The integer vector containing record ids.
         * @return {qm.RecSet} The record set.
         */
        this.createNewRecordSet = function (storeName, intV) {
            return base.store(storeName).newRecordSet(intV);
        }

        /**
         * Updates the database with the storage data.
         * @param  {Object} storage - The storage container.
         */
        this.update = function (storage) {
            // check if there are any new postings
            var postings = storage.getPostings();
            // TODO: uncomment before deployment
            // if (postings.length === 0) {
            //     return responseHandlers.successHandler(req, res, "No postings available for update");
            // }

            base.close(); base = new qm.Base({
                mode: 'open',
                dbPath: './data/database/'
            });
            // update the database with postings
            if (postings instanceof Array) {
                for (var RecN = 0; RecN < postings.length; RecN++) {
                    var record = postings[RecN];
                    base.store("Jobs").push(record);
                }
            } else if (postings instanceof Object) {
                base.store("Jobs").push(postings);
            } else {
                throw "Records must be an Array of Object or an Object!";
            }
            // open database in read only mode
            base.close(); base = new qm.Base({
                mode: 'openReadOnly',
                dbPath: './data/database/'
            });
        }

        /**
         * Queries the database for the content
         * @param {Object} _content - The query content.
         * @property {Array.<String>} _content.skills - Skill names. Using the AND operator.
         * @property {Array.<String>} _content.locations - Location names. Using the OR operator.
         * @property {Array.<String>} _content.countries - Country names. Using the OR operator.
         * @return {module:qm.RecordSet} The queried Job Posts containing the query answer.
         */
        this.query = function (_content) {
            var question = {};
            if (_content.skills) {
                question.$join = [];
                var skills = _content.skills;
                if (skills instanceof Array) {
                    // if there is an array of skills
                    for (var skillN = 0; skillN < skills.length; skillN++) {
                        var skillJoin = {
                            $name: "requiredForJobs",
                            $query: {
                                $from: "Skills",
                                name: skills[skillN]
                            }
                        };
                        question.$join.push(skillJoin);
                    }
                } else if (typeof skills === "string") {
                    // if there is only one skill (string)
                    var skill = {
                        $name: "requiredForJobs",
                        $query: {
                            $from: "Skills",
                            name: skills
                        }
                    };
                    question.$join.push(skill);
                } else {
                    return "Invalid Skill Type " + (typeof skills);
                }
            }
            // set the OR operator for locations and countries
            if (_content.locations || _content.countries) {
                question.$or = [];
                if (_content.locations) {
                    var locations = _content.locations;
                    if (locations instanceof Array) {
                        // if there is an array of locations
                        var locationJoin = {
                            $join: {
                                $name: "foundJobs",
                                $query: {
                                    $from: "Locations",
                                    name: { $or: locations }
                                }
                            }
                        };
                        question.$or.push(locationJoin);
                    } else if (typeof locations === "string") {
                        // if there is one location (string)
                        var location = {
                            $join: {
                                $name: "foundJobs",
                                $query: {
                                    $from: "Locations",
                                    name:  locations
                                }
                            }
                        };
                        question.$or.push(location);
                    } else {
                        return "Invalid Location type " + (typeof locations);
                    }
                }
                if (_content.countries) {
                    var countries = _content.countries;
                    if (countries instanceof Array) {
                        // if there is an array of countries
                        var countryJoin = {
                            $join: {
                                $name: "foundJobs",
                                $query: {
                                    $from: "Countries",
                                    name: { $or: countries }
                                }
                            }
                        };
                        question.$or.push(countryJoin);
                    } else if (typeof countries === "string") {
                        // if there is one country (string)
                        var country = {
                            $join: {
                                $name: "foundJobs",
                                $query: {
                                    $from: "Countries",
                                    name:  countries
                                }
                            }
                        };
                        question.$or.push(country);
                    } else {
                        return "Invalid Country type " + (typeof countries);
                    }
                }
            }

            // check if question was not empty
            if (Object.keys(question).length === 0) {
                return "Invalid Query Search. Query must contain 'skills', 'locations' and/or 'countries' key!";
            }
            // query the base
            var answer = base.search(question);
            return answer;
        }

    }

    /**
     * Creates the feature space containing the methods to return the relevant jobs.
     * @param {qm.Base} _base - The QMiner database used to initialize the feature space.
     */
    exports.FeatureSpace = function (_base) {

        var ftrSpace;

        if (_base) {
            ftrSpace = new qm.FeatureSpace(_base, [
                { type: 'multinomial', source: { store: "Jobs", join: "foundConcepts" }, field: "name" }
            ]);
        }

        var recentRecords;       // the recent job postings
        var spConceptMat;        // the concept matrix
        var jobConcepts = [];   // array of job concepts

        /**
         * Returns job concepts.
         * @return {Array.<String>} An array of job concepts.
         */
        this.getJobConcepts = function () {
            return jobConcepts;
        }

        /**
         * Resets the feature space.
         * @param {qm.Base} base - The QMiner database.
         */
        this.reset = function (base) {
            // creates a new instance of feature space, because base might not be allways the same
            // meaning not the same instance (C++ pointers might not point to the same object)
            ftrSpace = new qm.FeatureSpace(base, [
                { type: 'multinomial', source: { store: "Jobs", join: "foundConcepts" }, field: "name" }
            ]);
            // update the feature space with the job posts from the last 14 days
            // and has the wikified concepts stored
            var date = new Date(Date.now());
            recentRecords = base.store("Jobs").allRecords.filter(function (job) {
                return job.date.getTime() > date.getTime() - 14*24*60*60*1000;  // two weeks
            });
            ftrSpace.updateRecords(recentRecords);
            // get the sparse concept matrix
            spConceptMat = ftrSpace.extractSparseMatrix(recentRecords);
            // get the job concepts
            jobConcepts = base.store("Concepts").allRecords.map(function (rec) {
                return rec.name;
            });
        }

        /**
         * Gets the relevant job postings.
         * @param  {qm.Record} record - The dummy record containing the concepts.
         * @return {Array.<Number>} The list of job ids that are relevant.
         */
        this.getRelevantJobs = function (record) {
            var spVec = ftrSpace.extractSparseVector(record);
            var relevantId = [];
            if (spVec.nnz !== 0) {
                // for each job get the number of concepts that are the same with lectureRec
                var occurenceVec = spConceptMat.multiplyT(spVec);
                // get the relevant job and return id
                for (var vecId = 0; vecId < occurenceVec.length; vecId++) {
                    var relevance = occurenceVec.at(vecId);
                    if (relevance !== 0) {
                        var jobPosting = recentRecords[vecId];
                        relevantId.push(jobPosting.$id);
                    }
                }
            }
            return relevantId;
        }

    }

    /**
     * The postings storage class. Stores the postings that were sent through the POST /api/v1/jobs route.
     * @param {string} filepath - The path to the pending json file.
     */
    exports.Postings = function(filepath) {
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
                return "postingsStorage::storePostings: parameter must be an Array of Objects or an Object!";
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

    }

    return exports;
})();
