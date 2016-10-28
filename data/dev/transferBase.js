var qm = require('qminer');

var oldBase = new qm.Base({
    mode: "openReadOnly",
    dbPath: "../db/"
});

console.log(oldBase.store("JobPostings").length);

var newBase = new qm.Base({
    mode: "createClean",
    schemaPath: "./schema.json",
    dbPath: "../database/"
});


for (var jobId = 0; jobId < oldBase.store("JobPostings").length; jobId++) {
    var job = oldBase.store("JobPostings")[jobId];


    var record = {
        uri: job.uri,
        url: job.url,
        title: job.title,
        date: job.date.toISOString(),
        description: job.description,
        // joins
        inLocation: {
            uri: job.inLocation.uri,
            coord: job.inLocation.coord,
            name: job.inLocation.name,
            inCountry: {
                uri: job.inLocation.inCountry.uri,
                name: job.inLocation.inCountry.name
            }
        },
        inCountry: {
            uri: job.inLocation.inCountry.uri,
            name: job.inLocation.inCountry.name
        },
        forOrganization: {
            title: job.organization
        },

        requiredSkills: job.requiredSkills.map(function (rec) {
            return {
                uri: rec.uri,
                name: rec.name
            };
        }),

        foundConcepts: job.wikified.map(function (rec) {
            return {
                name: rec.name
            };
        }),

        foundIn: {
            name: job.foundIn.name
        }
    };

    newBase.store("Jobs").push(record);
}


console.log(newBase.store("Jobs").length);


oldBase.close();
newBase.close();
