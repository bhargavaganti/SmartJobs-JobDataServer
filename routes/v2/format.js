'use strict';

var qm = require('qminer');

var exports = module.exports = {};


/**
 * Formats a single job.
 * @param  {qm.Record} job - The QMiner job instance.
 * @return {Object} The JSON API representation of the job.
 */
exports.formatJob = function (job, relationFlag) {

    var flag = relationFlag ? relationFlag : false;

    // prepare data information
    var jsonapi = {
        id: job.$id,
        type: "job",
        attributes: {
            title: job.title,
            date: job.date,
            description: job.description
        }
    };

    // if we want to have relationships
    if (flag) {
        if (job.inLocation || job.inCountry || job.forOrganization) {
            jsonapi.relationships = { };
        }

        if (job.inLocation) {
            jsonapi.relationships.location = {
                links: {
                    self: "http://localhost:2510/api/v2/jobs/" + job.$id + "/location"
                },
                data: {
                    type: "location",
                    id: job.inLocation.$id
                }
            };
        }

        if (job.inCountry) {
            jsonapi.relationships.country = {
                links: {
                    self: "http://localhost:2510/api/v2/jobs/" + job.$id + "/country"
                },
                data: {
                    type: "country",
                    id: job.inCountry.$id
                }
            };
        }

        if (job.requiredSkills) {
            jsonapi.relationships.skills = {
                links: {
                    self: "http://localhost:2510/api/v2/jobs/" + job.$id + "/skills"
                },
                data: job.requiredSkills.map(function (skill) {
                    return {
                        type: "skill",
                        id: skill.$id
                    };
                })
            };
        }

        if (job.forOrganization) {
            jsonapi.relationships.organization = {
                links: {
                    self:  "http://localhost:2510/api/v2/jobs/" + job.$id + "/organization"
                },
                data: {
                    type: "organization",
                    id: job.forOrganization.$id
                }
            };
        }
    }
    return jsonapi;
}

exports.formatLocation = function (location, relationFlag) {

    var flag = relationFlag ? relationFlag : false;

    var jsonapi = {
        id: location.$id,
        type: "location",
        attributes: {
            name: location.name,
            coord: location.coord
        }
    };

    if (flag) {
        if (location.foundJobs || location.inCountry || location.foundOrganizations) {
            jsonapi.relationships = { };
        }

        if (location.foundJobs) {
            jsonapi.relationships.jobs = {
                links: {
                    self: "http://localhost:2510/api/v2/locations/" + location.$id + "/jobs"
                },
                data: location.foundJobs.map(function (job) {
                    return {
                        type: "job",
                        id: job.$id
                    };
                })
            };
        }

        if (location.inCountry) {
            jsonapi.relationships.country = {
                links: {
                    self: "http://localhost:2510/api/v2/locations/" + location.$id + "/country"
                },
                data: {
                    type: "country",
                    id: location.inCountry.$id
                }
            };
        }

        if (location.foundOrganizations) {
            jsonapi.relationships.organizations = {
                links: {
                    self:  "http://localhost:2510/api/v2/locations/" + location.$id + "/organizations"
                },
                data: {
                    type: "organization",
                    id: location.foundOrganizations.map(function (org) {
                        return {
                            type: "organization",
                            id: org.$id
                        };
                    })
                }
            };
        }
    }

    return jsonapi;
}

exports.formatCountry = function (country, relationFlag) {

    var flag = relationFlag ? relationFlag : false;

    var jsonapi = {
        id: country.$id,
        type: "country",
        attributes: {
            name: country.name,
            coord: country.coord
        }
    };

    if (flag) {
        if (country.foundJobs || country.hasLocations || country.foundOrganizations) {
            jsonapi.relationships = { };
        }

        if (country.foundJobs) {
            jsonapi.relationships.jobs = {
                links: {
                    self: "http://localhost:2510/api/v2/countries/" + country.$id + "/jobs"
                },
                data: country.foundJobs.map(function (job) {
                    return {
                        type: "job",
                        id: job.$id
                    };
                })
            };
        }

        if (country.hasLocations) {
            jsonapi.relationships.locations = {
                links: {
                    self: "http://localhost:2510/api/v2/countries/" + country.$id + "/locations"
                },
                data: country.hasLocations.map(function (loc) {
                    return {
                        type: "location",
                        id: loc.$id
                    }
                })
            };
        }

        if (country.foundOrganizations) {
            jsonapi.relationships.organizations = {
                links: {
                    self:  "http://localhost:2510/api/v2/countries/" + country.$id + "/organizations"
                },
                data: {
                    type: "organization",
                    id: country.foundOrganizations.map(function (org) {
                        return {
                            type: "organization",
                            id: org.$id
                        };
                    })
                }
            };
        }
    }

    return jsonapi;
}

exports.formatSkill = function (skill, relationFlag) {

    var flag = relationFlag ? relationFlag : false;

    var jsonapi = {
        id: skill.$id,
        type: "skill",
        attributes: {
            name: skill.name
        }
    };

    if (flag) {
        if (skill.requiredForJobs) {
            jsonapi.relationships = { };
        }

        if (skill.requiredForJobs) {
            jsonapi.relationships.jobs = {
                links: {
                    links: {
                        self: "http://localhost:2510/api/v2/skills/" + skill.$id + "/jobs"
                    },
                    data: skill.requiredForJobs.map(function (job) {
                        return {
                            type: "job",
                            id: job.$id
                        };
                    })
                }
            };
        }
    }

    return jsonapi;
}

exports.formatOrganization = function (organization, relationFlag) {

    var flag = relationFlag ? relationFlag : false;

    var jsonapi = {
        id: organization.$id,
        type: "organization",
        attributes: {
            title: organization.title,
            abbreviation: organization.abbreviation,
            logoUrl: organization.logoUrl,
            CEO: organization.CEO
        }
    };

    if (flag) {
        if (organization.jobProposals || organization.seatLocation || organization.seatCountry) {
            jsonapi.relationships = { };
        }

        if (organization.jobProposals) {
            jsonapi.relationships.jobs = {
                links: {
                    self: "http://localhost:2510/api/v2/organizations/" + organization.$id + "/jobs"
                },
                data: organization.jobProposals.map(function (job) {
                    return {
                        type: "job",
                        id: job.$id
                    };
                })
            };
        }

        if (organization.seatLocation) {
            jsonapi.relationships.location = {
                links: {
                    self: "http://localhost:2510/api/v2/organizations/" + organization.$id + "/location"
                },
                data: {
                    type: "location",
                    id: organization.seatLocation.$id
                }
            };
        }

        if (organization.seatCountry) {
            jsonapi.relationships.country = {
                links: {
                    self: "http://localhost:2510/api/v2/organizations/" + organization.$id + "/country"
                },
                data: {
                    type: "country",
                    id: organization.seatCountry.$id
                }
            };
        }
    }

    return jsonapi;
}
