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
var service = require('./service')
var Cloudant = require('cloudant')
// var cookieParser = require('cookie-parser')
var createError = require('http-errors')
var path = require('path')
var logger = require('morgan')

// setup middleware
var app = express()

const ODM_URL = process.env.odm_url || 'https://uk-cp4a-deployment-odm-ds-console-route-cp4a-all.mycluster-lon02-b3c8x32-4d2c0e6e364e1cb6bda1360a996d18f0-0000.eu-gb.containers.appdomain.cloud/DecisionService/rest'
const ODM_SECRET_USER = process.env.odm_secret_user || 'INVALID ODM USER'
const ODM_SECRET_PASSWORD = process.env.odm_secret_password || 'INVALID ODM PASSWORD'

const CLOUDANT_SECRET_USER = process.env.cloudant_secret_user || 'INVALID CLOUDANT USER'
const CLOUDANT_SECRET_PASSWORD = process.env.cloudant_secret_password || 'INVALID CLOUDANT PASSWORD'

console.log('ODM_SECRET_USER: ' + ODM_SECRET_USER)
console.log('ODM_SECRET_PASSWORD : ' + ODM_SECRET_PASSWORD)
console.log('CLOUDANT_SECRET_USER: ' + CLOUDANT_SECRET_USER)
console.log('CLOUDANT_SECRET_PASSWORD : ' + CLOUDANT_SECRET_PASSWORD)

// Initialize the DB when this module is loaded
// var username = '724c8e7f-5faa-49e1-8dc0-7a39ffd871ad-bluemix'
// var password = '4b70c44615f871a95e501f5ce871a607072d69e206ad76af5ad020aa7e205f64'
var cloudant = Cloudant({ account: CLOUDANT_SECRET_USER, password: CLOUDANT_SECRET_PASSWORD })
// database name
var dbName = 'customerdb'

app.use(logger('dev'))

// view engine setup
// app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
// app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))

// app.use(express.static(__dirname + '/public')) // setup static public directory
// app.set('view engine', 'pug')
// app.set('views', __dirname + '/views')

var checkDiscountRulesetPath = '/discount/CheckDiscount'

// The section below provides  the credentials to bind to the ODM on Cloud service
var rules = {
  executionRestUrl: ODM_URL,
  user: ODM_SECRET_USER,
  password: ODM_SECRET_PASSWORD
}

// ///////////////////////

// Create a new database.
cloudant.db.create(dbName, function (err, data) {
  if (!err) {
    // err if database doesn't already exists
    console.log('Created database: ' + dbName)
  } else {
    console.log('DB already created: ' + dbName)
  }
})

// Specify the database we are going to use...
var customerdb = cloudant.db.use(dbName)

console.log('Connected to db: ' + customerdb + ' using ' + dbName)

// render index page
app.get('/', function (req, res) {
  console.log('P{urchase Item}')

  res.render('purchaseItem')
})

// Invoke work order
app.get('/purchase', function (req, res) {
  console.log('Purchase')

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

      // ///////////////////////
      invokeDecisionService(customerId, product, price, purchaseDate, purchaseHistory, res, rev)
    } else {
      console.log('Customer not found in database')
      invokeDecisionService(customerId, product, price, purchaseDate, purchaseHistory, res, null)
    }
  })
})

function invokeDecisionService (customerId, product, price, purchaseDate, purchaseHistory, res, rev) {
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

  service.invokeRulesService(rules, checkDiscountRulesetPath, payload, function (results) {
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
  })
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

/*
// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts
// this application:
var host = 'localhost'

// The port on the DEA for communication with the application:
var port = 8080
// Start server
app.listen(port, host)

console.log('App started on port ' + port)

*/

module.exports = app
