var pug = require('pug');
var htmlRender = pug.compileFile("./data/pug-template/videolectures-edsa-jobs.jade", {
    pretty: true
});


module.exports = htmlRender;
