'use strict';

var qm = require('qminer');

var exports = module.exports = {};


/**
 * Formats a single job.
 * @param  {qm.Record} job - The QMiner job instance.
 * @return {Object} The JSON API representation of the job.
 */
exports.formatJob = function (job) {
    var jsonapi = {
        id: job.$id,
        type: "job",
        attributes: {
            title: job.title,
            date: job.date,
            description: job.description
        },
        relationships: {
            location: {
                links: {
                    self: "http://localhost:2510/api/v2/jobs/" + job.$id + "/location"
                },
                data: {
                    type: "location",
                    id: job.inLocation.$id
                }
            },
            country: {
                links: {
                    self: "http://localhost:2510/api/v2/jobs/" + job.$id + "/country"
                },
                data: {
                    type: "country",
                    id: job.inCountry.$id
                }
            },
            skills: {
                links: {
                    self: "http://localhost:2510/api/v2/jobs/" + job.$id + "/skills"
                },
                data: job.requiredSkills.map(function (skill) {
                    return {
                        type: "skill",
                        id: skill.$id
                    };
                })
            },
            organization: {
                links: {
                    self:  "http://localhost:2510/api/v2/jobs/" + job.$id + "/organization"
                },
                data: {
                    type: "organization",
                    id: job.forOrganization.$id
                }
            }
        }
    };

    return jsonapi;
}

exports.formatLocation = function (location) {
    var jsonapi = {
        id: location.$id,
        type: "location",
        attributes: {
            name: location.name,
            coord: location.coord
        },
        relationships: {
            jobs: {
                links: {
                    self: "http://localhost:2510/api/v2/locations/" + location.$id + "/jobs"
                },
                data: location.foundJobs.map(function (job) {
                    return {
                        type: "job",
                        id: job.$id
                    };
                })
            },
            country: {
                links: {
                    self: "http://localhost:2510/api/v2/locations/" + location.$id + "/country"
                },
                data: {
                    type: "country",
                    id: location.inCountry.$id
                }
            },
            // organizations: {
            //     links: {
            //         self:  "http://localhost:2510/api/v2/jobs/" + location.$id + "/organizations"
            //     },
            //     data: {
            //         type: "organization",
            //         id: location.foundOrganizations.map(function (org) {
            //             return {
            //                 type: "organization",
            //                 id: org.$id
            //             };
            //         })
            //     }
            // }
        }
    };

    return jsonapi;
}

exports.formatCountry = function (country) {
    var jsonapi = {
        id: country.$id,
        type: "country",
        attributes: {
            name: country.name,
            coord: country.coord
        },
        relationships: {
            jobs: {
                links: {
                    self: "http://localhost:2510/api/v2/countries/" + country.$id + "/jobs"
                },
                data: country.foundJobs.map(function (job) {
                    return {
                        type: "job",
                        id: job.$id
                    };
                })
            },
            locations: {
                links: {
                    self: "http://localhost:2510/api/v2/countries/" + country.$id + "/locations"
                },
                data: country.hasLocations.map(function (location) {
                    return {
                        type: "location",
                        id: location.$id
                    }
                })
            },
            // organizations: {
            //     links: {
            //         self:  "http://localhost:2510/api/v2/countries/" + country.$id + "/organizations"
            //     },
            //     data: {
            //         type: "organization",
            //         id: country.foundOrganizations.map(function (org) {
            //             return {
            //                 type: "organization",
            //                 id: org.$id
            //             };
            //         })
            //     }
            // }
        }
    };

    return jsonapi;
}

exports.formatSkill = function (skill) {
    var jsonapi = {
        id: skill.$id,
        type: "skill",
        attributes: {
            name: skill.name
        },
        relationships: {
            jobs: {
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
        }
    };
    return jsonapi;
}

exports.formatOrganization = function (organization) {
    var jsonapi = {
        id: organization.$id,
        type: "organization",
        attributes: {
            title: organization.title,
            abbreviation: organization.abbreviation,
            logoUrl: organization.logoUrl,
            CEO: organization.CEO
        },
        relationships: {
            jobs: {
                links: {
                    self: "http://localhost:2510/api/v2/organizations/" + organization.$id + "/jobs"
                },
                data: organization.jobProposals.map(function (job) {
                    return {
                        type: "job",
                        id: job.$id
                    };
                })
            }
            // location: {
            //     links: {
            //         self: "http://localhost:2510/api/v2/organizations/" + organization.$id + "/location"
            //     },
            //     data: {
            //         type: "location",
            //         id: organization.seatLocation.$id
            //     }
            // },
            // country: {
            //     links: {
            //         self: "http://localhost:2510/api/v2/organizations/" + organization.$id + "/country"
            //     },
            //     data: {
            //         type: "country",
            //         id: organization.seatCountry.$id
            //     }
            // }
        }
    };

    return jsonapi;
}
