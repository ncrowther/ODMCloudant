// ///////////////////////////////////////////////////////////////////
// Licensed Materials - Property of IBM
// 5725-T17
// Copyright IBM Corp. 2014, 2015. All Rights Reserved.
//
// U.S. Government Users Restricted Rights:
// Use, duplication or disclosure restricted by GSA ADP Schedule
// Contract with IBM Corp.
// ///////////////////////////////////////////////////////////////////

// app.js
// This file contains the server side JavaScript code for the shopping basket discount application.
// This sample application uses express as web application framework (http://expressjs.com/),
// and jade as template engine (http://jade-lang.com/).

var express = require('express')
var cfenv = require('cfenv')
var service = require('./utils/odm')
const logger = require('./logger')

const Cloudant = require('@cloudant/cloudant')

const vcap = require('./config/vcap-local.json')

// setup middleware
var app = express()

// database name
var dbName = 'customerdb'

app.use(express.static(__dirname + '/public')) // setup static public directory
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

var checkDiscountRulesetPath = '/discount/CheckDiscount'


// The section below provides  the credentials to bind to the ODM on Cloud service

var rules = {
  executionRestUrl: 'http://localhost:9090/DecisionService/rest',
  user: 'resAdmin',
  password: 'resAdmin'
}

// /////////////////////// IBM CLOUD /////////////////////////
// get the app environment from Cloud Foundry

var appEnv = cfenv.getAppEnv()

// The section below provides  the credentials to bind to the Cloudant service on IBM Cloud

// Initialize the DB when this module is loaded
var username = 'c9b0d887-7523-46b4-9122-5ca60a387436-bluemix'
var password = '9edfa48393fead9d70a4513965c088b58da08e28514e9ad7c5fbf7d743f9b246'
var cloudant = Cloudant({ account: username, password: password })

// Specify the database we are going to use...
var customerdb = cloudant.use(dbName)

console.log('Connected to db: ' + customerdb + ' using ' + dbName)

// render index page
app.get('/', function (req, res) {
  res.render('purchaseItem')
})

// Invoke work order
app.get('/purchase', function (req, res) {
  // get the request parameters
  var purchaseHistory
  var customerId = req.query.customerId
  var product = req.query.product
  var price = req.query.price * 1000
  var purchaseDate = req.query.purchaseDate

  var rev

  console.log('query.customerId: ' + customerId)

  customerdb.get(customerId, function (err, data) {
    console.log('get customer..')
    if (!err) {
      console.log('Found customer  : ' + JSON.stringify(data))

      purchaseHistory = data.customer.purchaseHistory
      console.log('Found customer purchase history: ' + purchaseHistory)

      rev = data._rev
      console.log(rev)

      invokeDecisionService(customerId, product, price, purchaseDate, purchaseHistory, res, rev)
    } else {
      console.log('Customer not found in database')
      invokeDecisionService(customerId, product, price, purchaseDate, purchaseHistory, res, null)
    }
  })
})

async function invokeDecisionService (customerId, product, price, purchaseDate, purchaseHistory, res, rev) {
  var payload = {
    __DecisionID__: '0',
    customer: {
      customerId: customerId,
      purchase: {
        product: product,
        price: price,
        purchaseTimestamp: purchaseDate
      },
      discount: 0,
      discountReason: '',
      purchaseHistory: purchaseHistory
    }
  }

  console.log('****Payload:', JSON.stringify(payload))

  const results = await service.invokeRulesService(rules, checkDiscountRulesetPath, payload, customerId)

  console.log('***results: ' + JSON.stringify(results))

  if (!customerdb) {
    console.log('NO DB: ')
    return
  }

  if (rev) {
    console.log('Update _rev: ' + rev)
    // insert the event as a document
    customerdb.insert({
      _id: customerId,
      _rev: rev,
      customer: results.customer
    }, function (err, body, header) {
      if (err) {
        return console.log('[customerdb.update] ', err.message)
      } else {
        console.log('Updated Customer in database.')
      }
    })
  } else {
    console.log('Insert ')
    // insert the event as a document
    customerdb.insert({
      _id: customerId,
      customer: results.customer
    }, function (err, body, header) {
      if (err) {
        return console.log('[customerdb.insert] ', err.message)
      } else {
        console.log('Inserted Customer in database.')
      }
    })
  }

  var pricePounds = results.customer.purchase.price * 0.001

  res.render('displayPurchase', {
    customerId: results.customer.customerId,
    product: results.customer.purchase.product,
    pricePounds: pricePounds.toFixed(2),
    purchaseTimestamp: results.customer.purchase.purchaseTimestamp,
    discount: results.customer.discount,
    discountReason: results.customer.discountReason
  })
}

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts
// this application:
var host = ((appEnv.app && appEnv.app.host) || 'localhost')

// The port on the DEA for communication with the application:
var port = ((appEnv.app && appEnv.app.port) || 3000)

// Start server
app.listen(port, host)
console.log('App started on port ' + port)
