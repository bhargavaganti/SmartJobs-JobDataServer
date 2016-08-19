var qm = require('qminer');
var fs = require('fs');

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

for (var fileN = 0; fileN < dirFiles.length; fileN++) {
    var file = qm.fs.openRead(dirPath + dirFiles[fileN]);
    console.log(dirFiles[fileN]);
    // first line are field names
    file.readLine();
    // save job postings in fields
    while (!file.eof) {
        var fieldsVals = file.readLine().split(',');
        // get the field data
        var jobUri          = fieldsVals[0];
        var jobUrl          = fieldsVals[1].replace(/;;;/g, ',');
        var jobLocationStr  = fieldsVals[2];
        var date            = fieldsVals[3].split('+')[0];
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
        var skills          = fieldsVals[14].split('|');

        // get date timestamp
        var dateTm = Date.parse(date);
        // create full and part of date string
        var dateFullStr = "";
        var datePartStr = "";
        if (dateTm) {
            var d = new Date(dateTm);
            dateFullStr = d.getFullYear().toString() + '-' + (d.getMonth() + 1).toString() + '-' + (d.getDate() + 1).toString();
            datePartStr = d.getFullYear().toString() + '-' + (d.getMonth() + 1).toString();
        }

        // get skill array
        var skillArr = [];
        if (skills[0] !== '') {
            for (var skillN = 0; skillN < skills.length; skillN++) {
                var skillUri = skills[skillN];
                var skillName = skillUri.split('/').last();
                skillArr.push({
                    uri: skillUri,
                    name: skillName
                });
            }
        }

    	if (countryName == "http://sws.geonames.org/2921044") {
    		countryName = "Germany";
    		console.log("Germany");
    	} else if (countryName == "http://sws.geonames.org/2658434") {
    		countryName="Switzerland";
    		console.log("Switzerland");
    	} else if (countryName == "http://sws.geonames.org/3175395") {
    		countryName = "Italy";
    		console.log("Italy");
    	} else if (countryName == "http://sws.geonames.org/2635167") {
            countryName = "United Kingdom";
            console.log("United Kingdom");
        }

        // country data
        var country = {
            uri: countryUri,
            name: countryName
        };

        // location data
        var location = {
            uri: locUri,
            lat: locLat,
            long: locLong,
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
        base.store("JobPostings").push(record);
    }
}
console.log(base.store("JobPostings").length);
// close the base
base.close();
