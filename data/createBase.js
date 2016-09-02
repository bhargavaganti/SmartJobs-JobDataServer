var qm = require('qminer');
var fs = require('fs');

var format = require('../app/format');

// add the last method to JavaScript array
if (!Array.prototype.last){
    /**
     * Gets the last element of the Array.
     * @return {type} - The last element of the array.
     */
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
}

/**
 * The base containing the job postings
 * @type {module:qm.Base}
 */
var base = new qm.Base({
    mode: 'createClean',
    schemaPath: './schema.json'
});

// get data files
var dirPath = './demand/';
var dirFiles = fs.readdirSync(dirPath);

var recordArray = [];

for (var fileN = 0; fileN < dirFiles.length; fileN++) {
    var file = qm.fs.openRead(dirPath + dirFiles[fileN]);
    console.log(dirFiles[fileN]);
    // first line are field names
    file.readLine();
    // save job postings in fields
    while (!file.eof) {
        var line = file.readLine();
        if (line === "") { continue; }
        var fieldsVals = line.split(',');

        if (fieldsVals.length !== 15) {
            continue;
        }

        // get the field data
        var jobUri          = fieldsVals[0];
        var jobUrl          = fieldsVals[1].replace(/;;;/g, ',');
        var jobLocationStr  = fieldsVals[2];
        var date            = fieldsVals[3];
        var jobSource       = fieldsVals[4];
        var jobPostingOrg   = fieldsVals[5];
        var jobTitle        = fieldsVals[6];
        var jobDesc         = fieldsVals[7];
        var locUri          = fieldsVals[8];
        var locLat          = parseFloat(fieldsVals[9]);
        var locLong         = parseFloat(fieldsVals[10]);
        var locName         = fieldsVals[11];
        var countryUri      = fieldsVals[12];
        var countryName     = fieldsVals[13];

        if (!locLat || !locLong) {
            console.log(locLat, locLong);
            continue;
        }

        // get date timestamp
        var dateTm = Date.parse(date);
        // create full and part of date string
        var dateFullStr = "";
        var datePartStr = "";
        var d = new Date("January 01, 2015 00:00:00");
        if (dateTm) {
            d = new Date(dateTm);
            dateFullStr = d.getFullYear().toString() + '-' + (d.getMonth() + 1).toString() + '-' + (d.getDate()).toString();
            datePartStr = d.getFullYear().toString() + '-' + (d.getMonth() + 1).toString();
        }

        // get skill array
        var skillArr = [];
        if (fieldsVals[14]) {
            var skills = fieldsVals[14].split('|');
            if (skills[0] !== '') {
                for (var skillN = 0; skillN < skills.length; skillN++) {
                    var skillUri = skills[skillN];
                    var skillName = skillUri.split('/').last();
                    if (format.EUCountries.indexOf(skillName) !== -1) {
                        console.log(dirFiles[fileN], skillName);
                    }
                    skillArr.push({
                        uri: skillUri,
                        name: skillName
                    });
                }
            }
        }

        // get only the job ID
        switch(jobSource) {
            case "Trovit":
                jobUri = jobUri.match(/\/id\.(.*?)\//)[1];
                break;
            case "Adzuna":
                jobUri = jobUri.split('/').last();
                break;
            default:
                break;
        }


        var country;
        if (countryName !== "") {
            // country data
            country = {
                uri: countryUri,
                name: countryName
            };
        }
        // location data
        var location = {
            uri: locUri,
            coord: [locLong, locLat],
            name: locName,
            inCountry: country
        };

        // source data
        var source = {
            name: jobSource
        };

        // construct object containing job data
        var record = {
            uri: jobUri,
            url: jobUrl,
            name: jobTitle,
            date: date,
            dateFullStr: dateFullStr,
            datePartStr: datePartStr,
            hiringOrganization: jobPostingOrg,
            jobTitle: jobTitle,
            description: jobDesc,
            // join - location
            inLocation: location,
            // join - country
            inCountry: country,
            // join - source
            foundIn: source,
            // join - skill
            requiredSkills: skillArr
        };
        recordArray.push(record);
    }
}
console.log("sorting the records by timestamp");
recordArray.sort(function (a, b) {
    var timestampA = Date.parse(a.date);
    var timestampB = Date.parse(b.date);
    if (timestampA < timestampB) {
        return -1;
    } else if (timestampA > timestampB) {
        return 1;
    } else {
        return 0;
    }
});

console.log("Pushing records to base");
recordArray.forEach(function (record) {
    base.store("JobPostings").push(record);
});

console.log(base.store("JobPostings").length);
// close the base
base.close();
