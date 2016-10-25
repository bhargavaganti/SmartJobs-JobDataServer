var path = require('path');
var qm = require('qminer');

var Client = require('node-rest-client').Client;
var querystring = require('querystring');

var format = require('./format');

var responseHandlers = require('../../app/responseHandler');
var initData = require('./initDataStorage')(database.getBase());

// route container
var router = require('express').Router();


/**
 * Queries, formats and sends the data back to the client.
 * @param  {express.request}  req - The request.
 * @param  {express.response} res - The response.
 * @param  {function} formatStyle - The format function to format the output data.
 */
function formatRequestSeveral(req, res, formatStyle) {
    console.time("Response time");
    /**
     * Prepares the object for the key usage.
     * @param  {Array.<String> | String} obj - The query array or string.
     * @return {String} The string used for the key.
     */
    function prepareKey(obj) {
        if (obj instanceof Array) {
            obj.sort(function (a, b) {
                return a < b ? 1 : a > b ? -1 : 0;
            });
            return obj.join(",");
        } else if (typeof obj === "string") {
            return obj;
        } else {
            throw "Invalid object type " + (typeof obj);
        }
    };

    // get the query
    var query = req.query;
    if (Object.keys(query).length === 0 && query instanceof Object) {
        return responseHandlers.clientErrorHandler(req, res, "Empty Query Sent");
    } else {
        try {
            var answer, key;
            if (query.id) {
                key = query.id;
                cache.hasKey(key, function (flag) {
                    if (flag) {
                        // get the key values and return the postings
                        cache.getKeyObject(key, function (object) {
                            // use the query id to get the records
                            var jobs = JSON.parse(object.jobs);
                            return responseHandlers.successHandler(req, res, jobs);
                        })
                    } else {
                        // TODO: figure what to do in that sitution
                        // Notify the user that he needs to go to videolectures again and click on the link
                        // return the default values
                    }
                })
            } else {
                // preparing the key for caching
                var keys = [];
                if (query.skills) {
                    keys.push(prepareKey(query.skills));
                }
                if (query.locations) {
                    keys.push(prepareKey(query.locations));
                }
                if (query.countries) {
                    keys.push(prepareKey(query.countries));
                }
                key = req.path + keys.join("-");
                // check if the key exists in the cache
                cache.hasKey(key, function (flag) {
                    if (flag) {
                        // get the query ids from the cache
                        cache.getKeyValue(key, function (reply) {
                            var jobs = JSON.parse(reply);
                            // get the jobs from the cache and send them
                            console.log("Cached");
                            console.timeEnd("Response time");

                            return responseHandlers.successHandler(req, res, jobs);
                        });
                    } else {
                        // use the query to search for jobs
                        answer = database.query(query);
                        // return the propper response
                        if (answer instanceof qm.RecSet) {
                            // format the jobs
                            var jobs = formatStyle(answer);
                            // store the jobs in the cache
                            var jobPostings = JSON.stringify(jobs);
                            cache.setKeyValue(key, jobPostings);

                            console.log("Not cached");
                            console.timeEnd("Response time");

                            return responseHandlers.successHandler(req, res, jobs);
                        } else {
                            return responseHandlers.clientErrorHandler(req, res, answer);
                        }
                    }
                });
            }
        } catch (err) {
            return responseHandlers.serverErrorHandler(req, res, "Error on Server Side. Query Broke.");
        }
    }
}


/**
 * Returns the data of the record in the formats and sends the data back to the client.
 * @param  {express.request}  req - The request.
 * @param  {express.response} res - The response.
 * @param  {function} formatStyle - The format function to format the output data.
 */
function formatRequestSingle(req, res, formatStyle) {
    var id = req.params.id;
    try {
        var record = database.getRecord(id);
        if (record instanceof Object /* qm.Record */ ) {
            var job = formatStyle(record);
            return responseHandlers.successHandler(req, res, job);
        } else {
            return responseHandlers.clientErrorHandler(req, res, "No Job with sprecified ID found: " + id);
        }
    } catch (err) {
        return responseHandlers.serverErrorHandler(req, res, "Error on Server Side. Query Broke.");
    }
}

///////////////////////////////////////////////////
// Documentation Router

// Main page
router.get('/v1', function(req, res) {
    // gets the API basic documentation
    return res.status(200).sendFile(path.resolve(__dirname, 'info/mainV1.txt'));
});

// Database update (must have for init update)
router.get('/database', function (req, res, next) {
    initData.update(database.getBase(), true);
    next();
})

/////////////////////////////////////////////////
// Initial data and Statistics Router

router.get('/v1/stats/count', function(req, res) {
    var initVal = initData.getCount();
    return responseHandlers.successHandler(req, res, initVal);
});

router.get('/v1/stats/lists', function(req, res) {
    var initVal = {
        skills:     initData.getSkills(),
        locations:  initData.getLocations(),
        countries:  initData.getCountries(),
        timeSeries: initData.getTimeSeries()
    };
    return responseHandlers.successHandler(req, res, initVal);
});

router.get('/v1/stats/lists/skills', function(req, res) {
    return responseHandlers.successHandler(req, res, initData.getSkills());
});

router.get('/v1/stats/lists/:length', function(req, res) {
    var length = req.params.length;
    var initVal = {
        skills:     initData.getSkills(length),
        locations:  initData.getLocations(length),
        countries:  initData.getCountries(length),
        timeSeries: initData.getTimeSeries(length, 10)
    };
    return responseHandlers.successHandler(req, res, initVal);
});

/////////////////////////////////////////////////
// Database Update Router

