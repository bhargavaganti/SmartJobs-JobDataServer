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
        req.job = format.formatJob(job, true);
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
        req.location = format.formatLocation(location, true);
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
        req.country = format.formatCountry(country, true);
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
        req.organization = format.formatOrganization(organization, true);
        next();
    }
};

exports.lookup.skill = function (req, res, next) {
    var skillId = req.params.id;

    // get the organization info
    var skill = database.getRecord("Skills", skillId);
    if (!skill) {
        // if there is no organization with that id
        var error = {
            errors: ["skill id not valid"]
        };
        return responseHandlers.clientErrorHandler(req, res, error);
    } else {
        req.skill = format.formatSkill(skill, true);
        next();
    }
}


///////////////////////////////////////
/// subroutes lookup functions

exports.lookup.relationship.location = function(obj, relationFlag) {
    var flag = relationFlag ? relationFlag : false;

    if (obj.relationships.location) {
        var id = obj.relationships.location.data.id;
        var location = database.getRecord("Locations", id);
        var data = format.formatLocation(location, flag);
        return data;
    }
}

exports.lookup.relationship.locations = function(obj, relationFlag) {
    var flag = relationFlag ? relationFlag : false;

    if (obj.relationships.locations) {
        var ids = obj.relationships.locations.data.map(function (loc) {
            return loc.id;
        });
        var intV = new qm.la.IntVector(ids);
        var locations = database.createNewRecordSet("Locations", intV);
        var data = locations.map(function (loc) {
            return format.formatLocation(loc, flag);
        });
        return data;
    }
}

exports.lookup.relationship.country = function (obj, relationFlag) {
    var flag = relationFlag ? relationFlag : false;

    if (obj.relationships.country) {
        var id = obj.relationships.country.data.id;
        var country = database.getRecord("Countries", id);
        var data = format.formatCountry(country, flag);
        return data;
    }
}

exports.lookup.relationship.organization = function (obj, relationFlag) {
    var flag = relationFlag ? relationFlag : false;

    if(obj.relationships.organization) {
        var id = obj.relationships.organization.data.id;
        var organization = database.getRecord("Organizations", id);
        var data = format.formatOrganization(organization, flag);
        return data;
    }
}

exports.lookup.relationship.organizations = function (obj, relationFlag) {
    var flag = relationFlag ? relationFlag : false;

    if (obj.relationships.organizations) {
        var ids = obj.relationships.organizations.data.map(function (org) {
            return org.id;
        });
        var intV = new qm.la.IntVector(ids);
        var organizations = database.createNewRecordSet("Organizations", intV);
        var data = organizations.map(function (org) {
            return format.formatOrganization(org, flag);
        });
        return data;
    }
}

exports.lookup.relationship.skills = function (obj, relationFlag) {
    var flag = relationFlag ? relationFlag : false;

    if (obj.relationships.skills) {
        var ids = obj.relationships.skills.data.map(function (skill) {
            return skill.id;
        });
        var intV = new qm.la.IntVector(ids);
        var skills = database.createNewRecordSet("Skills", intV);
        var data = skills.map(function (skill) {
            return format.formatSkill(skill, flag);
        });
        return data;
    }
}

exports.lookup.relationship.jobs = function (obj, relationFlag) {
    var flag = relationFlag ? relationFlag : false;

    if (obj.relationships.jobs) {
        var ids = obj.relationships.jobs.data.map(function (job) {
            return job.id;
        });
        var intV = new qm.la.IntVector(ids);
        var jobs = database.createNewRecordSet("Jobs", intV);
        var data = jobs.map(function (job) {
            return format.formatJob(job, flag);
        });
        return data;
    }
}

exports.included = function (obj) {

    var included = [];
    // check all relationships
    if (obj.relationships) {
        if (obj.relationships.location) { included.push(exports.lookup.relationship.location(obj)); }
        if (obj.relationships.country) { included.push(exports.lookup.relationship.country(obj)); }
        if (obj.relationships.organization) { included.push(exports.lookup.relationship.organization(obj)); }

        if (obj.relationships.locations) {
            included = included.concat(exports.lookup.relationship.locations(obj));
        }
        if (obj.relationships.organizations) {
            included = included.concat(exports.lookup.relationship.organizations(obj));
        }
        if (obj.relationships.skills) {
            included = included.concat(exports.lookup.relationship.skills(obj));
        }
        if (obj.relationships.jobs) {
            included = included.concat(exports.lookup.relationship.jobs(obj));
        }
    }
    return included;
}
