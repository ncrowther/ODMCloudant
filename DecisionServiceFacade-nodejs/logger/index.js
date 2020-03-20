const { createLogger, transports, format } = require('winston');
// eslint-disable-next-line no-unused-expressions

const path = require('path');

// Log locations are relative to the microservices
const logFolder = path.join(process.cwd(), '..', 'log');
const errorLog = path.join(logFolder, 'error.log');
const combinedLog = path.join(logFolder, 'combined.log');
// const exceptionLog = path.join(logFolder, 'exceptions.log');

// Format prints -> 2019-01-30T21:04:33.596Z (info): accounts microservice listening on: port 3000
const obsFormat = format.printf(({
  level, message, timestamp,
}) => `${timestamp} (${level}): ${message}`);

// If app is started in DEBUG mode, log debug events to combined log
const debug_mode = (process.env.NODE_DEBUG == "true") ? true : false;
const combinedLevel = (debug_mode) ? 'debug' : 'info';
//Logger options
const options = {
  combinedLog: {
    filename: combinedLog,
    level: combinedLevel,
  },
  errorLog : {
    filename: errorLog,
    level: 'error',
  } 
}


const logger = createLogger({
  format: format.combine(
    format.splat(),
    format.colorize(),
    format.timestamp(),
    obsFormat,
  ),
  transports: [
    // Log errors to errorLog
    new transports.File(options.errorLog),
    // Log everything to combinedLog
    new transports.File(options.combinedLog),
  ],
});

// If the app is started in non production mode, also log to the console
// TODO start apps in production mode...
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    level: 'debug',
    format: format.combine(
      format.simple(),
    ),
  }));
}

// Expose a handler that adds a log file on a per require basis
logger.addTarget = (file) => {
  logger.add(new transports.File({
    filename: path.join(logFolder, `${file}.log`),
  }));
};

function hideLogData(string, characters) {
  // Used by logger to hash characters from personal identifiable information
  // string is the sensitive data you want to obfuscate
  // characters is the number of right-hand-side characters to display
  // Return value example: #######7949 (phone number) 
  let hashes = '';
  const lastdigits = string.slice(-characters);
  for (var i = 0; i < string.length - 4; i++) {
    hashes += "#"}
  return hashes + lastdigits 
}

function logDBCONN(dbConnString) {
  // Changes password in cleartext to hash characters 
  let transformedString = dbConnString.match(/PWD=([\w\W]*);/);
  if (transformedString) {
    const pw=transformedString[1]
    return dbConnString.replace(pw, '########');
  }
  else {
    return dbConnString
  }
}

module.exports=logger;
module.exports.hideLogData = hideLogData ;
module.exports.logDBCONN = logDBCONN;