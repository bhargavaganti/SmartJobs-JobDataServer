var request = require("request");
var assert = require('assert');

describe("Routes", function () {
    this.timeout(10000);
    describe("/stats/", function () {
        it("should return the count, number of jobs, locations and skills", function (done) {
            request("http://localhost:2510/api/v1/stats/count", function (err, res, body) {
                var json = JSON.parse(body);
                assert.notEqual(json.numOfJobs, null);
                assert.notEqual(json.numOfLocations, null);
                assert.notEqual(json.numOfCountries, null);
                assert.notEqual(json.numOfSkills, null);
                done();
            });
        });

        it("should return the lists of skills, locations and countries", function (done) {
            request("http://localhost:2510/api/v1/stats/lists", function (err, res, body) {
                var json = JSON.parse(body);
                // lists exist
                assert.notEqual(json.skills, null);
                assert.notEqual(json.locations, null);
                assert.notEqual(json.countries, null);
                // lists have non-zero count
                assert.notEqual(json.skills.count, 0);
                assert.notEqual(json.locations.count, 0);
                assert.notEqual(json.countries.count, 0);
                // lists are not empty
                assert.notEqual(json.skills.data.length, 0);
                assert.notEqual(json.locations.data.length, 0);
                assert.notEqual(json.countries.data.length, 0);
                done();
            });
        });

        it("should return the lists of skills, locations and countries, length 10", function (done) {
            request("http://localhost:2510/api/v1/stats/lists/10", function (err, res, body) {
                var json = JSON.parse(body);
                // lists exist
                assert.notEqual(json.skills, null);
                assert.notEqual(json.locations, null);
                assert.notEqual(json.countries, null);
                // list counts are 10
                assert.equal(json.skills.count, 10);
                assert.equal(json.locations.count, 10);
                assert.equal(json.countries.count, 10);
                // lists are of length 10
                assert.equal(json.skills.data.length, 10);
                assert.equal(json.locations.data.length, 10);
                assert.equal(json.countries.data.length, 10);
                done();
            });
        });
    });

    describe("/jobs/", function () {
        it("should return the jobs info for the query, skills", function (done) {
            request("http://localhost:2510/api/v1/jobs?skills=css", function (err, res, body) {
                var json = JSON.parse(body);
                // lists exist
                assert.notEqual(json.count, 0);
                assert.notEqual(json.data.length, 0);

                var posting = json.data[0];
                assert.equal(typeof posting.id, "number");
                assert.equal(typeof posting.timestamp, "number");
                assert.equal(typeof posting.date, "string");
                assert.equal(typeof posting.title, "string");
                assert.equal(typeof posting.organization, "string");
                assert.equal(typeof posting.location_coord, "object");
                assert.equal(typeof posting.location_city, "string");
                assert.equal(typeof posting.location_country, "string");
                assert.equal(typeof posting.skillset, "object");
                done();
            });
        });

        it("should return the jobs info for the query, locations", function (done) {
            request("http://localhost:2510/api/v1/jobs?locations=Berlin", function (err, res, body) {
                var json = JSON.parse(body);
                // lists exist
                assert.notEqual(json.count, 0);
                assert.notEqual(json.data.length, 0);

                var posting = json.data[0];
                assert.equal(typeof posting.id, "number");
                assert.equal(typeof posting.timestamp, "number");
                assert.equal(typeof posting.date, "string");
                assert.equal(typeof posting.title, "string");
                assert.equal(typeof posting.organization, "string");
                assert.equal(typeof posting.location_coord, "object");
                assert.equal(typeof posting.location_city, "string");
                assert.equal(typeof posting.location_country, "string");
                assert.equal(typeof posting.skillset, "object");
                done();
            });
        });

        it("should return the jobs info for the query, countries", function (done) {
            request("http://localhost:2510/api/v1/jobs?countries=Germany", function (err, res, body) {
                var json = JSON.parse(body);
                // lists exist
                assert.notEqual(json.count, 0);
                assert.notEqual(json.data.length, 0);

                var posting = json.data[0];
                assert.equal(typeof posting.id, "number");
                assert.equal(typeof posting.timestamp, "number");
                assert.equal(typeof posting.date, "string");
                assert.equal(typeof posting.title, "string");
                assert.equal(typeof posting.organization, "string");
                assert.equal(typeof posting.location_coord, "object");
                assert.equal(typeof posting.location_city, "string");
                assert.equal(typeof posting.location_country, "string");
                assert.equal(typeof posting.skillset, "object");
                done();
            });
        });
    });

    describe("/jobs/locations", function () {
        it("should return the jobs location info for the query, skills", function (done) {
            request("http://localhost:2510/api/v1/jobs/locations?skills=css", function (err, res, body) {
                var json = JSON.parse(body);
                // lists exist
                assert.notEqual(json.count, 0);
                assert.notEqual(json.data.length, 0);

                var posting = json.data[0];
                assert.equal(typeof posting.id, "number");
                assert.equal(typeof posting.location_coord, "object");
                assert.equal(typeof posting.location_city, "string");
                assert.equal(typeof posting.location_country, "string");
                done();
            });
        });

        it("should return the jobs location info for the query, locations", function (done) {
            request("http://localhost:2510/api/v1/jobs/locations?locations=Berlin", function (err, res, body) {
                var json = JSON.parse(body);
                // lists exist
                assert.notEqual(json.count, 0);
                assert.notEqual(json.data.length, 0);

                var posting = json.data[0];
                assert.equal(typeof posting.id, "number");
                assert.equal(typeof posting.location_coord, "object");
                assert.equal(typeof posting.location_city, "string");
                assert.equal(typeof posting.location_country, "string");
                done();
            });
        });

        it("should return the jobs location info for the query, countries", function (done) {
            request("http://localhost:2510/api/v1/jobs/locations?countries=Germany", function (err, res, body) {
                var json = JSON.parse(body);
                // lists exist
                assert.notEqual(json.count, 0);
                assert.notEqual(json.data.length, 0);

                var posting = json.data[0];
                assert.equal(typeof posting.id, "number");
                assert.equal(typeof posting.location_coord, "object");
                assert.equal(typeof posting.location_city, "string");
                assert.equal(typeof posting.location_country, "string");
                done();
            });
        });
    });

    describe("/jobs/skills", function () {
        it("should return the jobs skill info for the query, skills", function (done) {
            request("http://localhost:2510/api/v1/jobs/skills?skills=css", function (err, res, body) {
                var json = JSON.parse(body);
                // lists exist
                assert.notEqual(json.count, 0);
                assert.notEqual(json.data.length, 0);

                var posting = json.data[0];
                assert.equal(typeof posting.id, "number");
                assert.equal(typeof posting.skillset, "object");
                done();
            });
        });

        it("should return the jobs skill info for the query, locations", function (done) {
            request("http://localhost:2510/api/v1/jobs/skills?locations=Berlin", function (err, res, body) {
                var json = JSON.parse(body);
                // lists exist
                assert.notEqual(json.count, 0);
                assert.notEqual(json.data.length, 0);

                var posting = json.data[0];
                assert.equal(typeof posting.id, "number");
                assert.equal(typeof posting.skillset, "object");
                done();
            });
        });

        it("should return the jobs skill info for the query, countries", function (done) {
            request("http://localhost:2510/api/v1/jobs/skills?countries=Germany", function (err, res, body) {
                var json = JSON.parse(body);
                // lists exist
                assert.notEqual(json.count, 0);
                assert.notEqual(json.data.length, 0);

                var posting = json.data[0];
                assert.equal(typeof posting.id, "number");
                assert.equal(typeof posting.skillset, "object");
                done();
            });
        });
    });

        describe("/jobs/locations_and_skills", function () {
            it("should return the jobs location and skills info for the query, skills", function (done) {
                request("http://localhost:2510/api/v1/jobs/locations_and_skills?skills=css", function (err, res, body) {
                    var json = JSON.parse(body);
                    // lists exist
                    assert.notEqual(json.count, 0);
                    assert.notEqual(json.data.length, 0);

                    var posting = json.data[0];
                    assert.equal(typeof posting.id, "number");
                    assert.equal(typeof posting.timestamp, "number");
                    assert.equal(typeof posting.location_coord, "object");
                    assert.equal(typeof posting.location_city, "string");
                    assert.equal(typeof posting.location_country, "string");
                    assert.equal(typeof posting.skillset, "object");
                    done();
                });
            });

            it("should return the jobs location and skills info for the query, locations", function (done) {
                request("http://localhost:2510/api/v1/jobs/locations_and_skills?locations=Berlin", function (err, res, body) {
                    var json = JSON.parse(body);
                    // lists exist
                    assert.notEqual(json.count, 0);
                    assert.notEqual(json.data.length, 0);

                    var posting = json.data[0];
                    assert.equal(typeof posting.id, "number");
                    assert.equal(typeof posting.timestamp, "number");
                    assert.equal(typeof posting.location_coord, "object");
                    assert.equal(typeof posting.location_city, "string");
                    assert.equal(typeof posting.location_country, "string");
                    assert.equal(typeof posting.skillset, "object");
                    done();
                });
            });

            it("should return the jobs location and skills info for the query, countries", function (done) {
                request("http://localhost:2510/api/v1/jobs/locations_and_skills?countries=Germany", function (err, res, body) {
                    var json = JSON.parse(body);
                    // lists exist
                    assert.notEqual(json.count, 0);
                    assert.notEqual(json.data.length, 0);

                    var posting = json.data[0];
                    assert.equal(typeof posting.id, "number");
                    assert.equal(typeof posting.timestamp, "number");
                    assert.equal(typeof posting.location_coord, "object");
                    assert.equal(typeof posting.location_city, "string");
                    assert.equal(typeof posting.location_country, "string");
                    assert.equal(typeof posting.skillset, "object");
                    done();
                });
            });
        });

        describe("/render_jobs", function () {
            it("should return the html containing the number of relevant jobs for the lecture", function (done) {
                var options = {
                    url: "http://localhost:2510/api/v1/render_jobs",
                    form: {
                        lang: "en",
                        title: "Doulion: Counting Triangles in Massive Graphs with a Coin",
                        lecture_id: 9182,
                        video_id: 9340,
                        text: "Counting the number of triangles in a graph is a beautiful algorithmic problem which has gained importance over the last years due to its significant role in complex network analysis. Metrics frequently computed such as the clustering coefficient and the transitivity ratio involve the execution of a triangle counting algorithm. Furthermore, several interesting graph mining applications rely on computing the number of triangles in the graph of interest. In this paper, we focus on the problem of counting triangles in a graph. We propose a practical method, out of which all triangle counting algorithms can potentially benefit. Using a straight-forward triangle counting algorithm as a black box, we performed 166 experiments on real-world networks and on synthetic datasets as well, where we show that our method works with high accuracy, typically more than 99\% and gives significant speedups, resulting in even $\approx$ 130 times faster performance.",
                        categories: "computer science>data mining>graph mining",
                        lecture_slug: "kdd09_tsourakakis_dctmgwc"
                    }
                };

                request.post(options, function (error, res, body) {
                    var html = body;
                    assert.notEqual(html, "");
                    done();
                });

            })
        })
})
