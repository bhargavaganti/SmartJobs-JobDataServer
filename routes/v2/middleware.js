var responseHandlers = require('../../app/responseHandler');
var format = require('./format');
var qm = require('qminer');

var exports = module.exports = {};

///////////////////////////////////////
/// main lookup functions

exports.lookup = {
    relationship: {}
};

exports.lookup.job = function (req, res, next) {
    var jobId = req.params.id;

    // get the job info
    var job = database.getRecord("Jobs", jobId);
    if (!job) {
        // if there is no job with that id
        var error = {
            errors: ["job id not valid"]
        };
        return responseHandlers.clientErrorHandler(req, res, error);
    } else {
        req.job = format.formatJob(job);
        next();
    }
};

exports.lookup.location = function (req, res, next) {
    var locationId = req.params.id;

    // get the location info
    var location = database.getRecord("Locations", locationId);
    if (!location) {
        // if there is no job with that id
        var error = {
            errors: ["location id not valid"]
        };
        return responseHandlers.clientErrorHandler(req, res, error);
    } else {
        req.location = format.formatLocation(location);
        next();
    }
};

exports.lookup.country = function (req, res, next) {
    var countryId = req.params.id;

    // get the country info
    var country = database.getRecord("Countries", countryId);
    if (!country) {
        // if there is no countries with that id
        var error = {
            errors: ["country id not valid"]
        };
        return responseHandlers.clientErrorHandler(req, res, error);
    } else {
        req.country = format.formatCountry(country);
        next();
    }
};

exports.lookup.organization = function (req, res, next) {
    var orgId = req.params.id;

    // get the organization info
    var organization = database.getRecord("Organizations", orgId);
    if (!organization) {
        // if there is no organization with that id
        var error = {
            errors: ["organization id not valid"]
        };
        return responseHandlers.clientErrorHandler(req, res, error);
    } else {
        req.organization = format.formatOrganization(organization);
        next();
    }
};


///////////////////////////////////////
/// subroutes lookup functions

exports.lookup.relationship.location = function(obj) {
    var id = obj.relationships.location.data.id;
    var location = database.getRecord("Locations", id);
    var data = format.formatLocation(location);
    return data;
}

exports.lookup.relationship.locations = function(obj) {
    var ids = obj.relationships.locations.data.map(function (loc) {
        return loc.id;
    });
    var intV = new qm.la.IntVector(ids);
    var locations = database.createNewRecordSet("Locations", intV);
    var data = locations.map(function (loc) {
        return format.formatLocation(loc);
    });
    return data;
}

exports.lookup.relationship.country = function (obj) {
    var id = obj.relationships.country.data.id;
    var country = database.getRecord("Countries", id);
    var data = format.formatCountry(country);
    return data;
}

exports.lookup.relationship.organization = function (obj) {
    var id = obj.relationships.organization.data.id;
    var organization = database.getRecord("Organizations", id);
    var data = format.formatOrganization(organization);
    return data;
}

exports.lookup.relationship.organizations = function (obj) {
    var ids = obj.relationships.organization.data.map(function (org) {
        return org.id;
    });
    var intV = new qm.la.IntVector(ids);
    var organizations = database.createNewRecordSet("Organizations", intV);
    var data = organizations.map(function (org) {
        return format.formatOrganization(org);
    });
    return data;
}

exports.lookup.relationship.skills = function (obj) {
    var ids = obj.relationships.skills.data.map(function (skill) {
        return skill.id;
    });
    var intV = new qm.la.IntVector(ids);
    var skills = database.createNewRecordSet("Skills", intV);
    var data = skills.map(function (skill) {
        return format.formatSkill(skill);
    });
    return data;
}

exports.lookup.relationship.jobs = function (obj) {
    var ids = obj.relationships.jobs.data.map(function (job) {
        return job.id;
    });
    var intV = new qm.la.IntVector(ids);
    var jobs = database.createNewRecordSet("Jobs", intV);
    var data = jobs.map(function (job) {
        return format.formatJob(job);
    });
    return data;
}
