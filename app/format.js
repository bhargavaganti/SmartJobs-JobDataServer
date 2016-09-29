'use strict';

var qm = require('qminer');

// functions for formating the data
var exports = module.exports = {};

// EU Country names
exports.EUCountries = ['Andorra', 'Austria', 'Belgium', 'Bulgaria', 'Cyprus', 'Czech Republic', 'Switzerland',
    'Denmark', 'Germany', 'Spain', 'Estonia', 'Finland', 'France', 'United Kingdom', 'Greece', 'Hungary',
    'Croatia', 'Ireland', 'Italy', 'Lithuania', 'Luxembourg', 'Latvia', 'Malta', 'Netherlands', 'Poland',
    'Portugal', 'Romania', 'San Marino', 'Ukraine', 'Slovakia', 'Slovenia', 'Czechia'];


/**
 * Converts the record(s) to an array containg all of the data
 * of the records.
 * @param  {module:qm.Record | module:qm.RecordSet} records - The record(s).
 * @return {Array.<Object>} The converted object array.
 */
exports.toAllInfoFormat = function (records) {

    // changes the record to all info format
    function allInfoFormat(record) {
        var skills = record.requiredSkills;
        var loc = record.inLocation;
        var country = record.inCountry;
        // TODO: do something with the jobs with invalid coordinates
        if (!loc.coord || loc.name === 'Northern Europe') {
            return;
        }
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
    if (records.length || records instanceof qm.RecSet) {
        var jobArray = records.map(function (job) {
            return allInfoFormat(job);
        });
        // remove null occurrences
        jobArray = jobArray.filter(function (rec) { return rec !== null && rec !== undefined; });
        // add info to object
        //
        var data = {
            count: jobArray.length,
            data: jobArray
        };
        return data;
        // TODO: replace the condition when possible
    } else if (typeof records === "object" /*instanceof qm.Record*/) {
        return allInfoFormat(records);
    } else {
        throw "format.toAllInfoFormat: records is not a Record or RecordSet!";
    }
};

/**
 * Converts the record set to an array containing the timestamp, locations and skills
 * of the records.
 * @param  {module:qm.Record | module:qm.RecordSet} records - The record(s).
 * @return {Array.<Object>} The converted object array.
 */
exports.toLocationFormat = function (records) {

    // changes the record to location format
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

    if (records.length || records instanceof qm.RecSet) {
        var jobArray = records.map(function (job) {
            return locationFormat(job);
        });
        // remove null occurrences
        jobArray = jobArray.filter(function (rec) { return rec !== null && rec !== undefined; });
        // add info to object
        var data = {
            count: jobArray.length,
            data: jobArray
        };
        return data;
        // TODO: replace the condition when possible
    } else if (typeof records === "object" /*instanceof qm.Record*/) {
        return locationFormat(records);
    } else {
        throw "format.toLocationAndSkillsFormat: records is not a Record or RecordSet!";
    }
};

/**
 * Converts the record set to an array containing the id, skills
 * of the records.
 * @param  {module:qm.Records | module:qm.RecordSet} records - The record(s).
 * @return {Array.<Object>} The converted object array.
 */
exports.toSkillFormat = function (records) {

    // changes the record to skill format
    function skillFormat (record) {
        var skills = record.requiredSkills;
        return {
            id:  record.$id,
            skillset: skills.map(function (skill) { return skill.name; })
        };
    }

    if (records.length || records instanceof qm.RecSet) {
        var jobArray = records.map(function (job) {
            return skillFormat(job);
        });
        // remove null occurrences
        jobArray = jobArray.filter(function (rec) { return rec !== null && rec !== undefined; });
        // add info to object
        var data = {
            count: jobArray.length,
            data: jobArray
        };
        return data;
        // TODO: replace the condition when possible
    } else if (typeof records === "object" /*instanceof qm.Record*/) {
        return skillFormat(records);
    } else {
        throw "format.toSkillsFormat: records is not a Record or RecordSet!";
    }
};

/**
 * Converts the record set to an array containing the timestamp, locations and skills
 * of the records.
 * @param  {module:qm.Record | module:qm.RecordSet} records - The record(s).
 * @return {Array.<Object>} The converted object array.
 */
exports.toLocationAndSkillFormat = function (records) {

    // changes the record to location and skill format
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

    if (records.length || records instanceof qm.RecSet) {
        var jobArray = records.map(function (job) {
            return locationAndSkillFormat(job);
        });
        // remove null occurrences
        jobArray = jobArray.filter(function (rec) { return rec !== null && rec !== undefined; });
        // add info to object
        var data = {
            count: jobArray.length,
            data: jobArray
        };
        return data;
        // TODO: replace the condition when possible
    } else if (typeof records === "object" /*instanceof qm.Record*/) {
        return locationAndSkillFormat(records);
    } else {
        throw "format.toLocationAndSkillsFormat: records is not a Record or RecordSet!";
    }
};

/**
 * Converts the record set to an array containing the timestamp, wikified concepts
 * of the records.
 * @param  {module:qm.Record | module:qm.RecordSet} records - The record(s).
 * @return {Array.<Object>} The converted object array.
 */
exports.toWikiFormat = function (records) {
    // changes the record to wiki format
    function wikiFormat(record) {
        var wiki = record.wikified;
        var title = record.title.replace(/<\/?strong>/g, '');
        title = title.replace(/&lt;\/?strong&gt;/g, '');
        return {
            id:  record.$id,
            timestamp: Date.parse(record.date),
            title: title,
            description: record.description,
            wikiset: wiki.map(function (wki) { return wki.name; })
        };
    }
    var jobArray;
    var data;
    if (records.length || records instanceof qm.RecSet) {
        jobArray = records.map(function (job) {
            return wikiFormat(job);
        });

        // remove null occurrences
        jobArray = jobArray.filter(function (rec) {
            return rec !== null && rec !== undefined;
        });
        // add info to object
        data = {
            count: jobArray.length,
            data: jobArray
        };
        return data;
    } else {
        jobArray = [];
    	var sendLimit = 1000;

	    if (records.length < sendLimit) {
    		sendLimit = records.length;
        }
	    for (var j = 0; j < sendLimit; j++) {
    		var job = wikiFormat(records[j]);
    		jobArray.push(job);
    	}

    	// remove null occurrences
        jobArray = jobArray.filter(function (rec) {
            return rec !== null && rec !== undefined;
        });
        // add info to object
        data = {
            count: records.length,
	        data: jobArray
        };
        return data;
    }
};

/**
 * Returns the string containing the the category/skill name and its job count.
 * @param {string} str - String of VL categories.
 * @param {Array.<Object>} skillArray - Array of skill name and count.
 * @return {string} Html string containing the links and category count.
 */
exports.toSkillHtmlString = function (str, skillArray) {
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
            var text = "<a href='http://jobs.videolectures.net/jobseekers?q=" + skillArray[idx].name + "'>" +
                        skillArray[idx].value + "</a>" + " jobs found in " + lectureCategories[i];
            content.push(text);
        }
    }
    return content.join(", ");
};

exports.toConceptHtmlString = function (idArray) {
    var text = "<a href='http://jobs.videolectures.net/jobseekers?id=" + idArray.join(",") + "'>" +
                idArray.length + " jobs related to the lecture";
};
