var format = require('./format');
var responseHandlers = require('../../app/responseHandler');

var middleware = require('./middleware');

var router = require('express').Router();


router.get('/', function (req, res) {
    res.send("Hello");
});

/////////////////////////////
/// Jobs routes

router.get('/jobs', function (req, res) {
    if (req.query) {
        return responseHandlers.successHandler(req, res, "with query");
    } else {
        return responseHandlers.successHandler(req, res, "no query");
    }
});

router.get('/jobs/:id([0-9]+)', middleware.lookup.job, function (req, res) {
    var job = req.job;
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/jobs/" + req.params.id
        },
        data: job
    };
    return responseHandlers.successJSONHandler(req, res, response);
});

router.get('/jobs/:id([0-9]+)/location', middleware.lookup.job, function (req, res) {
    var job = req.job;
    var location = middleware.lookup.relationship.location(job);
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
    var country = middleware.lookup.relationship.country(job);
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
    var skills = middleware.lookup.relationship.skills(job);
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
    var organization = middleware.lookup.relationship.organization(job);
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
    if (req.query) {
        return responseHandlers.successHandler(req, res, "with query");
    } else {
        return responseHandlers.successHandler(req, res, "no query");
    }
});

router.get('/locations/:id([0-9]+)', middleware.lookup.location, function (req, res) {
    var location = req.location;
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/locations/" + req.params.id
        },
        data: location
    };
    return responseHandlers.successJSONHandler(req, res, response);
});

router.get('/locations/:id([0-9]+)/jobs', middleware.lookup.location, function (req, res) {
    var location = req.location;
    var jobs = middleware.lookup.relationship.jobs(location);
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
    var country = middleware.lookup.relationship.country(location);
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
    if (req.query) {
        return responseHandlers.successHandler(req, res, "with query");
    } else {
        return responseHandlers.successHandler(req, res, "no query");
    }
});

router.get('/countries/:id([0-9]+)', middleware.lookup.country, function (req, res) {
    var country = req.country;
    var response = {
        links: {
            self: "http://localhost:2510/api/v2/countries/" + req.params.id
        },
        data: country
    };
    return responseHandlers.successJSONHandler(req, res, response);
});

router.get('/countries/:id([0-9]+)/jobs', middleware.lookup.country, function (req, res) {
    var country = req.country;
    var jobs = middleware.lookup.relationship.jobs(country);
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
    var locations = middleware.lookup.relationship.locations(country);
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
    if (req.query) {
        return responseHandlers.successHandler(req, res, "with query");
    } else {
        return responseHandlers.successHandler(req, res, "no query");
    }
});

router.get('/organizations/:id([0-9]+)', function (req, res) {
    var id = req.params.id;
});

router.get('/organizations/:id([0-9]+)/jobs', function (req, res) {
    var id = req.params.id;
});

// router.get('/organizations/:id([0-9]+)/location', function (req, res) {
//     var id = req.params.id;
// });
//
// router.get('/organizations/:id([0-9]+)/country', function (req, res) {
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
    if (req.query) {
        return responseHandlers.successHandler(req, res, "with query");
    } else {
        return responseHandlers.successHandler(req, res, "no query");
    }
});

router.get('/skills/:id([0-9]+)', function (req, res) {
    var id = req.params.id;
});

router.get('/skills/:id([0-9]+)/jobs', function (req, res) {
    var id = req.params.id;
});

/////////////////////////////
/// Sectors routes

router.get('/sectors', function (req, res) {

});

router.get('/sectors/:id([0-9]+)', function (req, res) {
    var id = req.params.id;
});



// export the router
module.exports = router;
