var format = require('./format');
var responseHandlers = require('../../app/responseHandler');

var middleware = require('./middleware');

var querystring = require('querystring');
var router = require('express').Router();


router.get('/', function (req, res) {
    res.send("Hello");
});

/////////////////////////////
/// Jobs routes

router.get('/jobs', function (req, res) {
    var query = req.query;
    if (Object.keys(query).length !== 0) {
        // query for jobs
        console.log(query);
        var recordSet = database.query(query);
        var response;
        if (recordSet.length !== 0) {
            var data = recordSet.map(function (rec) {
                return format.formatJob(rec, true);
            });

            var included = [];
            data.forEach(function (obj) {
                included = included.concat(middleware.included(obj));
            });

            response = {
                links: {
                    self: "http://localhost:2510/api/v2/jobs?" + querystring.stringify(query)
                },
                data: data,
                included: included
            };


        } else {
            response = {
                links: {
                    self: "http://localhost:2510/api/v2/jobs?" + querystring.stringify(query)
                },
                data: []
            };
        }
        return responseHandlers.successHandler(req, res, response);
    } else {
        return responseHandlers.successHandler(req, res, { errors: ["no query given"] });
    }
});

router.get('/jobs/:id([0-9]+)', middleware.lookup.job, function (req, res) {
    var job = req.job;
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/jobs/" + req.params.id
        },
        data: job,
        included: middleware.included(job)
    };
    return responseHandlers.successJSONHandler(req, res, response);
});

router.get('/jobs/:id([0-9]+)/location', middleware.lookup.job, function (req, res) {
    var job = req.job;
    var location = middleware.lookup.relationship.location(job, true);
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/jobs/" + req.params.id + "/location"
        },
        data: location
    };
    return responseHandlers.successJSONHandler(req, res, response);
});

router.get('/jobs/:id([0-9]+)/country', middleware.lookup.job, function (req, res) {
    var job = req.job;
    var country = middleware.lookup.relationship.country(job, true);
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/jobs/" + req.params.id + "/country"
        },
        data: country
    };
    return responseHandlers.successJSONHandler(req, res, response);
});

router.get('/jobs/:id([0-9]+)/skills', middleware.lookup.job, function (req, res) {
    var job = req.job;
    var skills = middleware.lookup.relationship.skills(job, true);
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/jobs/" + req.params.id + "/skills"
        },
        data: skills
    };
    return responseHandlers.successJSONHandler(req, res, response);
});

router.get('/jobs/:id([0-9]+)/organization', middleware.lookup.job, function (req, res) {
    var job = req.job;
    var organization = middleware.lookup.relationship.organization(job, true);
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/jobs/" + req.params.id + "/organization"
        },
        data: organization
    };
    return responseHandlers.successJSONHandler(req, res, response);
});

/////////////////////////////
/// Locations routes

router.get('/locations', function (req, res) {
    var query = req.query;
    if (Object.keys(query).length !== 0) {
        return responseHandlers.successHandler(req, res, "with query");
    } else {
        return responseHandlers.successHandler(req, res, { errors: ["no query given"] });
    }
});

router.get('/locations/:id([0-9]+)', middleware.lookup.location, function (req, res) {
    var location = req.location;
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/locations/" + req.params.id
        },
        data: location,
        included: middleware.included(location)

    };
    return responseHandlers.successJSONHandler(req, res, response);
});

router.get('/locations/:id([0-9]+)/jobs', middleware.lookup.location, function (req, res) {
    var location = req.location;
    var jobs = middleware.lookup.relationship.jobs(location, true);
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/locations/" + req.params.id + "/jobs"
        },
        data: jobs
    };
    return responseHandlers.successJSONHandler(req, res, response);
});

router.get('/locations/:id([0-9]+)/country', middleware.lookup.location, function (req, res) {
    var location = req.location;
    var country = middleware.lookup.relationship.country(location, true);
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/locations/" + req.params.id + "/country"
        },
        data: country
    };
    return responseHandlers.successJSONHandler(req, res, response);
});

// router.get('/locations/:id([0-9]+)/organizations', middleware.lookup.location, function (req, res) {
//     var location = req.location;
//     var organizations = middleware.lookup.relationship.organizations(location);
//     var response = {
//         links: {
//             self: "http://localhost:2510/api/v2/locations/" + req.params.id + "/organizations"
//         },
//         data: organizations
//     };
//     return responseHandlers.successJSONHandler(req, res, response);
// });

/////////////////////////////
/// Countries routes

