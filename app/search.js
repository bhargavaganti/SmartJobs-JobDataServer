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

/**
 * Queries the database for the content
 * @param {Object} _content - The query content.
 * @property {Array.<String>} _content.wiki - wiki concept names
 * @param {module:qm.Base} base - The base from which to search.
 * @return {module:qm.RecordSet} The queried Job Posts containing the query answer or Array of Job Posts
 */
exports.wikiQuery = function (_content, base) {
    var answer = [];
	var answers = {};
	var answersdata = {};

    var question;
    var ask;
    if (_content.wiki) {
        var wiki = _content.wiki;
        if (wiki instanceof Array) {
            // if there is an array of wikis
            for (var wikiN = 0; wikiN < wiki.length; wikiN++) {
                var wikiJoin = {
                    $name: "foundForJobs",
                    $query: {
                        $from: "Concepts",
                        name: wiki[wikiN]
                    }
                };
                question = {};
                question.$join = [];
                question.$join.push(wikiJoin);
	            // query the base
			    ask = base.search(question);
				//create hashtable
				for (var wikiK = 0; wikiK < ask.length; wikiK++) {
	            	var wikiConcept = ask[wikiK];
	    			if (answers.hasOwnProperty(wikiConcept.$id)) {
	    				answers[wikiConcept.$id] = answers[wikiConcept.$id] + 1;
	    			} else {
	    				answers[wikiConcept.$id] = 1;
	    				answersdata[wikiConcept.$id] = wikiConcept;
	    			}
            	} //end ask length
			} //end for wiki length

			//sort hashtable
	        var wks = [];
			for (var k in answers) {
		        if (answers.hasOwnProperty(k)) {
		    	    wks.push([k, answers[k]]);
                }
		    }
			wks.sort(function(a, b) {
                return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0;
            });

	        // add to answer
	        for (var wksort = 0; wksort < wks.length; wksort++) {
        		var job_id_and_concpets = wks[wksort];
        		var job_id = job_id_and_concpets[0];
        		var job_data = answersdata[job_id];

        		answer.push(job_data);
        	}
        } else if (typeof wiki === "string") {
            // if there is only one wiki (string)
            var wik = {
                $name: "foundForJobs",
                $query: {
                    $from: "Concepts",
                    name: wiki
                }
            };
            question = {};
                question.$join = [];
                question.$join.push(wik);
            // query the base
			ask = base.search(question);
		    answer = ask;
        } else {
            return "Invalid Wiki Type " + (typeof wiki);
        }
    }
    return answer;
};
