var Mustache = require('Mustache');
var fs = require('fs');
var path = require('path');

// template path
var filePath = path.join(__dirname, '../data/vl-template/videolectures-edsa-jobs.stache');
var htmlRender = function (options) {
    var data = fs.readFileSync(filePath, { encoding: 'utf-8' });
    return Mustache.render(data, options);
};

module.exports = htmlRender;