router.route('/v1/jobs')
    // gets all the info of the queried jobs
    .get(function(req, res) {
        try {
            formatRequestSeveral(req, res, format.toAllInfoFormat);
        } catch (err) {
            return responseHandlers.serverErrorHandler(req, res, "Error on Server Side. Unsucessful Update.");
        }
    })
    // saves the posted postings
    .post(function(req, res) {
        var postings = req.body;
        try {
            // stores the postings and saves them locally
            storage.storePostings(postings);
            logger.info("Postings successfully stored", { postings: postings });
            return responseHandlers.successHandler(req, res, "Successful post!");
        } catch (err) {
            logger.error("Unsuccessful post", {
                message: err.message,
                data: postings
            });
            return responseHandlers.serverErrorHandler(req, res, "Error on Server Side. Unsuccessful Post.");
        }
    });

// gets the location info of the queried jobs
router.get('/v1/jobs/locations', function(req, res) {
    formatRequestSeveral(req, res, format.toLocationFormat);
});

// gets the skills info of the queried jobs
router.get('/v1/jobs/skills', function(req, res) {
    formatRequestSeveral(req, res, format.toSkillFormat);
});

// gets the skills and location info of the queried jobs
router.get('/v1/jobs/locations_and_skills', function(req, res) {
    formatRequestSeveral(req, res, format.toLocationAndSkillFormat);
});

/////////////////////////////////////////////////
// ID Record Routers

// gets all info of the ID job
router.get('/v1/jobs/:id', function(req, res) {
    formatRequestSingle(req, res, format.toAllInfoFormat);
});

// gets the location info of the ID job
router.get('/v1/jobs/:id/locations', function(req, res) {
    formatRequestSingle(req, res, format.toLocationFormat);
});

// gets the skills info of the ID job
router.get('/v1/jobs/:id/skills', function(req, res) {
    formatRequestSingle(req, res, format.toSkillFormat);
});

// gets the skills and location info of the ID job
router.get('/v1/jobs/:id/locations_and_skills', function(req, res) {
    formatRequestSingle(req, res, format.toLocationAndSkillFormat);
});


/////////////////////////////////////////////////
// Wikification and VideoLectures

// render html for videolectures
var htmlRender = require('./htmlTemplate');
router.route('/v1/render_jobs')
    .post(function (req, res) {
        try {
            var body = req.body;
            var key = body.lecture_id + "-" + body.video_id;
            cache.hasKey(key, function (flag) {
                if (flag) {
                    // if the key exists return the content html to the client
                    cache.getKeyObject(key, function (content) {
                        return responseHandlers.successHandler(req, res, content.html);
                    });
                } else {
                    // the key value is not stored in the cache
                    var options = {
                        categories: format.toSkillHtmlObjects(body.categories, initData.getSkills().data)
                    };
                    // wikification options
                	var endpoint = "http://wikifier.org/annotate-article";
                	var datas = {
            			'text': body.title + " " + body.text,
            			'lang': body.lang,
            			'out': 'extendedJson',
            			'jsonForEval': 'true',
                        userKey: 'usppmjvabjnzltltvihvylppekbiuf'
            		};
                	endpoint += '?' + querystring.stringify(datas);
                	var client = new Client();
                    // wikify the content
                	client.get(endpoint, function (data, response) {
                		var annots = data.annotations, html;
                        if (!annots) {
                            // wikifier isn't working, render the html
                            // containing only the categories info
                            html = htmlRender(options);
                            cache.setKeyObject(key, {
                                html: html,
                            });
                            logger.info("Successful html Render", html);
                            return responseHandlers.successHandler(req, res, html);
                        }
                        // create a "fake" record containing the wikified concepts
                        var record = { wikified: [] };
                        for (var annN = 0; annN < annots.length; annN++) {
                            var concept = annots[annN].title;
                            if (featureSpace.getJobConcepts().indexOf(concept) > -1) {
                                record.wikified.push({ $name: concept });
                            }
                        }
                        if (record.wikified.length === 0) {
                            // there are no existing wikified concepts so there
                            // are no existing jobs that are similar by concept
                            html = htmlRender(options);
                            cache.setKeyObject(key, {
                                html: html,
                            });
                            logger.info("Successful html Render", html);
                            return responseHandlers.successHandler(req, res, html);
                        } else {
                            // the wikified concepts exist so there is at
                            // least one job that is similar by concept
                            var lectureRec = database.createNewRecord(record);
                            var relevantId = featureSpace.getRelevantJobs(lectureRec);
                            if (relevantId.length !== 0) {
                                options.job_concepts = format.toConceptHtmlObject(key, relevantId.length);
                                // get the formated job postings
                                var intV = new qm.la.IntVector(relevantId);
                                var answer = database.createNewRecordSet(intV);
                                var jobPostings = format.toAllInfoFormat(answer);
                                // render and cache the result
                                html = htmlRender(options);
                                cache.setKeyObject(key, {
                                    html: html,
                                    jobs: JSON.stringify(jobPostings)
                                });
                            } else {
                                html = htmlRender(options);
                                cache.setKeyObject(key, {
                                    html: html
                                });
                            }
                            logger.info("Successful html Render", html);
                            return responseHandlers.successHandler(req, res, html);
                        }
                	});
                }
            })
    	} catch (err) {
            logger.error("Unsuccessful Wikification", {
                message: err.message,
                data: postings
            });
            return responseHandlers.serverErrorHandler(req, res, "Error on Server Side. Unsuccessful Format.");
    	}
    });

module.exports = router;
