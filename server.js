'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var FileStreamRotator = require('file-stream-rotator');
var morgan = require('morgan');
var winston = require('winston');
var fs = require('fs');
var Client = require('node-rest-client').Client;
var querystring = require('querystring');
var cors = require("cors");

var app = express();
// set static folder
app.set('view engine', 'jade');
app.options("*", cors())
    .use(cors());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true // for parsing application/x-www-form-urlencoded
}));


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
var updateDirectory = path.join(__dirname, 'log', 'records', 'update');
if (!fs.existsSync(updateDirectory)) {
    fs.mkdirSync(updateDirectory);
}
var errorDirectory = path.join(__dirname, 'log', 'records', 'error');
if (!fs.existsSync(errorDirectory)) {
    fs.mkdirSync(errorDirectory);
}
var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.DailyRotateFile)({
            name: 'update-file',
            filename: updateDirectory + '/update.log',
            level: 'info',
            datePattern: '.yyyy-MM-dd',
            prepend: false
        }),
        new(winston.transports.DailyRotateFile)({
            name: 'error-file',
            filename: errorDirectory + '/error.log',
            level: 'error',
            datePattern: '.yyyy-MM-dd',
            prepend: false
        })
    ]
});

// create the pending folder
var pendingDirectory = path.join(__dirname, 'data', 'pending');
var pendingFile = path.join(pendingDirectory, 'pending.json');
if (!fs.existsSync(pendingDirectory)) {
    fs.mkdirSync(pendingDirectory);
}

/////////////////////////////////////////////////
// QMiner functionality

var qm = require('../../qminer');
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

// create feature space
var ftrSpace = new qm.FeatureSpace(base, [
    { type: 'multinomial', source: { store: "JobPostings", join: "wikified" }, field: "name" }
]);
// concept matrix
var recentRecords;
var spConceptMat;
var jobConcepts;
/**
 * Resets the feature space.
 */
function resetFeaturesSpace () {
    // clear the feature space
    ftrSpace.clear();
    // update the feature space with existing job postings
    var allRecords = base.store("JobPostings").allRecords;
    ftrSpace.updateRecords(allRecords);
    var date = new Date(Date.now());
    // get the features of the jobs and lectures
    recentRecords = allRecords.filter(function (job) {
        return job.date.getTime() > date.getTime() - 14*24*60*60*1000;  // one month
    });
    spConceptMat = ftrSpace.extractSparseMatrix(recentRecords);
}


/////////////////////////////////////////////////
// Preparing helper objects and format functions

var storage; // the postings storage
var init; // the initialization data
var format; // format functions
var search; // search function

try {
    storage = require('./app/postingsStorage')(pendingFile);
    init = require('./app/initData')(base);
    format = require('./app/format');
    search = require('./app/search');
    // initial preparation of feature space
    resetFeaturesSpace();
    jobConcepts = init.getConcepts().data.map(function (conc) {
        return conc.name;
    });
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
    // get the query
    var query = req.query;
    if (Object.keys(query).length === 0 && query instanceof Object) {
        res.status(400).send({
            error: "Empty Query Sent"
        });
    } else {
        try {
            var answer;
            if (query.id) {
                // use the query id to get the records
                var ids = query.id.split(",").map(function (num) { return parseInt(num); });
                var intV = new qm.la.IntVector(ids);
                answer = base.store("JobPostings").newRecordSet(intV);
            } else {
                // use the query to search for jobs
                answer = search.baseQuery(query, base);
            }
            // check if answer is a RecordSet
            if (answer instanceof qm.RecSet) {
                var jobs = formatStyle(answer);
                res.status(200).send(jobs);
            } else {
                // invalid query info
                res.status(400).send({
                    error: answer
                });
            }
        } catch (err) {
            logger.error("Unsuccessful query", {
                err_message: err.message,
                data: query
            });
            res.status(500).send({
                error: "Error on Server Side..."
            });
        }
    }
}

/**
 * Queries, formats and sends the data back to the client.
 * @param  {express.request}  req - The request.
 * @param  {express.response} res - The response.
 * @param  {function} formatStyle - The format function to format the output data.
 */
