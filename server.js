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
    extended: true          // for parsing application/x-www-form-urlencoded
}));

app.disable('x-powered-by');

// setup logger
var accessDirectory = path.join(__dirname, 'log', 'access');
if(!fs.existsSync(accessDirectory)) {
    fs.mkdirSync(accessDirectory);
}
var accessLogStream = FileStreamRotator.getStream({
    date_format: 'YYYY-MM-DD',
    filename: path.join(accessDirectory, 'access-%DATE%.log'),
    frequency: 'daily',
    verbose: false
});
app.use(morgan('short', { stream: accessLogStream }));

// file rotation for winston
winston.transports.DailyRotateFile = require('winston-daily-rotate-file');

// setup info streams
var updateDirectory = path.join(__dirname, 'log', 'records', 'update');
if(!fs.existsSync(updateDirectory)) {
    fs.mkdirSync(updateDirectory);
}
var errorDirectory = path.join(__dirname, 'log', 'records', 'error');
if(!fs.existsSync(errorDirectory)) {
    fs.mkdirSync(errorDirectory);
}
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.DailyRotateFile)({
            name: 'update-file',
            filename: updateDirectory + '/update.log',
            level: 'info',
            datePattern: '.yyyy-MM-dd',
            prepend: false
        }),
        new (winston.transports.DailyRotateFile)({
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
if(!fs.existsSync(pendingDirectory)) {
    fs.mkdirSync(pendingDirectory);
}

// delete the pending file
function deletePendingFile() {
    fs.stat(pendingDirectory + '/pending.txt', function (err, stat) {
        if (err === null) {
            fs.unlink(pendingDirectory + '/pending.txt', function (err) {
                if (err) console.log(err);
            });
        }
    });
}

/////////////////////////////////////////////////
// QMiner functionality

var qm = require('qminer');
// database containing all job posts
var base = new qm.Base({
    mode: 'open',
    dbPath: './data/db/'
});

// on CTRL+C
process.on('SIGINT', function() {
    base.close();
    process.exit();
});

/////////////////////////////////////////////////
// Server routing and methods

try {
    var initData = require('./app/initData');
    var baseHelper = require('./app/baseHelper');
    var format = require('./app/format');
    var search = require('./app/search');

    // prepate initial data for full base
    var init = initData(base);
} catch(err) {
    console.log(err);
}

app.get('/api/v1/', function(req, res) {
    // gets the API basic documentation
    res.status(200).sendFile('data/info/mainV1.txt', {
        root: __dirname
    });
});

/**
 * Queries, formats and sends the data back to the client.
 * @param  {express.request}  req - The request.
 * @param  {express.response} res - The response.
 * @param  {function} formatStyle - The format function to format the output data.
 */
function formatRequest(req, res, formatStyle) {
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
            logger.error("Unsuccessful query", { err_message: err.message, data: query });
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
function formatSingleJob(req, res, formatStyle) {
    var id = req.params.id;
    try {
        var record = base.store("JobPostings")[id];
        if (record instanceof Object /* qm.Record */) {
            var job = formatStyle(record);
            res.status(200).send(job);
        } else {
            res.status(400).send({
                error: "No Job with sprecified ID found: " + id,
            });
        }
    } catch (err) {
        logger.error("Unsuccessful format", { err_message: err.message, data: id });
        res.status(500).send({
            error: "Error on the Server Side..."
        });
    }

}

///////////////////////////////////////////////////////////////////
// All Records Routers

// closes and restarts the base (it stores the data)
app.get('/api/v1/restart', function (req, res) {
    // close the base (stores the records)
    base.close();
    // reopen the base
    base = new qm.Base({
        mode: 'open',
        dbPath: './data/db/'
    });
    res.status(200).end();
});

// gets and posts the jobs postingss
app.route('/api/v1/jobs')
    // gets all the info of the queried jobs
    .get(function(req, res) {
        formatRequest(req, res, format.toAllInfoFormat);
    })
    // updates the database
    .post(function(req, res) {
        var records = req.body;
        try {
            baseHelper.updateBase(base, records, false);
            logger.info("Database successfully updated", { records: records });
            // TODO: create static files of the databases
            res.status(200).send({ message: "Database updated!" });
        } catch (err) {
            logger.error("Unsuccessful database update", { err_message: err.message, data: records });
            res.status(500).send({
                error: "Error on Server Side..."
            });
        }
    });

// gets the location info of the queried jobs
app.get('/api/v1/jobs/locations', function (req, res) {
    formatRequest(req, res, format.toLocationFormat);
});

// gets the skills info of the queried jobs
app.get('/api/v1/jobs/skills', function (req, res) {
    formatRequest(req, res, format.toSkillFormat);
});

// gets the skills and location info of the queried jobs
app.get('/api/v1/jobs/locations_and_skills', function (req, res) {
    formatRequest(req, res, format.toLocationAndSkillFormat);
});

///////////////////////////////////////////////////////////////////
// ID Record Routers

// gets all info of the ID job
app.get('/api/v1/jobs/:id', function(req, res) {
    formatSingleJob(req, res, format.toAllInfoFormat);
});

// gets the location info of the ID job
app.get('/api/v1/jobs/:id/locations', function (req, res) {
    formatSingleJob(req, res, format.toLocationFormat);
});

// gets the skills info of the ID job
app.get('/api/v1/jobs/:id/skills', function (req, res) {
    formatSingleJob(req, res, format.toSkillFormat);
});

// gets the skills and location info of the ID job
app.get('/api/v1/jobs/:id/locations_and_skills', function (req, res) {
    formatSingleJob(req, res, format.toLocationAndSkillFormat);
});

///////////////////////////////////////////////////////////////////
// Lists of all skills, locations, countries and timeSeries

app.get('/api/v1/stats/update', function (req, res) {
    // update initialized data
    init.update(base, true);
    logger.info("Initialization data updated");
    deletePendingFile();
    res.status(200).end();
});

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


///////////////////////////////////////////////////////////////////
// Run the server

var PORT = process.env.npm_package_config_port;
app.listen(PORT, function() {
    console.log("JobAnalytics data server listening on port:", PORT);
});
