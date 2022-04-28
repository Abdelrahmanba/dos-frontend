var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
require('dotenv').config()
var front = require('./routes/front')

var app = express()
app.disable('etag')

// app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({ extended: false }))
// app.use(cookieParser())

app.use(front)

module.exports = app
