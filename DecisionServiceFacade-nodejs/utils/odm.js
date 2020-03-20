// ///////////////////////////////////////////////////////////////////
// Licensed Materials - Property of IBM
// 5725-T17
// Copyright IBM Corp. 2019. All Rights Reserved.
//
// U.S. Government Users Restricted Rights:
// Use, duplication or disclosure restricted by GSA ADP Schedule
// Contract with IBM Corp.
// ///////////////////////////////////////////////////////////////////

// Module dependencies
var url = require('url')
var https = require('https')
var http = require('http')
var logger = require('../logger')

const os = require('os');
const colors = require('colors');

/*
 * Invoke the Rules Service
 * Requires 3 parameters.  e.g. odm.invokeRulesService(config, rulesetPath, inputParams, function(results) { }
 * config = the RES configuration object
 * rulesetPath = the Decision service (app) URI
 * inputParams = the JSON request object
 */

function getODMCredentials (config) {
  // Config stores base64 encoded password
  // encode 'user:password' in Base64 string for basic authentication of the execution API
  const encodedCredentials = Buffer.from(config.user + ':' + config.password).toString('base64')
  return encodedCredentials
}

function makeRequest (options, postData, guid) {
  return new Promise(function (resolve, reject) {
    logger.info(`${guid} [odm.makeRequest] ${options.path}`.black)
    logger.info(`${guid} [odm.makeRequest] ${postData}`.green)
    const req = http.request(options, (resp) => {
      const response = {
        statusCode: '',
        responseString: ''
      }
      resp.setEncoding('utf-8')
      resp.on('data', function (data) {
        response.responseString += data
      })
      resp.on('end', () => {
        response.statusCode = resp.statusCode
        resolve(response)
      })
    })

    req.on('error', function (err) {
      reject(err)
    })

    req.on('uncaughtException', function (err) {
      reject(err)
    })

    // use its "timeout" event to abort the request
    req.on('timeout', () => {
      req.abort()
      return 'timeout error'
    })

    if (postData) req.write(postData)
    req.end()
  })
};

function invokeRulesService (config, rulesetPath, inputParams, guid) {
  return new Promise(async function (resolve, reject) {
    logger.debug(`${guid} [odm.invokeRulesService] ${config.executionRestUrl}${rulesetPath}`)
    var restUrl = url.parse(config.executionRestUrl);
    var dataString = JSON.stringify(inputParams)
    const encodedCredentials = getODMCredentials(config)

    var headers = {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length,
      Authorization: 'Basic ' + encodedCredentials // basic authentication header
    }

    logger.debug(`${guid} [odm.invokeRulesService] Server host: ${restUrl.host}`)
    logger.debug(`${guid} [odm.invokeRulesService] Server port: ${restUrl.port}`)

    var options = {
      host: restUrl.hostname,
      timeout: 7000,
      port: restUrl.port,
      path: restUrl.path + rulesetPath,
      method: 'POST',
      // Set to false to get round running RES on my laptop which has self-signed certs
      rejectUnauthorized: false,
      ca: [],
      headers: headers
    }

    try {
      const response = await makeRequest(options, dataString, guid)
      if (response.statusCode === 500) {
        const err = new Error('ODM Server unavailable')
        err.code = 'EHOSTDOWN'
        reject(err)
      }
      const responseObject = JSON.parse(response.responseString)
      logger.info(`${guid} [odm.invokeRulesService] response: ${response.responseString}`.yellow)
      resolve(responseObject)
    } catch (err) {
      reject(err)
    }
  })
}

// export public functions
exports.invokeRulesService = invokeRulesService
