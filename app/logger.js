var winston = require('winston');
var path = require('path');
var fs = require('fs');
winston.transports.DailyRotateFile = require('winston-daily-rotate-file');

module.exports = function (directoryPath) {
    // setup info streams
    var requestDirectory = path.join(__dirname, '../', directoryPath);
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

    return logger;
}