function formatRequestWiki(req, res, formatStyle) {
    // get the query
    var query = req.query;
    console.log(query);
    if (Object.keys(query).length === 0 && query instanceof Object) {
        res.status(400).send({
            error: "Empty Query Sent"
        });
    } else {
        try {
            // get the recordset
            var answer = search.wikiQuery(query, base);
			if ((answer instanceof Array) || (answer instanceof qm.RecSet)) {
        		var jobs = formatStyle(answer);
        		console.log("results size:" + answer.length);
             	res.status(200).send(jobs);
        	} else {
                // invalid query info
                res.status(400).send({
                    error: answer
                });
	        }
        } catch (err) {
            logger.error("Unsuccessful query", {
                err_message: err.message,
                data: query
            });
            res.status(500).send({
                error: "Error on Server Side..."
            });
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
            res.status(200).send(job);
        } else {
            res.status(400).send({
                error: "No Job with sprecified ID found: " + id,
            });
        }
    } catch (err) {
        logger.error("Unsuccessful format", {
            err_message: err.message,
            data: id
        });
        res.status(500).send({
            error: "Error on the Server Side..."
        });
    }
}

/////////////////////////////////////////////////
// Wikifier functions
var wiki = require('./app/wiki');

// /////////////////////////////////////////////////
// Routers

// Main page
app.get('/api/v1/', function(req, res) {
    // gets the API basic documentation
    res.status(200).sendFile('data/info/mainV1.txt', {
        root: __dirname
    });
});

// closes and restarts the base (it stores the data)
// TODO: set the restart route (maybe rename it)
app.get('/api/v1/database_update', function(req, res) {
    try {
        console.time("Update");

        ///////////////////////////////
        // updates the database
        var postings = storage.getPostings();
        // open the base for record update
        base.close();
        base = new qm.Base({
            mode: 'open',
            dbPath: './data/db/'
        });
        // update the database
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
        base.close();
        base = new qm.Base({
            mode: 'openReadOnly',
            dbPath: './data/db/'
        });
        // update the feature space
        resetFeaturesSpace();
        jobConcepts = init.getConcepts().data.map(function (conc) {
            return conc.name;
        });

        // clear the storage
        storage.clear();

        ///////////////////////////////
        // updates init data
        init.update(base, true);

        console.timeEnd("Update");

        logger.info("Database updated");
        res.status(200).send({
            message: "Successful update"
        });
    } catch (err) {
        logger.error("Unsucessful Database update", {
            err_message: err.message
        });
        res.status(500).send({
            message: "Unsuccessful update"
        });
    }
});

