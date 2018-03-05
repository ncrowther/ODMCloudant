Get started
-----------

This document describes how to set up the Stateful Decision Service on IBM Cloud


Design components
-----------------

Nodejs (app.js entry point) - the 'glue that ties together the the rules and the database
IBM CLoud business rule service - The execution environment containing one or more decision services
Bluemix Cloudant NoSQL DB service - The database that stores purchase events.  For API see https://www.npmjs.com/package/cloudant-nano


Deploying ruleset
-----------------

Deploy Decision Service to the RES in IBM Cloud and connect to the nodejs service

Running Standalone:
-------------------

npm install
npm start


From a browser, visit:

http://localhost:3000/

Running on external IBM Cloud:
https://console.eu-gb.bluemix.net 

Running on INTERNAL IBM Cloud:
https://console.stage1.bluemix.net

cf api https://api.eu-gb.bluemix.net 
cf api https://api.eu-gb.stage1.bluemix.net

cf login --sso
npm install
cf push

For additional instructions see:

https://console.bluemix.net/docs/runtimes/nodejs/getting-started.html#getting-started-tutorial





