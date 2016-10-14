'use strict';

var express = require('express');
var cors = require("cors");
var bodyParser = require('body-parser');
var path = require('path');
var FileStreamRotator = require('file-stream-rotator');
var morgan = require('morgan');
var winston = require('winston');
var fs = require('fs');
var Client = require('node-rest-client').Client;
var querystring = require('querystring');

var app = express();
// set static folder
app.options("*", cors())
    .use(cors())
    .use(express.static(__dirname + '/public'))
    .use(bodyParser.json({limit: '50mb'}))
    .use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.disable('x-powered-by');


/////////////////////////////////////////////////
// Logger and file system init

// setup logger
var accessDirectory = path.join(__dirname, 'log', 'access');
if (!fs.existsSync(accessDirectory)) {
    fs.mkdirSync(accessDirectory);
}
var accessLogStream = FileStreamRotator.getStream({
    date_format: 'YYYY-MM-DD',
    filename: path.join(accessDirectory, 'access-%DATE%.log'),
    frequency: 'daily',
    verbose: false
});

app.use(morgan('short', {
    stream: accessLogStream
}));

// file rotation for winston
winston.transports.DailyRotateFile = require('winston-daily-rotate-file');
// setup info streams
var requestDirectory = path.join(__dirname, 'log', 'request');
if (!fs.existsSync(requestDirectory)) {
    fs.mkdirSync(requestDirectory);
}

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.DailyRotateFile)({
            name: 'request-file',
            filename: requestDirectory + '/request.log',
            level: 'info',
            datePattern: '.yyyy-MM-dd',
            prepend: false
        })
    ]
});

// saves the request information in the logger
app.use(function (req, res, next) {
    var info = {
        hostname: req.hostname,
        originalUrl: req.originalUrl,
        ip: req.ip,
        url: req.baseUrl,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
    };
    logger.info("Request info", info);
    next();
})

// TODO: do we need the pending file??
// create the pending folder
var pendingDirectory = path.join(__dirname, 'data', 'pending');
var pendingFile = path.join(pendingDirectory, 'pending.json');
if (!fs.existsSync(pendingDirectory)) {
    fs.mkdirSync(pendingDirectory);
}

/////////////////////////////////////////////////
// QMiner Database and Feature Space

var qm = require('qminer');
// database containing all job posts
var base = new qm.Base({
    mode: 'openReadOnly',
    dbPath: './data/db/'
});

// on CTRL+C
process.on('SIGINT', function() {
    base.close();
    process.exit();
});
// prepare feature space
var featureSpace = require('./app/featureSpace')();

/////////////////////////////////////////////////
// Preparing helper objects and format functions

var responseHandlers = require('./app/responseHandler');
var cache = require('./app/cache')();

var storage; // the postings storage
var init; // the initialization data
var format; // format functions
var search; // search function

try {
    storage = require('./app/postingsStorage')(pendingFile);
    init   = require('./app/initDataStorage')(base);
    format = require('./app/format');
    search = require('./app/search');

    // initial preparation of feature space
    featureSpace.reset(base);
} catch (err) {
    console.log(err);
}

/**
 * Queries, formats and sends the data back to the client.
 * @param  {express.request}  req - The request.
 * @param  {express.response} res - The response.
 * @param  {function} formatStyle - The format function to format the output data.
 */