app.route('/api/v1/jobs')
    // gets all the info of the queried jobs
    .get(function(req, res) {
        formatRequestSeveral(req, res, format.toAllInfoFormat);
    })
    // saves the posted postings
    .post(function(req, res) {
        var postings = req.body;
        try {
            // stores the postings and saves them locally
            storage.storePostings(postings);
            logger.info("Postings successfully stored", {
                postings: postings
            });
            res.status(200).send({
                message: "Successful post!"
            });
        } catch (err) {
            logger.error("Unsuccessful post", {
                err_message: err.message,
                data: postings
            });
            res.status(500).send({
                error: "Error on Server Side..."
            });
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
//For VideoLectures
// wikifies text
app.get('/api/v1/concepts', function(req, res) {
    wiki.wikifyText(req, res);
});

// gets jobs based on concepts
app.get('/api/v1/concepts/wiki', function(req, res) {
    formatRequestWiki(req, res, format.toWikiFormat);
});

// suggests jobs based on text
app.get('/api/v1/concepts/wikijobs', function(req, res) {
    wiki.suggestJobs(req, res, format.toWikiFormat, base);
});

// suggest jobs based on text using concepts
app.get('/api/v1/concepts/text_job_similarity', function(req, res) {
    try {
        // wikify text
    	var endpoint = "http://wikifier.org/annotate-article";
    	var datas = {
			'text': req.query.text,
			'lang': req.query.lang,
			'out': 'extendedJson',
			'jsonForEval': 'true',
            userKey: 'usppmjvabjnzltltvihvylppekbiuf'
		};
    	endpoint += '?' + querystring.stringify(datas);
    	var client = new Client();
    	client.get(endpoint, function (data, response) {
    		var annots = data.annotations;
            // create a "fake" record containing the wikified concepts
            var record = { wikified: [] };
            for (var annN = 0; annN < data.annotations.length; annN++) {
                var concept = data.annotations[annN].title;
                if (jobConcepts.indexOf(concept) > -1) {
                    record.wikified.push({ $name: concept });
                }
            }
            if (record.wikified.length === 0) {
                // there are no existing wikified concepts so there
                // are no existing jobs that are similar by concept
                res.status(200).send({
                    count: 0,
                    data: []
                });
            } else {
                // the wikified concepts exist so there is at
                // least one job that is similar by concept
                var lectureRec = base.store("JobPostings").newRecord(record);
                var spVec = ftrSpace.extractSparseVector(lectureRec);
                // for each job get the number of concepts that are the same with lectureRec
                var occurenceVec = spConceptMat.multiplyT(spVec);
                if (spVec.nnz !== 0) {
                    occurenceVec = occurenceVec.multiply(1/spVec.nnz);
                }
                // get the relevant job and return id, weight and concepts
                var relevantJobs = [];
                for (var vecIdx = 0; vecIdx < occurenceVec.length; vecIdx++) {
                    var relevance = occurenceVec.at(vecIdx);
                    if (relevance !== 0) {
                        var jobPosting = recentRecords[vecIdx];
                        relevantJobs.push({
                            id: jobPosting.$id,
                            weight: relevance
                            // concepts: jobPosting.wikified.map(function (con) {
                            //     return con.name;
                            // })
                        });
                    }
                }
        	    res.status(200).send({
                    count: relevantJobs.length,
                    data: relevantJobs
                });
            }
    	});
	} catch (err) {
	 logger.error("Unsuccessful format", {
            err_message: err.message
        });
        res.status(500).send({
            error: "Error on the Server Side..."
        });
	}
});

// render html for videolectures
var htmlRender = require('./app/htmlTemplate');


app.route('/api/v1/render_jobs')
    .get(function (req, res) {
        var html = htmlRender({
            categories:  [{ url: "nekaj", count: 100, name: "This" }, { url: "nekaj", count: 100, name: "This" }, { url: "nekaj", count: 100, name: "This" }],
            job_concepts: { url: "other", count: 100 }
        });
        res.send(html);
    })
    .post(function (req, res) {
        try {
            var body = req.body;
            console.log(body);
            var options = {
                categories: format.toSkillHtmlString(body.categories, init.getSkills().data)
            };
            // wikify text
        	var endpoint = "http://wikifier.org/annotate-article";
        	var datas = {
    			'text': req.query.text,
    			'lang': req.query.lang,
    			'out': 'extendedJson',
    			'jsonForEval': 'true',
                userKey: 'usppmjvabjnzltltvihvylppekbiuf'
    		};
        	endpoint += '?' + querystring.stringify(datas);
        	var client = new Client();
        	client.get(endpoint, function (data, response) {
        		var annots = data.annotations;
                // create a "fake" record containing the wikified concepts
                var record = { wikified: [] };
                for (var annN = 0; annN < data.annotations.length; annN++) {
                    var concept = data.annotations[annN].title;
                    if (jobConcepts.indexOf(concept) > -1) {
                        record.wikified.push({ $name: concept });
                    }
                }
                var html;
                if (record.wikified.length === 0) {
                    // there are no existing wikified concepts so there
                    // are no existing jobs that are similar by concept
                    html = htmlRender(options);
                    res.status(200).send(html);
                } else {
                    // the wikified concepts exist so there is at
                    // least one job that is similar by concept
                    var lectureRec = base.store("JobPostings").newRecord(record);
                    var spVec = ftrSpace.extractSparseVector(lectureRec);
                    // for each job get the number of concepts that are the same with lectureRec
                    var occurenceVec = spConceptMat.multiplyT(spVec);
                    // get the relevant job and return id
                    var relevantId = [];
                    for (var vecIdx = 0; vecIdx < occurenceVec.length; vecIdx++) {
                        var relevance = occurenceVec.at(vecIdx);
                        if (relevance !== 0) {
                            var jobPosting = recentRecords[vecIdx];
                            relevantId.push(jobPosting.$id);
                        }
                    }
                    options.job_concepts = format.toConceptHtmlString(relevantId);
                    html = htmlRender(options);
                    res.status(200).send(html);
                }
        	});
    	} catch (err) {
    	 logger.error("Unsuccessful format", {
                err_message: err.message
            });
            res.status(500).send({
                error: "Error on the Server Side..."
            });
    	}



    });

// suggest jobs based on text using concepts
app.post('/api/v1/concepts/text_job_similarity', function(req, res) {
    try {
        // wikify text
    	var endpoint = "http://wikifier.org/annotate-article";
    	var datas = {
			'text': req.query.text,
			'lang': req.query.lang,
			'out': 'extendedJson',
			'jsonForEval': 'true',
            userKey: 'usppmjvabjnzltltvihvylppekbiuf'
		};
    	endpoint += '?' + querystring.stringify(datas);
    	var client = new Client();
    	client.get(endpoint, function (data, response) {
    		var annots = data.annotations;
            // create a "fake" record containing the wikified concepts
            var record = { wikified: [] };
            for (var annN = 0; annN < data.annotations.length; annN++) {
                var concept = data.annotations[annN].title;
                if (jobConcepts.indexOf(concept) > -1) {
                    record.wikified.push({ $name: concept });
                }
            }
            if (record.wikified.length === 0) {
                // there are no existing wikified concepts so there
                // are no existing jobs that are similar by concept
                res.status(200).send({
                    count: 0,
                    data: []
                });
            } else {
                // the wikified concepts exist so there is at
                // least one job that is similar by concept
                var lectureRec = base.store("JobPostings").newRecord(record);
                var spVec = ftrSpace.extractSparseVector(lectureRec);
                // for each job get the number of concepts that are the same with lectureRec
                var occurenceVec = spConceptMat.multiplyT(spVec);
                if (spVec.nnz !== 0) {
                    occurenceVec = occurenceVec.multiply(1/spVec.nnz);
                }
                // get the relevant job and return id, weight and concepts
                var relevantJobs = [];
                for (var vecIdx = 0; vecIdx < occurenceVec.length; vecIdx++) {
                    var relevance = occurenceVec.at(vecIdx);
                    if (relevance !== 0) {
                        var jobPosting = recentRecords[vecIdx];
                        relevantJobs.push({
                            id: jobPosting.$id,
                            weight: relevance
                            // concepts: jobPosting.wikified.map(function (con) {
                            //     return con.name;
                            // })
                        });
                    }
                }
        	    res.status(200).send({
                    count: relevantJobs.length,
                    data: relevantJobs
                });
            }
    	});
	} catch (err) {
	 logger.error("Unsuccessful format", {
            err_message: err.message
        });
        res.status(500).send({
            error: "Error on the Server Side..."
        });
	}
});


/////////////////////////////////////////////////
// Lists of all skills, locations,
// countries and timeSeries

app.get('/api/v1/stats/count', function(req, res) {
    var initVal = init.getCount();
    res.status(200).send(initVal);
});

app.get('/api/v1/stats/lists', function(req, res) {
    var initVal = {
        skills: init.getSkills(),
        locations: init.getLocations(),
        countries: init.getCountries(),
        timeSeries: init.getTimeSeries()
    };
    res.status(200).send(initVal);
});

app.get('/api/v1/stats/lists/skills', function(req, res) {
    res.status(200).send(init.getSkills());
});


app.get('/api/v1/stats/lists/:length', function(req, res) {
    var length = req.params.length;
    var initVal = {
        skills: init.getSkills(length),
        locations: init.getLocations(length),
        countries: init.getCountries(length),
        timeSeries: init.getTimeSeries(length, 10)
    };
    res.status(200).send(initVal);
});


/////////////////////////////////////////////////
// Run the server

var PORT = 2510;
app.listen(PORT, function() {
    console.log("JobAnalytics data server listening on port:", PORT);
});
