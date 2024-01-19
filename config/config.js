var path = require('path')
var fs = require('fs')
require("dotenv").config()
var config = JSON.parse(fs.readFileSync(path.join(__dirname, "/config.json"), 'utf8'))
var CONFIG = {}
CONFIG.ENV = (process.env.NODE_ENV || 'development');
CONFIG.PORT = (process.env.VCAP_APP_PORT || config.port);
// CONFIG.DB_URL = 'mongodb://' + config.mongodb.username + ':' + config.mongodb.password + '@' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database + '?authSource=admin';
CONFIG.DB_URL = 'mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database;
CONFIG.SMTP_HOST = process.env.SMTP_HOST
CONFIG.SMTP_PORT = process.env.SMTP_PORT
CONFIG.SMTP_AUTH = { user: process.env.SMTP_AUTH_USER, pass: process.env.SMTP_AUTH_PW }

module.exports = CONFIG