function formatRequestSeveral(req, res, formatStyle) {
    console.time("Response time");
    console.log(req.path);
    /**
     * Prepares the object for the key usage.
     * @param  {Array.<String> | String} obj - The query array or string.
     * @return {String} The string used for the key.
     */
    function prepareKey(obj) {
        if (obj instanceof Array) {
            obj.sort(function (a, b) {
                if (a < b) {
                    return 1;
                } else if (a > b) {
                    return -1;
                } else {
                    return 0;
                }
            })
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
                        answer = search.baseQuery(query, base);
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
        var record = base.store("JobPostings")[id];
        if (record instanceof Object /* qm.Record */ ) {
            var job = formatStyle(record);
            return responseHandlers.successHandler(req, res, jobs);
        } else {
            return responseHandlers.clientErrorHandler(req, res, "No Job with sprecified ID found: " + id);
        }
    } catch (err) {
        return responseHandlers.serverErrorHandler(req, res, "Error on Server Side. Query Broke.");
    }
}

// /////////////////////////////////////////////////
// Documentation Router

// Main page
app.get('/api/v1/', function(req, res) {
    // gets the API basic documentation
    return res.status(200).sendFile('data/info/mainV1.txt', {
        root: __dirname
    });
});

/////////////////////////////////////////////////
// Initial data and Statistics Router

app.get('/api/v1/stats/count', function(req, res) {
    var initVal = init.getCount();
    return responseHandlers.successHandler(req, res, initVal);
});

app.get('/api/v1/stats/lists', function(req, res) {
    var initVal = {
        skills:     init.getSkills(),
        locations:  init.getLocations(),
        countries:  init.getCountries(),
        timeSeries: init.getTimeSeries()
    };
    return responseHandlers.successHandler(req, res, initVal);
});

app.get('/api/v1/stats/lists/skills', function(req, res) {
    return responseHandlers.successHandler(req, res, init.getSkills());
});

app.get('/api/v1/stats/lists/:length', function(req, res) {
    var length = req.params.length;
    var initVal = {
        skills:     init.getSkills(length),
        locations:  init.getLocations(length),
        countries:  init.getCountries(length),
        timeSeries: init.getTimeSeries(length, 10)
    };
    return responseHandlers.successHandler(req, res, initVal);
});

/////////////////////////////////////////////////
// Database Update Router

// closes and restarts the base (it stores the data)
app.get('/api/v1/database_update', function(req, res) {
    try {
        // check if there are any new postings
        var postings = storage.getPostings();
        // TODO: uncomment before deployment
        // if (postings.length === 0) {
        //     return responseHandlers.successHandler(req, res, "No postings available for update");
        // }
        ///////////////////////////////
        // Update the database

        // open the database in write mode
        base.close(); base = new qm.Base({
            mode: 'open',
            dbPath: './data/db/'
        });
        // update the database with postings
        if (postings instanceof Array) {
            for (var RecN = 0; RecN < postings.length; RecN++) {
                var record = postings[RecN];
                base.store("JobPostings").push(record);
            }
        } else if (postings instanceof Object) {
            base.store("JobPostings").push(postings);
        } else {
            throw "Records must be an Array of Object or an Object!";
        }
        // open database in read only mode
        base.close(); base = new qm.Base({
            mode: 'openReadOnly',
            dbPath: './data/db/'
        });
        // clear the storage
        storage.clear();
        // Resets cache
        cache.deleteAll();

        ///////////////////////////////
        // Reseting helper functions
        init.update(base, true);
        featureSpace.reset(base);

        logger.info("Database updated");
        return responseHandlers.successHandler(req, res, "Successful Update");
    } catch (err) {
        logger.info("Unsucessful Database update", {
            err_message: err.message
        });
        return responseHandlers.serverErrorHandler(req, res, "Error on Server Side. Unsucessful Update.");
    }
});

app.route('/api/v1/jobs')
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
app.get('/api/v1/jobs/locations', function(req, res) {
    formatRequestSeveral(req, res, format.toLocationFormat);
});

// gets the skills info of the queried jobs
app.get('/api/v1/jobs/skills', function(req, res) {
    formatRequestSeveral(req, res, format.toSkillFormat);
});

// gets the skills and location info of the queried jobs
app.get('/api/v1/jobs/locations_and_skills', function(req, res) {
    formatRequestSeveral(req, res, format.toLocationAndSkillFormat);
});

/////////////////////////////////////////////////
// ID Record Routers

// gets all info of the ID job
app.get('/api/v1/jobs/:id', function(req, res) {
    formatRequestSingle(req, res, format.toAllInfoFormat);
});

// gets the location info of the ID job
app.get('/api/v1/jobs/:id/locations', function(req, res) {
    formatRequestSingle(req, res, format.toLocationFormat);
});

// gets the skills info of the ID job
app.get('/api/v1/jobs/:id/skills', function(req, res) {
    formatRequestSingle(req, res, format.toSkillFormat);
});

// gets the skills and location info of the ID job
app.get('/api/v1/jobs/:id/locations_and_skills', function(req, res) {
    formatRequestSingle(req, res, format.toLocationAndSkillFormat);
});


/////////////////////////////////////////////////
// Wikification and VideoLectures

// render html for videolectures
var htmlRender = require('./app/htmlTemplate');
app.route('/api/v1/render_jobs')
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
                        categories: format.toSkillHtmlObjects(body.categories, init.getSkills().data)
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
                            cache.setKeyValue(key, {
                                html: html,
                            });
                            logger.info("Successful html Render", html);
                            return responseHandlers.successHandler(req, res, html);
                        }
                        // create a "fake" record containing the wikified concepts
                        var record = { wikified: [] };
                        for (var annN = 0; annN < annots.length; annN++) {
                            var concept = annots[annN].title;
                            if (featureSpace.jobConcepts.indexOf(concept) > -1) {
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
                            var lectureRec = base.store("JobPostings").newRecord(record);
                            var relevantId = featureSpace.getRelevantJobs(lectureRec);
                            options.job_concepts = format.toConceptHtmlObject(key, relevantId.length);
                            // get the formated job postings
                            var intV = new qm.la.IntVector(relevantId);
                            var answer = base.store("JobPostings").newRecordSet(intV);
                            var jobPostings = format.toAllInfoFormat(answer);
                            // render and cache the result
                            html = htmlRender(options);
                            cache.setKeyObject(key, {
                                html: html,
                                jobs: JSON.stringify(jobPostings)
                            });
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

/////////////////////////////////////////////////
// Run the server

var PORT = 2510;
app.listen(PORT, function() {
    console.log("JobAnalytics data server listening on port:", PORT);
});
