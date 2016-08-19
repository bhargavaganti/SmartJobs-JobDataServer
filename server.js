'use strict';

// create a server

var qm = require('qminer');

// import qminer base of job posts
var base = new qm.Base({
    mode: 'open',
    dbPath: './data/db/'
});

/**
 * Queries the database for the content
 * @param {Object} _content - The query content.
 * @property {Array.<String>} _content.skills - Skill names. Using the AND operator.
 * @property {Array.<String>} _content.locations - Location names. Using the OR operator.
 * @property {Array.<String>} _content.countries - Country names. Using the OR operator.
 * @return {module:qm.RecordSet} The queried Job Posts containing the query answer.
 */
function baseQuery(_content) {
    var question = { $join: [] };
    if (_content.skills) {
        var skills = _content.skills;
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
    }
    if (_content.locations) {
        var locationJoin = {
            $name: "foundJobs",
            $query: {
                $from: "Locations",
                name: { $or: _content.locations }
            }
        };
        question.$join.push(locationJoin);
    }
    if (_content.countries) {
        var countryJoin = {
            $name: "foundJobs",
            $query: {
                $from: "Countries",
                name: { $or: _content.countries }
            }
        };
        question.$join.push(countryJoin);
    }
    // query the base
    var answer = base.search(question);
    return answer;
}

// testing query
var query = {
    skills: ["android", "statistics"],
    locations: ["Bath", "Victoria"]
};
var test = baseQuery(query);
console.log("Query length:", test.length);
// close the base
base.close();
