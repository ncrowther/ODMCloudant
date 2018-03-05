/////////////////////////////////////////////////////////////////////
// Licensed Materials - Property of IBM
// 5725-T17 
// Copyright IBM Corp. 2014, 2015. All Rights Reserved.
//
// U.S. Government Users Restricted Rights: 
// Use, duplication or disclosure restricted by GSA ADP Schedule 
// Contract with IBM Corp.
/////////////////////////////////////////////////////////////////////

// Module dependencies
var url = require('url')
  , https = require('https');



/*
 * Invoke the Rules Service 
 */
function invokeRulesService(rules, rulesetPath, inputParams, callback) {
  var restUrl = url.parse(rules.executionRestUrl);
  var dataString = JSON.stringify(inputParams);
  // encode 'user:password' in Base64 string for basic authentication of the execution API
  var encodedCredentials = new Buffer(rules.user+':'+rules.password).toString('base64');

  var headers = {
    'Content-Type': 'application/json',
    'Content-Length': dataString.length,
	'Authorization': 'Basic ' + encodedCredentials // basic authentication header
  };
  console.log( restUrl.host);
  console.log(restUrl.port);
 
  var options = {
    host: restUrl.hostname,
    //test
    port: restUrl.port,
	path: restUrl.path + rulesetPath,
    method: 'POST',
    //TODO do not use this in live - this is to get round running RES on my laptop which has self-signed certs
    rejectUnauthorized: false,
    headers: headers
  };

  var req = https.request(options, function(resp) {
    resp.setEncoding('utf-8');
    var responseString = '';

    resp.on('data', function(data) {
      responseString += data;
    });

    resp.on('end', function() {
      console.log(responseString);
	  if (resp.statusCode === 200) {
        var responseObject = JSON.parse(responseString);
        callback(responseObject);
	  } else {
		  console.log("An unexpected response occured");
		  callback(null);
	  }
    });
  });
  
  req.on('error', function(e) {
      console.log(e.message);
    });
  
  req.write(dataString);
  req.end();
}

// export public functions
exports.invokeRulesService = invokeRulesService;
