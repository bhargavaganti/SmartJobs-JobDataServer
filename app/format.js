'use strict';

var qm = require('qminer');

// functions for formating the data
var exports = module.exports = {};

/////////////////////////////
// Main Format function

/**
 * Returns an array of formated records.
 * @param  {qm.Record | qm.RecordSet}   records - The record(s).
 * @param  {Function} callback - Format function.
 * @return {Object | Array.<Object>} The formated records.
 */
function format(records, callback) {
    if (records.length || records instanceof qm.RecSet) {
        var jobs = records.map(function (job) {
            return callback(job);
        });
        // remove null occurrences
        jobs = jobs.filter(function (rec) { return rec !== null && rec !== undefined; });
        // add info to object
        var data = {
            count: jobs.length,
            data:  jobs
        };
        return data;
    // TODO: replace the condition when possible
    } else if (typeof records === "object" /*instanceof qm.Record*/) {
        return callback(records);
    } else {
        throw "format: records is not a Record or RecordSet!";
    }
}

/////////////////////////////
// Format Functions

/**
 * Changes the record to all info format.
 * @param  {qm.Record} record - The job record.
 * @return {Object} Javascript object containing all of the job info.
 */
function allInfoFormat(record) {
    var skills = record.requiredSkills,
           loc = record.inLocation,
       country = record.inCountry;
    if (!loc.coord || loc.name === 'Northern Europe') {
        return;
    }
    // format title (remove strong tags)
    var title = record.title.replace(/<\/?strong>/g, '');
    title = title.replace(/&lt;\/?strong&gt;/g, '');

    return {
        id:  record.$id,
        timestamp: Date.parse(record.date),
        date: record.dateFullStr,
        title: title,
        organization: record.organization,
        description: record.description,
        location_coord: loc.coord,
        location_city: loc.name,
        location_country: country.name,
        skillset: skills.map(function (skill) { return skill.name; })
    };
}

/**
 * Changes the record to location info format.
 * @param  {qm.Record} record - The job record.
 * @return {Object} Javascript object containing location of the job info.
 */
function locationFormat(record) {
    var skills = record.requiredSkills;
    var loc = record.inLocation;
    var country = record.inCountry;
    // TODO: do something with the jobs with invalid coordinates
    if (!loc.coord || loc.name === 'Northern Europe') {
        return;
    }
    return {
        id:  record.$id,
        location_coord: loc.coord,
        location_city: loc.name,
        location_country: country.name
    };
}

/**
 * Changes the record to skill info format.
 * @param  {qm.Record} record - The job record.
 * @return {Object} Javascript object containing skill of the job info.
 */
function skillFormat (record) {
    var skills = record.requiredSkills;
    return {
        id:  record.$id,
        skillset: skills.map(function (skill) { return skill.name; })
    };
}

/**
 * Changes the record to location and skill info format.
 * @param  {qm.Record} record - The job record.
 * @return {Object} Javascript object containing location and skill of the job info.
 */
function locationAndSkillFormat(record) {
    var skills = record.requiredSkills;
    var loc = record.inLocation;
    var country = record.inCountry;
    // TODO: do something with the jobs with invalid coordinates
    if (!loc.coord || loc.name === 'Northern Europe') {
        return;
    }
    return {
        id:  record.$id,
        timestamp: Date.parse(record.date),
        location_coord: loc.coord,
        location_city: loc.name,
        location_country: country.name,
        skillset: skills.map(function (skill) { return skill.name; })
    };
}

/////////////////////////////
// Special Formats

/**
 * Converts the record(s) to an array containg all of the data
 * of the records.
 * @param  {module:qm.Record | module:qm.RecordSet} records - The record(s).
 * @return {Array.<Object>} The converted object array.
 */
exports.toAllInfoFormat = function (records) {
    return format(records, allInfoFormat);
};

/**
 * Converts the record set to an array containing the timestamp, locations and skills
 * of the records.
 * @param  {module:qm.Record | module:qm.RecordSet} records - The record(s).
 * @return {Array.<Object>} The converted object array.
 */
exports.toLocationFormat = function (records) {
    return format(records, locationFormat);
};

/**
 * Converts the record set to an array containing the id, skills
 * of the records.
 * @param  {module:qm.Records | module:qm.RecordSet} records - The record(s).
 * @return {Array.<Object>} The converted object array.
 */
exports.toSkillFormat = function (records) {
    return format(records, skillFormat);
};

/**
 * Converts the record set to an array containing the timestamp, locations and skills
 * of the records.
 * @param  {module:qm.Record | module:qm.RecordSet} records - The record(s).
 * @return {Array.<Object>} The converted object array.
 */
exports.toLocationAndSkillFormat = function (records) {
    return format(records, locationAndSkillFormat);
};

/////////////////////////////
// Other format functions

/**
 * Returns the string containing the the category/skill name and its job count.
 * @param {string} str - String of VL categories.
 * @param {Array.<Object>} skillArray - Array of skill name and count.
 * @return {string} Html string containing the links and category count.
 */
exports.toSkillHtmlObjects = function (str, skillArray) {
    /**
     * Gets the index of the object in the array for
     * the object with property 'property' and value 'val'.
     * @param  {Array.<Object>} _array - The Object array.
     * @param  {Object} val            - Searched value.
     * @param  {String} property       - The property of the objects.
     * @return {Number} The index of of the found object in the array.
     */
    function arrayObjectIndexOf(_array, val, property) {
        for (var idx = 0; idx < _array.length; idx++) {
            if (_array[idx][property] === val) {
                return idx;
            }
        }
        return -1;
    }

    // function body
    var lectureCategories = [];
    var categ = str.split(/[\n>]+/g);
    categ.forEach(function (category) {
        if (lectureCategories.indexOf(category) === -1) {
            lectureCategories.push(category);
        }
    });
    var content = [];
    for (var i = 0; i < lectureCategories.length; i++) {
        var category = lectureCategories[i].toLowerCase().replace(/[ ]+/g, "-");
        var idx = arrayObjectIndexOf(skillArray, category, "name");
        if (idx > -1) {
            var obj = {
                url: "http://localhost:2409/jobseekers?q=" + skillArray[idx].name,
                count: skillArray[idx].value,
                name: lectureCategories[i]
            };
            content.push(obj);
        }
    }
    return content;
};

/**
 * Returns an object containing the relevant jobs for lecture info.
 * @param  {String} cacheId   - The cache id where the info is stored.
 * @param  {Number} numOfJobs - Number of jobs.
 * @return {Object} The object used for html format.
 */
exports.toConceptHtmlObject = function (cacheId, numOfJobs) {
    var obj = null;
    if (numOfJobs > 0) {
        obj = {
            url: "http://localhost:2409/jobseekers?id=" + cacheId,
            count: numOfJobs
        };
    }
    return obj;
};
