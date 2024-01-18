var path = require('path')
var fs = require('fs')
require("dotenv").config()
var config = JSON.parse(fs.readFileSync(path.join(__dirname, "/config.json"), 'utf8'))
var CONFIG = {}
CONFIG.ENV = (process.env.NODE_ENV || 'development');
CONFIG.PORT = (process.env.VCAP_APP_PORT || config.port);
// CONFIG.DB_URL = 'mongodb://' + config.mongodb.username + ':' + config.mongodb.password + '@' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database + '?authSource=admin';
CONFIG.DB_URL = 'mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database;
CONFIG.API_KEY = process.env.API_KEY

module.exports = CONFIG