var qm = require('qminer');

/**
 * Creates the feature space containing the methods to return the relevant jobs.
 * @param {qm.Base} _base - The QMiner database used to initialize the feature space.
 */
function FeatureSpace() {

    var ftrSpace;

    var recentRecords;       // the recent job postings
    var spConceptMat;        // the concept matrix
    this.jobConcepts = [];   // array of job concepts

    /**
     * Resets the feature space.
     * @param {qm.Base} base - The QMiner database.
     */
    this.reset = function (base) {
        // creates a new instance of feature space, because base might not be allways the same
        // meaning not the same instance (C++ pointers might not point to the same object)
        ftrSpace = new qm.FeatureSpace(base, [
            { type: 'multinomial', source: { store: "JobPostings", join: "wikified" }, field: "name" }
        ]);
        // update the feature space with the job posts from the last 14 days
        // and has the wikified concepts stored
        var date = new Date(Date.now());
        recentRecords = base.store("JobPostings").allRecords.filter(function (job) {
            return job.date.getTime() > date.getTime() - 14*24*60*60*1000;  // two weeks
        });
        ftrSpace.updateRecords(recentRecords);
        // get the sparse concept matrix
        spConceptMat = ftrSpace.extractSparseMatrix(recentRecords);
        // get the job concepts
        this.jobConcepts = base.store("Concepts").allRecords.map(function (rec) {
            return rec.name;
        });
    }

    /**
     * Gets the relevant job postings.
     * @param  {qm.Record} record - The dummy record containing the concepts.
     * @return {Array.<Number>} The list of job ids that are relevant.
     */
    this.getRelevantJobs = function (record) {
        var spVec = ftrSpace.extractSparseVector(record);
        // for each job get the number of concepts that are the same with lectureRec
        var occurenceVec = spConceptMat.multiplyT(spVec);
        // get the relevant job and return id
        var relevantId = [];
        for (var vecId = 0; vecId < occurenceVec.length; vecId++) {
            var relevance = occurenceVec.at(vecId);
            if (relevance !== 0) {
                var jobPosting = recentRecords[vecId];
                relevantId.push(jobPosting.$id);
            }
        }
        return relevantId;
    }

    return this;
}

module.exports = FeatureSpace;
