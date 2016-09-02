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
    if (records instanceof qm.RecSet) {
        var jobArray = records.map(function (job) {
            var skills = job.requiredSkills;
            var loc = job.inLocation;
            var country = job.inCountry;
            // TODO: do something with the jobs with invalid coordinates
            if (!loc.coord || loc.name === 'Northern Europe') {
                return;
            }
            var title = job.title.replace(/<\/?strong>/g, '');
            title = title.replace(/&lt;\/?strong&gt;/g, '');

            return {
                id:  job.$id,
                timestamp: Date.parse(job.date),
                date: job.dateFullStr,
                title: title,
                organization: job.organization,
                description: job.description,
                location_coord: loc.coord,
                location_city: loc.name,
                location_country: country.name,
                skillset: skills.map(function (skill) { return skill.name; })
            };
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
        var skills = records.requiredSkills;
        var loc = records.inLocation;
        var country = records.inCountry;
        // TODO: do something with the jobs with invalid coordinates
        if (!loc.coord || loc.name === 'Northern Europe') {
            return;
        }
        return {
            id:  records.$id,
            timestamp: Date.parse(records.date),
            date: records.dateFullStr,
            title: records.title,
            organization: records.organization,
            description: records.description,
            location_coord: loc.coord,
            location_city: loc.name,
            location_country: country.name,
            skillset: skills.map(function (skill) { return skill.name; })
        };
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
    if (records instanceof qm.RecSet) {
        var jobArray = records.map(function (job) {
            var skills = job.requiredSkills;
            var loc = job.inLocation;
            var country = job.inCountry;
            // TODO: do something with the jobs with invalid coordinates
            if (!loc.coord || loc.name === 'Northern Europe') {
                return;
            }
            return {
                id:  job.$id,
                location_coord: loc.coord,
                location_city: loc.name,
                location_country: country.name
            };
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
        var skills = records.requiredSkills;
        var loc = records.inLocation;
        var country = records.inCountry;
        // TODO: do something with the jobs with invalid coordinates
        if (!loc.coord || loc.name === 'Northern Europe') {
            return;
        }
        return {
            id:  records.$id,
            location_coord: loc.coord,
            location_city: loc.name,
            location_country: country.name
        };
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
    if (records instanceof qm.RecSet) {
        var jobArray = records.map(function (job) {
            var skills = job.requiredSkills;
            return {
                id:  job.$id,
                skillset: skills.map(function (skill) { return skill.name; })
            };
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
        var skills = records.requiredSkills;
        return {
            id:  records.$id,
            skillset: skills.map(function (skill) { return skill.name; })
        };
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
    if (records instanceof qm.RecSet) {
        var jobArray = records.map(function (job) {
            var skills = job.requiredSkills;
            var loc = job.inLocation;
            var country = job.inCountry;
            // TODO: do something with the jobs with invalid coordinates
            if (!loc.coord || loc.name === 'Northern Europe') {
                return;
            }
            return {
                id:  job.$id,
                timestamp: Date.parse(job.date),
                location_coord: loc.coord,
                location_city: loc.name,
                location_country: country.name,
                skillset: skills.map(function (skill) { return skill.name; })
            };
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
        var skills = records.requiredSkills;
        var loc = records.inLocation;
        var country = records.inCountry;
        // TODO: do something with the jobs with invalid coordinates
        if (!loc.coord || loc.name === 'Northern Europe') {
            return;
        }
        return {
            id:  records.$id,
            timestamp: Date.parse(records.date),
            location_coord: loc.coord,
            location_city: loc.name,
            location_country: country.name,
            skillset: skills.map(function (skill) { return skill.name; })
        };
    } else {
        throw "format.toLocationAndSkillsFormat: records is not a Record or RecordSet!";
    }
};
