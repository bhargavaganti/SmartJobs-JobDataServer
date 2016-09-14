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

    if (records instanceof qm.RecSet) {
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

    if (records instanceof qm.RecSet) {
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

    if (records instanceof qm.RecSet) {
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

    if (records instanceof qm.RecSet) {
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
