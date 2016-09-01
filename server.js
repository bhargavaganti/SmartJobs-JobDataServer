'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var FileStreamRotator = require('file-stream-rotator');
var morgan = require('morgan');
var fs = require('fs');


var app = express();
// set static folder
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true          // for parsing application/x-www-form-urlencoded
}));

// setup logger
var logDirectory = path.join(__dirname, 'log');
if(!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}
var accessLogStream = FileStreamRotator.getStream({
    date_format: 'YYYY-MM-DD',
    filename: path.join(logDirectory, 'access-%DATE%.log'),
    frequency: 'daily',
    verbose: false
});
app.use(morgan('short', { stream: accessLogStream }));

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
    // TODO: close monthly database
    process.exit();
});

/////////////////////////////////////////////////
// Server routing and methods

var initData = require('./app/initData');
var baseHelper = require('./app/baseHelper');
var format = require('./app/format');
var search = require('./app/search');

// prepate initial data for full base
var init = initData(base);

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
            console.log(err);
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
    var record = base.store("JobPostings")[id];
    var job = formatStyle(record);
    res.status(200).send(job);
}

///////////////////////////////////////////////////////////////////
// All Records Routers

app.route('/api/v1/jobs')
    // gets all the info of the queried jobs
    .get(function(req, res) {
        formatRequest(req, res, format.toAllInfoFormat);
    })
    // updates the database
    .post(function(req, res) {
        try {
            var record = req.body;
            baseHelper.updateBase(base, record, false);
            // update initialized data
            init.update(record);
            // TODO: create static files of the databases
            res.status(200).end();
        } catch (err) {
            console.log(err);
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
