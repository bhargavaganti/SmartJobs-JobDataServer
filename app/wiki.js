
var Client = require('node-rest-client').Client;
var querystring = require('querystring');
var qm = require('qminer');
var search = require('./search');

/////////////////////////////////////////////////
// Wikifier functions

function wikifyText(req, res) {
	try {
    	var endpoint = "http://wikifier.org/annotate-article";
    	var datas = {
			'text': req.query.text,
			'lang': req.query.lang,
			'out': 'extendedJson',
			'jsonForEval': 'true',
            'userKey': 'usppmjvabjnzltltvihvylppekbiuf'
		};
    	endpoint += '?' + querystring.stringify(datas);
    	var client = new Client();
    	client.get(endpoint, function (data, response) {
    		var annots = data.annotations;
    		var wikiresult = {
    			count: annots.length,
    		    annotations: annots
            };
    	    res.status(200).send(wikiresult);
			return;
    	});
	} catch (err) {
        res.status(500).send({
            error: "Error on the Server Side..."
        });
		return;
	}
}

function suggestJobs(req, res, formatStyle, base) {
	try {
    	var endpoint = "http://wikifier.org/annotate-article";
    	var datas = {
			'text': req.query.text,
			'lang': req.query.lang,
			'out': 'extendedJson',
			'jsonForEval': 'true',
            userKey: 'usppmjvabjnzltltvihvylppekbiuf'
		};
    	endpoint += '?' + querystring.stringify(datas);
    	var client = new Client();
    	client.get(endpoint, function (data, response) {
    		var annots = data.annotations;
    		var wikiresult = {
    			count: annots.length,
    			annotations: annots
            };
    		var anarray = [];
    		for (var an = 0; an < annots.length; an++) {
    			var ant = annots[an];
    			if (ant.title) {
                    anarray.push(ant.title);
                }
    		}
    		var query = {
    			wiki: anarray
    		};

    		if (Object.keys(query).length === 0 && query instanceof Object) {
            	res.status(400).send({
                    error: "Empty Query Sent"
                });
        	} else {
                // get the recordset
                var answer = search.wikiQuery(query, base);
    			if (answer instanceof Array || answer instanceof qm.RecSet) {
            		var jobs = formatStyle(answer);
                 	res.status(200).send(jobs);
					return;
            	} else {
                    // invalid query info
                    res.status(400).send({
                        error: answer
                    });
					return;
    	        }
            }
    	});
	} catch (err) {
        res.status(500).send({
            error: "Error on Server Side..."
        });
		return;
	}
}

// export functions
module.exports = {
    wikifyText: wikifyText,
    suggestJobs: suggestJobs
};
