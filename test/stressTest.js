var request = require("request");
var fs = require("fs");

function clock(start) {
    if ( !start ) return process.hrtime();
    var end = process.hrtime(start);
    return Math.round((end[0]*1000) + (end[1]/1000000));
}

// TODO: load the job info from .json
var obj = JSON.parse(fs.readFileSync("lectures.json", "utf8").replace(/\\/g, ""));

// how many times do we want to repeat
var numberOfRepetitions = 10;

var count = 0;
var elapsedTime = 0;
var intervalId = setInterval(function () {
    // start time
    var t0 = clock();
    // randomly select and id and make a request to the server
    var id = Math.floor((obj.length - 0.001) * Math.random());
    console.log("Id randomly selected", id);
    var options = obj[id];
    request.post(options, function (error, respnse, body) {
        // measure time
        elapsedTime += clock(t0);
    });
    console.log("Number of secords:", count, "s");
    count++;

    if (count == numberOfRepetitions) {
    console.log("The average time to make", numberOfRepetitions,
        "request to VideoLectures is", elapsedTime / numberOfRepetitions, "ms");
    clearInterval(intervalId);
    }

}, 1000); // repeat every one second
