'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var FileStreamRotator = require('file-stream-rotator');
var morgan = require('morgan');
var winston = require('winston');
var fs = require('fs');

var app = express();
// set static folder
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
            // get the recordset
            var answer = search.baseQuery(query, base);
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
        // clear the storage
        storage.clear().save(storage.getPendingPath());

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
            storage.storePostings(postings).save(pendingFile);
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
