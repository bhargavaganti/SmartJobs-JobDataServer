'use strict';

var exports = module.exports = {};

/**
 * Queries the database for the content
 * @param {Object} _content - The query content.
 * @property {Array.<String>} _content.skills - Skill names. Using the AND operator.
 * @property {Array.<String>} _content.locations - Location names. Using the OR operator.
 * @property {Array.<String>} _content.countries - Country names. Using the OR operator.
 * @param {module:qm.Base} base - The base from which to search.
 * @return {module:qm.RecordSet} The queried Job Posts containing the query answer.
 */
exports.baseQuery = function (_content, base) {
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
};
