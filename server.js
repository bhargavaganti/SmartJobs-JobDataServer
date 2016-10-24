var express = require('express');
var cors = require("cors");
var path = require('path');
var fs = require('fs');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var FileStreamRotator = require('file-stream-rotator');

var app = express();
// set static folder
app.options("*", cors())
    .use(cors())
    .use(express.static(__dirname + '/public'))
    .use(bodyParser.json({limit: '50mb'}))
    .use(bodyParser.urlencoded({limit: '50mb', extended: true}));

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


/////////////////////////////////////////////////
/// Prepare global variables

cache = require('./app/cache')();
// setup info streams
var requestDirectory = path.join(__dirname, 'log', 'request');
if (!fs.existsSync(requestDirectory)) {
    fs.mkdirSync(requestDirectory);
}
logger = require('./app/logger')(requestDirectory);

var storage = require('./app/storage');
featureSpace = new storage.FeatureSpace();
var postings = new storage.Postings();
database = new storage.Database();
// on CTRL+C
process.on('SIGINT', function() {
    database.getBase().close();
    process.exit();
});

// initial preparation of feature space
featureSpace.reset(database.getBase());

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

///////////////////////////////////////
/// Routes for database updating
var responseHandlers = require('./app/responseHandler');

/// Import all API versions
var version1 = require('./routes/v1/app');
var version2 = require('./routes/v2/app');

// closes and restarts the base (it stores the data)
app.route('/api/database')
    // updates the database with posted info
    .get(function(req, res, next) {
        try {
            database.update(postings);
            // clear the storage
            postings.clear();
            // Resets cache
            cache.deleteAll();

            ///////////////////////////////
            // Reseting helper functions
            featureSpace.reset(database.getBase());

            logger.info("Database updated");
            next();
        } catch (err) {
            logger.info("Unsucessful Database update", {
                err_message: err.message
            });
            return responseHandlers.serverErrorHandler(req, res, "Error on Server Side. Unsucessful Update.");
        }
    })
    // posts the record info
    .post(function(req, res) {
        var postings = req.body;
        try {
            // stores the postings and saves them locally
            postings.storePostings(postings);
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

// use the versions
app.use('/api', version1);
app.use('/api', version2);

// response on database update
app.get('/api/database', function (req, res, next) {
    return responseHandlers.successHandler(req, res, "Successful Update");
});

/////////////////////////////////////////////////
// Run the server
var PORT = 2510;
app.listen(PORT, function() {
    console.log("JobAnalytics data server listening on port:", PORT);
});