router.get('/countries', function (req, res) {
    var query = req.query;
    if (Object.keys(query).length !== 0) {
        return responseHandlers.successHandler(req, res, "with query");
    } else {
        return responseHandlers.successHandler(req, res, { errors: ["no query given"] });
    }
});

router.get('/countries/:id([0-9]+)', middleware.lookup.country, function (req, res) {
    var country = req.country;
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/countries/" + req.params.id
        },
        data: country,
        included: middleware.included(country)

    };
    return responseHandlers.successJSONHandler(req, res, response);
});

router.get('/countries/:id([0-9]+)/jobs', middleware.lookup.country, function (req, res) {
    var country = req.country;
    var jobs = middleware.lookup.relationship.jobs(country, true);
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/countries/" + req.params.id + "/jobs"
        },
        data: jobs
    };
    return responseHandlers.successJSONHandler(req, res, response);
});

router.get('/countries/:id([0-9]+)/locations', middleware.lookup.country, function (req, res) {
    var country = req.country;
    var locations = middleware.lookup.relationship.locations(country, true);
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/countries/" + req.params.id + "/locations"
        },
        data: locations
    };
    return responseHandlers.successJSONHandler(req, res, response);
});

// router.get('/countries/:id([0-9]+)/organizations', middleware.lookup.country, function (req, res) {
//     var country = req.country;
//     var organizations = middleware.lookup.relationship.organizations(country);
//     var response = {
//         links: {
//             self: "http://localhost:2510/api/v2/countries/" + req.params.id + "/organizations"
//         },
//         data: organizations
//     };
//     return responseHandlers.successJSONHandler(req, res, response);
// });

/////////////////////////////
/// Organizations routes

router.get('/organizations', function (req, res) {
    var query = req.query;
    if (Object.keys(query).length !== 0) {
        return responseHandlers.successHandler(req, res, "with query");
    } else {
        return responseHandlers.successHandler(req, res, { errors: ["no query given"] });
    }
});

router.get('/organizations/:id([0-9]+)', middleware.lookup.organization, function (req, res) {
    var organization = req.organization;
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/organizations/" + req.params.id
        },
        data: organization,
        included: middleware.included(organization)

    };
    return responseHandlers.successJSONHandler(req, res, response);
});

router.get('/organizations/:id([0-9]+)/jobs', middleware.lookup.organization, function (req, res) {
        var organization = req.organization;
        var jobs = middleware.lookup.relationship.jobs(organization, true);
        var response = {
            links: {
                self: "http://localhost:2510/api/v2/organizations/" + req.params.id + "/jobs"
            },
            data: jobs
        };
        return responseHandlers.successJSONHandler(req, res, response);
});

// router.get('/organizations/:id([0-9]+)/location', middleware.lookup.organization, function (req, res) {
//     var id = req.params.id;
// });
//
// router.get('/organizations/:id([0-9]+)/country', middleware.lookup.organization, function (req, res) {
//     var organization = req.organization;
//     var country = middleware.lookup.relationship.country(organization);
//     var response = {
//         links: {
//             self: "http://localhost:2510/api/v2/organizations/" + req.params.id + "/country"
//         },
//         data: country
//     };
//     return responseHandlers.successJSONHandler(req, res, response);
// });

/////////////////////////////
/// Skills routes

router.get('/skills', function (req, res) {
    var query = req.query;
    if (Object.keys(query).length !== 0) {
        return responseHandlers.successHandler(req, res, "with query");
    } else {
        return responseHandlers.successHandler(req, res, { errors: ["no query given"] });
    }
});

router.get('/skills/:id([0-9]+)', middleware.lookup.skill, function (req, res) {
    var skill = req.skill;
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/skills/" + req.params.id
        },
        data: skill,
        included: middleware.included(skill)
    };
    return responseHandlers.successJSONHandler(req, res, response);
});

router.get('/skills/:id([0-9]+)/jobs', middleware.lookup.skill, function (req, res) {
    var skill = req.skill;
    var jobs = middleware.lookup.relationship.jobs(skill, true);
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/skills/" + req.params.id + "/jobs"
        },
        data: jobs
    };
    return responseHandlers.successJSONHandler(req, res, response);
});

/////////////////////////////
/// Sectors routes

router.get('/sectors', function (req, res) {
    var query = req.query;
    if (Object.keys(query).length !== 0) {
        return responseHandlers.successHandler(req, res, "with query");
    } else {
        return responseHandlers.successHandler(req, res, { errors: ["no query given"] });
    }
});

router.get('/sectors/:id([0-9]+)', function (req, res) {
    var id = req.params.id;
});



// export the router
module.exports = router;
